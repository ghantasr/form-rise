# formrise — System Architecture Document

**Version:** 1.0  
**Date:** May 2026  
**Author:** Siva Sai Nadh Reddy  
**Stack:** React 19 · ASP.NET Core 9 · PostgreSQL 16 · Redis 7 · Docker · Hetzner

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Infrastructure](#2-infrastructure)
3. [Container Architecture](#3-container-architecture)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Database Schema](#6-database-schema)
7. [Key Data Flows](#7-key-data-flows)
8. [External Services](#8-external-services)
9. [Security Model](#9-security-model)
10. [PWA & Offline Architecture](#10-pwa--offline-architecture)
11. [CI/CD Pipeline](#11-cicd-pipeline)
12. [Deployment Procedure](#12-deployment-procedure)
13. [Troubleshooting Reference](#13-troubleshooting-reference)

---

## 1. High-Level Overview

formrise is a full-stack form builder SaaS that lets users create, publish, and collect responses for forms — with offline support, QR code sharing, and a template library. It is built as a single-tenant monolith on a single VPS and is designed to be cheap to run (~$6/month) while handling all typical form builder workloads.

```
User (browser / PWA)
        │
        ▼
  Cloudflare CDN + DNS
        │
        ▼
  Hetzner VPS  95.216.199.142
        │
   ┌────┴────────────────────────┐
   │  Docker Compose             │
   │  ┌────────┐  ┌───────────┐  │
   │  │ Caddy  │  │ Frontend  │  │
   │  │ :443   │  │ nginx:80  │  │
   │  └───┬────┘  └─────▲─────┘  │
   │      │   /*         │        │
   │      │   /api/* ────┤        │
   │      │         ┌────▼──────┐ │
   │      └────────►│  Backend  │ │
   │                │ ASP.NET 9 │ │
   │                │   :8080   │ │
   │                └─────┬─────┘ │
   │          ┌───────────┴────┐  │
   │     ┌────▼────┐     ┌─────▼┐ │
   │     │Postgres │     │Redis │ │
   │     │  :5432  │     │:6379 │ │
   │     └─────────┘     └──────┘ │
   └─────────────────────────────┘
```

---

## 2. Infrastructure

### Server
| Property | Value |
|---|---|
| Provider | Hetzner Cloud |
| IP Address | 95.216.199.142 |
| OS | Ubuntu Linux |
| Cost | ~€5.90 / month |
| Runtime | Docker Engine + Docker Compose |

### DNS & CDN
| Property | Value |
|---|---|
| Provider | Cloudflare |
| Domain | formrise.fyi (~$6/year via Cloudflare Registrar) |
| A Record | formrise.fyi → 95.216.199.142 |
| Proxied | Yes (Cloudflare sits in front, provides DDoS protection + CDN) |

### Email DNS Records (in Cloudflare)
| Type | Name | Purpose |
|---|---|---|
| TXT | formrise.fyi | Brevo verification code |
| CNAME | mail._domainkey | DKIM signature (email authenticity) |
| TXT | formrise.fyi | SPF record (authorised senders) |
| TXT | _dmarc | DMARC policy (reject spoofed emails) |

These four records together ensure emails from `noreply@formrise.fyi` land in inbox rather than spam.

---

## 3. Container Architecture

All services are defined in `docker-compose.prod.yml` on the server and run as Docker containers.

```
┌──────────────────────────────────────────────────────────────────┐
│  formrise-caddy-1     (caddy:latest)                            │
│  Ports: 0.0.0.0:80→80, 0.0.0.0:443→443                        │
│  Volumes: ./Caddyfile, /etc/letsencrypt (TLS certs)             │
│  Role: Reverse proxy, automatic HTTPS via Let's Encrypt         │
│  Routes:                                                         │
│    /*       → formrise-frontend-1:80                            │
│    /api/*   → formrise-backend-1:8080                           │
│    /f/*     → formrise-backend-1:8080                           │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  formrise-frontend-1  (nginx:alpine)                            │
│  Port: internal :80                                              │
│  Built from: frontend/Dockerfile (node:24-alpine build stage)   │
│  Serves: pre-built Vite bundle from /usr/share/nginx/html       │
│  nginx.conf: all routes → index.html (SPA fallback)            │
│  Also serves static files: manifest.json, sw.js,               │
│                             robots.txt, sitemap.xml, icons/     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  formrise-backend-1   (mcr.microsoft.com/dotnet/aspnet:9.0)     │
│  Port: internal :8080                                            │
│  Built from: backend/Dockerfile                                  │
│  On startup: runs EF Core migrations automatically              │
│  Depends on: postgres (healthy), redis (healthy)                │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  formrise-postgres-1  (postgres:16-alpine)                      │
│  Port: internal :5432                                            │
│  Volume: pgdata (persistent across container restarts)          │
│  DB name: formflow | User: formflow                              │
│  Healthcheck: pg_isready every 10s, 5 retries                   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  formrise-redis-1     (redis:7-alpine)                          │
│  Port: internal :6379                                            │
│  Config: maxmemory 100mb, eviction policy allkeys-lru           │
│  Healthcheck: redis-cli ping every 10s, 5 retries               │
│  Used for: template list cache (10 min TTL)                     │
└──────────────────────────────────────────────────────────────────┘
```

### Environment Variables (stored in `/opt/formrise/.env`)
```
DB_USER                 formflow
DB_PASSWORD             <secret>
JWT_SECRET              <secret>
BREVO_SMTP_USER         <brevo account email>
BREVO_SMTP_PASS         xsmtpsib-<key>  ← rotated if auth fails
APP_BASE_URL            https://formrise.fyi
VITE_GOOGLE_CLIENT_ID   <google oauth client id>
```

---

## 4. Frontend Architecture

### Tech Stack
| Library | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool, dev server |
| TypeScript | 6 | Type safety |
| React Router | 6 | Client-side routing |
| Zustand | 5 | Global state management |
| Axios | 1 | HTTP client |
| Tailwind CSS | 4 | Utility CSS |
| idb | 8 | IndexedDB wrapper (offline queue) |
| lucide-react | 1 | Icons |
| recharts | 3 | Response charts |
| qrcode.react | 4 | QR code generation |
| @dnd-kit | 6/10 | Drag-and-drop field reordering |

### Route Structure
```
App.tsx
├── /                       Landing          (public, standalone layout)
├── /login                  Login            (public)
├── /f/:slug                FormFill         (public)
├── /f/:slug/thank-you      ThankYou         (public)
│
├── OptionalAuthLayout       ← shows AppLayout if authed, bare if not
│   └── /templates          Templates
│         authenticated  → AppLayout (sidebar + hamburger)
│         unauthenticated → standalone (own header with Sign in CTA)
│
└── ProtectedRoute           ← redirects to /login if not authenticated
    └── AppLayout            (sidebar on desktop, hamburger on mobile)
        ├── /dashboard       Dashboard
        ├── /forms/new       FormBuilder
        ├── /forms/:id/edit  FormBuilder
        ├── /forms/:id/responses  FormResponses
        └── /settings        Settings
```

### State Management (Zustand)

**authStore**
```
{
  user: { id, email, name, avatar },
  token: string | null,          ← JWT, in memory only
  isAuthenticated: boolean,
  isLoading: boolean,            ← true during initial refresh attempt
  login(token, user),
  logout(),
  setLoading(bool)
}
```

**formStore** (used inside FormBuilder)
```
{
  form: Form | null,
  fields: FormField[],
  selectedFieldId: string | null,
  isDirty: boolean,
  isSaving: boolean,
  setForm, setTitle, addField, removeField,
  updateField, reorderFields, selectField,
  setSaving, setDirty, reset
}
```

### API Layer (Axios)
```
/src/api/client.ts
  - baseURL: /api
  - withCredentials: true  (sends HttpOnly cookie for refresh)
  - Request interceptor:
      if (accessToken) headers.Authorization = `Bearer ${token}`
  - Response interceptor:
      on 401:
        → POST /api/auth/refresh
        → if success: store new token, retry original request
        → if fail:    logout() + navigate('/login')

/src/api/forms.ts       formsApi    (list, get, create, update, delete, publish)
/src/api/responses.ts   responsesApi (list, submit, delete, exportCsv)
```

### Session Initialisation (AppInitializer)
Runs once on every page load inside `<BrowserRouter>`:
```
1. Check localStorage for key 'fr_has_session'
2. If missing → setLoading(false), stay unauthenticated (no API call)
3. If present → POST /api/auth/refresh (browser sends HttpOnly cookie)
4. On success → store access token in memory, set isAuthenticated=true
5. On failure → remove 'fr_has_session', stay unauthenticated
6. Either way → setLoading(false)
```
The 'fr_has_session' key contains no sensitive data — it only prevents an unnecessary 401 on every public page load.

---

## 5. Backend Architecture

### Tech Stack
| Library | Version | Purpose |
|---|---|---|
| ASP.NET Core | 9 | Web framework |
| Entity Framework Core | 9 | ORM (code-first migrations) |
| Npgsql | 9 | PostgreSQL driver |
| StackExchange.Redis | 2 | Redis client |
| FluentValidation | - | Request validation |
| MailKit / MimeKit | - | SMTP email sending |
| BouncyCastle | - | JWT crypto |
| System.IdentityModel.Tokens.Jwt | - | JWT generation/validation |

### Middleware Pipeline (in order)
```
1. ResponseCompression     → gzip all responses
2. ErrorHandlingMiddleware → catch all unhandled exceptions, return JSON error
3. CORS                    → allow only APP_BASE_URL origin
4. Authentication          → validate JWT Bearer token
5. Authorization           → enforce [Authorize] attributes
6. RateLimiter             → per-IP request rate limits
7. MapControllers          → route to controller actions
```

### Controllers & Endpoints

**AuthController** `/api/auth`
```
POST /google              Verify Google id_token → upsert user → return JWT + set cookie
POST /email/send-otp      Generate 6-digit OTP → send via Brevo → store hashed in DB
POST /email/verify        Verify OTP → return JWT + set cookie
POST /refresh             Validate refresh token from cookie → return new JWT
POST /logout              Clear refresh token from DB + expire cookie
```

**FormsController** `/api/forms` `[Authorize]`
```
GET    /                  List authenticated user's forms
POST   /                  Create new form (auto-generates slug)
GET    /:id               Get form with fields
PUT    /:id               Update form title, description, fields, settings
DELETE /:id               Delete form (cascades to fields + responses)
POST   /:id/publish       Set Status=active, IsPublic=true
POST   /:id/unpublish     Set Status=draft, IsPublic=false
```

**PublicFormController** `/api/f`
```
GET    /:slug             Get public active form (for respondents)
GET    /:slug/verify-access?email=  Check if email on allow-list
POST   /:slug/responses   Submit form response
```

**ResponsesController** `/api/forms/:id/responses` `[Authorize]`
```
GET    /                  List all responses for a form
DELETE /:responseId       Delete a single response
GET    /export            Export all responses as CSV
```

**QrController** `/api/forms/:id/qr-tokens` `[Authorize]`
```
GET    /                  List QR tokens for form
POST   /                  Create new QR token (with optional label)
DELETE /:tokenId          Delete QR token
```

**TemplateController** `/api/templates`
```
GET    /                  List templates (only UserId=template-user, cached 10 min in Redis)
POST   /:slug/fork        [Authorize] Deep-copy template → new draft form for user
```

### Dependency Injection (Services)

**IAuthService**
- Verifies Google OAuth id_token via `oauth2.googleapis.com/tokeninfo`
- Generates OTP (6-digit random), stores SHA256 hash + expiry in DB
- Creates JWT: sub=userId, exp=15min, signed with JWT_SECRET (HS256)
- Creates refresh token: UUID, stored hashed in DB, set as HttpOnly cookie (7 days)

**IFormService**
- CRUD operations on Forms and FormFields
- Slug generation: random 8-character alphanumeric, collision-checked
- Handles field sort order on add/remove/reorder

**IResponseService**
- Validates QR token (single-use: checks UsedAt is null, sets it on use)
- Validates AllowedEmails if form is restricted
- Writes FormResponse + one FieldAnswer row per submitted field
- Increments Form.ResponseCount
- CSV export: builds CSV from all responses with field headers

**IForkService**
- `GetTemplatesAsync`: filters `UserId == TemplateUserId && IsPublic && Status==active`, cached in Redis
- `ForkAsync`: deep-copies Form + all FormFields into a new draft form, increments ForkCount, invalidates Redis cache

**IQrService**
- Generates UUID-based QR tokens linked to a form
- Each token can only be used once (LimitOneResponse enforced at submission)

**IEmailService**
- Connects to Brevo SMTP relay (smtp-relay.brevo.com:587, STARTTLS)
- Authenticates with SMTP key (not account password) from environment
- Sends OTP emails from `noreply@formrise.fyi`

---

## 6. Database Schema

```
┌─────────────────────────────────────────────────────┐
│  Users                                              │
│  Id (uuid, PK)                                      │
│  Email (varchar, unique)                            │
│  Name (varchar)                                     │
│  Avatar (varchar, nullable)                         │
│  GoogleId (varchar, nullable)                       │
│  RefreshToken (varchar, nullable, hashed)           │
│  RefreshTokenExpiry (timestamptz, nullable)         │
│  OtpHash (varchar, nullable)                        │
│  OtpExpiry (timestamptz, nullable)                  │
│  CreatedAt (timestamptz)                            │
└──────────────────────┬──────────────────────────────┘
                       │ 1:many
┌──────────────────────▼──────────────────────────────┐
│  Forms                                              │
│  Id (uuid, PK)                                      │
│  UserId (uuid, FK → Users)                          │
│  Slug (varchar 12, unique index)                    │
│  Title (varchar 300)                                │
│  Description (text, nullable)                       │
│  Status (varchar 20) — 'draft' | 'active'           │
│  IsPublic (bool)                                    │
│  AllowAnonymous (bool)                              │
│  CollectEmail (bool)                                │
│  LimitOneResponse (bool)                            │
│  ShuffleFields (bool)                               │
│  ShowProgress (bool)                                │
│  AcceptFrom (timestamptz, nullable)                 │
│  AcceptUntil (timestamptz, nullable)                │
│  AllowedEmails (text[], nullable)                   │
│  ThankYouMsg (text)                                 │
│  ForkedFromId (uuid, FK → Forms, nullable)          │
│  ForkCount (int, default 0)                         │
│  ResponseCount (int, default 0)                     │
│  CreatedAt / UpdatedAt (timestamptz)               │
└───────┬──────────────────────┬──────────────────────┘
        │ 1:many               │ 1:many
┌───────▼────────┐    ┌────────▼──────────────────────┐
│  FormFields    │    │  FormResponses                │
│  Id (uuid, PK) │    │  Id (uuid, PK)                │
│  FormId (FK)   │    │  FormId (FK → Forms)          │
│  FieldType     │    │  RespondentEmail (nullable)    │
│  Label         │    │  QrTokenId (uuid, nullable)   │
│  Placeholder   │    │  SubmittedAt (timestamptz)    │
│  HelpText      │    └──────────┬────────────────────┘
│  IsRequired    │               │ 1:many
│  SortOrder     │    ┌──────────▼────────────────────┐
│  Options(jsonb)│    │  FieldAnswers                 │
│  Validation    │    │  Id (uuid, PK)                │
│  Conditional   │    │  ResponseId (FK)              │
│  CreatedAt     │    │  FieldId (FK → FormFields)    │
└────────────────┘    │  Value (text, nullable)       │
                      │  NumericValue (float, nullable)│
                      │  ValuesArray (text[], nullable)│
                      └───────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  QrTokens                                           │
│  Id (uuid, PK)                                      │
│  FormId (FK → Forms)                                │
│  Label (varchar, nullable)                          │
│  UsedAt (timestamptz, nullable) ← null = available  │
│  CreatedAt (timestamptz)                            │
└──────────────────────────────────────────────────────┘
```

**Special User:**  
`Id = 00000000-0000-0000-0000-000000000001`  
`Email = templates@formrise.fyi`  
All 71 community templates are owned by this system user. Template API filters by this UserId.

**Field Types supported:** `text` · `textarea` · `email` · `phone` · `number` · `dropdown` · `radio` · `checkbox` · `rating` · `date`

---

## 7. Key Data Flows

### 7.1 Google OAuth Login
```
1. User clicks "Sign in with Google"
2. Google OAuth popup opens (via @react-oauth/google)
3. User authenticates → Google returns id_token (JWT)
4. Frontend: POST /api/auth/google { idToken }
5. Backend:
   a. GET https://oauth2.googleapis.com/tokeninfo?id_token=<token>
   b. Verify audience matches GOOGLE_CLIENT_ID
   c. Extract email, name, avatar, googleId
   d. Upsert User row (INSERT or UPDATE)
   e. Generate JWT (HS256, 15 min, sub=userId)
   f. Generate refresh token (UUID → SHA256 stored in DB)
   g. Set refresh token as HttpOnly cookie (SameSite=Strict, 7 days)
   h. Return { accessToken, user }
6. Frontend:
   a. Store accessToken in Zustand authStore (memory only)
   b. Set localStorage 'fr_has_session' = '1'
   c. Navigate to /dashboard
```

### 7.2 Email OTP Login
```
1. User enters email → POST /api/auth/email/send-otp { email }
2. Backend:
   a. Generate 6-digit OTP
   b. Store SHA256(OTP) + expiry (5 min) in Users table
   c. Send email via Brevo SMTP: "Your formrise code is 123456"
3. User enters OTP → POST /api/auth/email/verify { email, otp }
4. Backend:
   a. Look up user by email
   b. Verify SHA256(otp) matches stored hash and not expired
   c. Clear OTP fields in DB
   d. Continue same as Google OAuth from step 5e
```

### 7.3 Silent Token Refresh
```
Scenario A — App load:
  AppInitializer mounts → checks 'fr_has_session' in localStorage
  → present: POST /api/auth/refresh (browser auto-sends HttpOnly cookie)
  → Backend: validates refresh token hash in DB, checks expiry
  → Returns new JWT
  → Frontend: updates authStore, app loads as authenticated

Scenario B — Mid-session (Axios interceptor):
  Any API call returns 401
  → Interceptor catches it
  → POST /api/auth/refresh
  → On success: store new token, retry original request transparently
  → On failure: logout() + navigate('/login')
```

### 7.4 Building a Form
```
User navigates to /forms/new
  → FormBuilder mounts, no id param
  → POST /api/forms { title: "Untitled Form" }
  → Backend creates form (Status=draft), returns form with generated slug
  → navigate to /forms/:id/edit (replaces history entry)

User adds/edits fields
  → formStore updates (isDirty=true)
  → Debounce timer starts (3 seconds)
  → After 3s of no changes: PUT /api/forms/:id { title, fields }
  → UI shows "Saving..." → "Saved"

User clicks Publish
  → POST /api/forms/:id/publish
  → Backend sets Status=active, IsPublic=true
  → PublishModal shows shareable URL and QR code
```

### 7.5 Form Submission (Online)
```
Respondent opens /f/:slug
  → GET /api/f/:slug → returns form with fields
  → If form has AllowedEmails: show email gate first
    → GET /api/f/:slug/verify-access?email=user@example.com
  → Respondent fills fields
  → Client-side validation (required fields, formats)
  → POST /api/f/:slug/responses {
      respondentEmail, qrToken, answers: [{ fieldId, value }]
    }
  → Backend:
      a. Look up form by slug, check Status=active
      b. If qrToken: find QrToken, verify UsedAt=null, set UsedAt=now
      c. If AllowedEmails: check respondentEmail is in array
      d. INSERT FormResponse
      e. INSERT FieldAnswer for each answer
      f. Increment Form.ResponseCount
  → Navigate to /f/:slug/thank-you with ThankYouMsg
```

### 7.6 Offline Form Submission
```
navigator.onLine === false at submit time
  → Skip API call
  → offlineQueue.enqueue({ slug, respondentEmail, qrToken, answers })
  → Stored in IndexedDB (browser's local database, survives page close)
  → Navigate to thank-you with offline message

When browser comes back online
  → window fires 'online' event
  → useOfflineSync hook listener fires
  → Reads all queued submissions from IndexedDB
  → For each: POST /api/f/:slug/responses (same as normal submit)
  → On success: remove from IndexedDB queue
  → console.info("[FormRise] Synced N offline submission(s)")
```

### 7.7 Template Fork
```
User clicks "Use template" on /templates
  If not authenticated → navigate to /login?next=/templates
  If authenticated:
    → POST /api/templates/:slug/fork
    → Backend:
        a. Find form by slug (IsPublic=true, Status=active)
        b. Deep-copy: new Form (Status=draft, IsPublic=false, Title="X (Copy)")
        c. Deep-copy: all FormFields with new IDs
        d. Set ForkedFromId = original form Id
        e. Increment original.ForkCount
        f. Invalidate Redis template cache
        g. Return new form
    → Navigate to /forms/:newId/edit
    → User's own copy, ready to customise
```

---

## 8. External Services

### Google OAuth 2.0
- **Purpose:** Social login (no password required)
- **How:** Frontend uses `@react-oauth/google` to get an id_token
- **Verification:** Backend calls `oauth2.googleapis.com/tokeninfo`
- **Config:** `VITE_GOOGLE_CLIENT_ID` (frontend) + same value on backend
- **Where to manage:** console.cloud.google.com → Credentials

### Brevo (Email)
- **Purpose:** Sends OTP emails for passwordless login
- **Protocol:** SMTP relay at `smtp-relay.brevo.com:587` (STARTTLS)
- **Auth:** SMTP key (not account password) — stored in `BREVO_SMTP_PASS`
- **From address:** `noreply@formrise.fyi` (must match verified sender)
- **Where to manage:** app.brevo.com → SMTP & API → SMTP Keys
- **Common failure:** SMTP key expires or is revoked → generate new key → update `.env` → restart backend

### Cloudflare
- **Purpose:** DNS management, CDN, DDoS protection
- **Domain:** formrise.fyi registered here (~$6/year)
- **A record:** formrise.fyi → 95.216.199.142 (proxied through Cloudflare)
- **Email DNS:** DKIM, SPF, DMARC, Brevo verification TXT records
- **Where to manage:** dash.cloudflare.com

### GitHub Actions (CI)
- **Purpose:** Automated build validation on every push to `main`
- **Runs:** Backend .NET build + Frontend TypeScript + Docker image build
- **Does NOT auto-deploy** — deployment is manual via rsync + docker compose

---

## 9. Security Model

### Token Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│  ACCESS TOKEN (JWT)                                             │
│  Format:    HS256 signed JWT                                    │
│  Payload:   { sub: userId, exp: now+15min }                     │
│  Storage:   Zustand in-memory store ONLY                        │
│             Never in localStorage, never in cookies             │
│  Lifetime:  15 minutes                                          │
│  Usage:     Axios attaches as Authorization: Bearer <token>     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  REFRESH TOKEN                                                  │
│  Format:    UUID                                                │
│  Storage:   SHA256 hash stored in Users.RefreshToken column     │
│             Raw value sent as HttpOnly cookie (JS cannot read)  │
│  Lifetime:  7 days                                              │
│  Flags:     HttpOnly=true, SameSite=Strict, Secure=true        │
│  Usage:     Browser sends automatically to POST /api/auth/refresh│
│  Revocation: Clear Users.RefreshToken in DB to invalidate       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SESSION HINT                                                   │
│  Key:       localStorage['fr_has_session'] = '1'               │
│  Contains:  No sensitive data — just a presence flag           │
│  Purpose:   Prevents a guaranteed-to-fail /refresh call on      │
│             every public page load for non-logged-in users      │
│  Set:       On successful login                                 │
│  Cleared:   On logout or failed refresh                         │
└─────────────────────────────────────────────────────────────────┘
```

### OTP Security
- 6-digit numeric OTP, valid for 5 minutes
- Stored as SHA256 hash in DB (never plain text)
- Cleared from DB immediately after successful verification
- Rate limiting prevents brute-force

### Other Protections
| Protection | Implementation |
|---|---|
| CORS | Only `APP_BASE_URL` origin accepted by backend |
| Rate limiting | ASP.NET Core RateLimiter, per-IP |
| SQL injection | Entity Framework parameterised queries only |
| XSS | React escapes all output by default |
| HTTPS | Caddy enforces HTTPS, auto-renews Let's Encrypt |
| Secrets | All secrets in `.env` file on server, never in git |

---

## 10. PWA & Offline Architecture

### What Makes it Installable
```
index.html
  <link rel="manifest" href="/manifest.json" />     ← tells browser it's a PWA
  <meta name="theme-color" content="#1B6B4A" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />

manifest.json
  {
    name: "formrise",
    short_name: "formrise",
    start_url: "/dashboard",
    display: "standalone",        ← no browser chrome when installed
    background_color: "#FAFAF8",
    theme_color: "#1B6B4A",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", purpose: "maskable" }
    ]
  }
```

Chrome install criteria: HTTPS + manifest with PNG icons + service worker registered.

### Service Worker Strategy (sw.js)
```
Cache name: formrise-v2  (bump version string to force cache bust)

INSTALL event:
  Pre-fetch and cache: /, /dashboard, /templates, /login

ACTIVATE event:
  Delete all caches where name !== 'formrise-v2'
  Claim all open browser tabs immediately (self.clients.claim())

FETCH event — three strategies:

  /api/* → NETWORK FIRST, NO CACHE
    Try network → if offline → return 503 JSON { error: "offline" }
    Reason: API data must always be fresh

  *.js / *.css / *.png / *.svg / *.woff2 → CACHE FIRST
    Try cache → if miss → fetch, cache the response, return it
    Reason: Vite hashes filenames (bundle-abc123.js) so cache never stales

  HTML navigation /* → NETWORK FIRST, CACHE FALLBACK
    Try network → cache response → return it
    If offline → return cached version
    If no cache → fallback to cached / (app shell)
    Reason: App shell loads even with no internet
```

### Offline Queue (IndexedDB)
```
Library: idb (thin IndexedDB wrapper)
Store:   offlineQueue database

When form submitted offline:
  offlineQueue.enqueue({
    slug: string,
    respondentEmail?: string,
    qrToken?: string,
    answers: [{ fieldId, value, numericValue, valuesArray }]
  })

When browser comes back online (window 'online' event):
  useOfflineSync hook fires
  Drains queue: for each entry → POST /api/f/:slug/responses
  Removes from IndexedDB on success
  Logs: "[FormRise] Synced N offline submission(s)"
```

---

## 11. CI/CD Pipeline

### GitHub Actions (`.github/workflows/ci.yml`)
Triggers on: `push` to `main`, `pull_request` to `main`

```
Three jobs run in parallel:

┌─────────────────────────────────┐
│  backend (ubuntu-latest)        │
│  1. checkout                    │
│  2. setup-dotnet@v4 (9.0.x)    │
│  3. dotnet restore              │
│  4. dotnet build -c Release     │
│  5. setup-buildx-action@v3      │
│  6. build-push-action@v6        │
│     context: backend            │
│     push: false (validate only) │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  frontend (ubuntu-latest)       │
│  1. checkout                    │
│  2. setup-node@v4 (Node 24)     │
│     cache: npm                  │
│  3. npm install                 │  ← not npm ci (platform optionals)
│  4. npx tsc --noEmit            │  ← type check
│  5. npm run build               │  ← tsc -b && vite build
│  6. setup-buildx-action@v3      │
│  7. build-push-action@v6        │
│     context: frontend           │
│     push: false (validate only) │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  docker-compose-validate        │
│  1. checkout                    │
│  2. docker compose config -q    │  ← validates YAML syntax
└─────────────────────────────────┘
```

**Note on `npm install` vs `npm ci`:**  
Some packages (e.g. `@emnapi/core`, `@emnapi/runtime`) are optional wasm32 platform-specific packages. When the lockfile is generated on macOS, these are not included (wrong platform). On Linux CI runners, `npm ci` fails because these entries are missing from the lockfile. `npm install` handles this correctly by resolving platform-specific optional dependencies at install time.

---

## 12. Deployment Procedure

CI validates but does NOT deploy. Deployment is manual:

```bash
# 1. Make changes on local machine (on main branch)
git add .
git commit -m "your message"
git push origin main

# 2. Sync changed files to server
rsync -avz --exclude='node_modules' --exclude='.git' \
  --exclude='dist' --exclude='obj' --exclude='bin' \
  frontend/ root@95.216.199.142:/opt/formrise/frontend/

rsync -avz --exclude='node_modules' --exclude='.git' \
  --exclude='obj' --exclude='bin' \
  backend/ root@95.216.199.142:/opt/formrise/backend/

# 3. Rebuild and restart containers on server
ssh root@95.216.199.142 \
  "cd /opt/formrise && docker compose -f docker-compose.prod.yml up -d --build"

# To deploy only frontend:
ssh root@95.216.199.142 \
  "cd /opt/formrise && docker compose -f docker-compose.prod.yml up -d --build frontend"

# To deploy only backend:
ssh root@95.216.199.142 \
  "cd /opt/formrise && docker compose -f docker-compose.prod.yml up -d --build backend"
```

### Checking Server Status
```bash
# See all running containers
ssh root@95.216.199.142 "docker compose -f /opt/formrise/docker-compose.prod.yml ps"

# View backend logs (live)
ssh root@95.216.199.142 "docker logs -f formrise-backend-1"

# View frontend logs
ssh root@95.216.199.142 "docker logs -f formrise-frontend-1"

# Check database
ssh root@95.216.199.142 \
  "docker exec formrise-postgres-1 psql -U formflow -d formflow -c 'SELECT COUNT(*) FROM \"Users\";'"

# Restart a single container without rebuild
ssh root@95.216.199.142 "docker restart formrise-backend-1"
```

---

## 13. Troubleshooting Reference

| Symptom | Likely Cause | Fix |
|---|---|---|
| OTP emails not arriving | Brevo SMTP key expired/revoked | Generate new SMTP key in app.brevo.com → update `BREVO_SMTP_PASS` in `/opt/formrise/.env` → `docker restart formrise-backend-1` |
| All API calls return 401 | JWT_SECRET changed or missing | Check `.env` has `JWT_SECRET` → restart backend |
| Users get stuck on loading spinner | Auth refresh failing silently | Check backend logs → `docker logs formrise-backend-1` |
| Form fill returns 404 | Form is not published (Status=draft) | Log in → publish the form |
| Templates page shows 0 templates | Redis cache corrupt | `docker exec formrise-redis-1 redis-cli FLUSHDB` |
| Someone's form appears in /templates | `IsPublic=true` set accidentally on user form | `UPDATE "Forms" SET "IsPublic"=false WHERE "Id"='...'` in psql |
| Site not loading at all | Container down | `docker compose -f docker-compose.prod.yml up -d` on server |
| HTTPS certificate expired | Caddy not renewing | Check `docker logs formrise-caddy-1` → usually port 80 blocked |
| Offline submissions not syncing | Service worker cached old version | Bump cache name in `sw.js` (e.g. formrise-v3) → redeploy |
| CI frontend build failing | package-lock.json out of sync | Run `npm install` locally → commit updated lockfile |
| CI frontend Docker step failing | Missing buildx setup | Ensure `setup-buildx-action@v3` runs before `build-push-action@v6` |
| Backend build failing in CI | .NET restore fails | Check `FormFlow.Api.csproj` for missing/broken package references |

### Useful Database Queries
```sql
-- List all users
SELECT "Id", "Email", "CreatedAt" FROM "Users" ORDER BY "CreatedAt" DESC;

-- List all templates
SELECT "Title", "Slug", "ForkCount" FROM "Forms"
WHERE "UserId" = '00000000-0000-0000-0000-000000000001'
ORDER BY "ForkCount" DESC;

-- Count responses per form
SELECT f."Title", f."ResponseCount"
FROM "Forms" f
ORDER BY f."ResponseCount" DESC;

-- Find a form by slug
SELECT * FROM "Forms" WHERE "Slug" = 'your-slug';

-- Delete a user (cascades to all their forms and responses)
DELETE FROM "Users" WHERE "Email" = 'user@example.com';
```

---

## File Structure Reference

```
form-builder/
├── .github/workflows/ci.yml        GitHub Actions CI
├── backend/
│   ├── Dockerfile                   .NET build → aspnet runtime
│   └── FormFlow.Api/
│       ├── Controllers/             API endpoints
│       ├── Data/
│       │   ├── AppDbContext.cs      EF Core DbContext
│       │   └── TemplateSeedData.json  71 Indian templates
│       ├── Helpers/
│       │   ├── JwtHelper.cs         JWT generation/validation
│       │   └── SlugGenerator.cs     Random slug generator
│       ├── Middleware/              Error handling, auth
│       ├── Migrations/              EF Core migration files
│       ├── Models/
│       │   ├── Entities/            DB model classes
│       │   └── DTOs/                Request/response shapes
│       ├── Services/                Business logic
│       └── Program.cs               App startup, DI registration
├── frontend/
│   ├── Dockerfile                   node:24 build → nginx:alpine
│   ├── index.html                   PWA meta, SW registration
│   ├── public/
│   │   ├── manifest.json            PWA manifest
│   │   ├── sw.js                    Service worker
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   └── icons/                   icon-192.png, icon-512.png
│   └── src/
│       ├── api/                     Axios client + API modules
│       ├── components/
│       │   ├── builder/             FormBuilder UI components
│       │   ├── layout/              AppLayout, Sidebar
│       │   ├── renderer/            FieldRenderer (form fill)
│       │   ├── responses/           ResponseDetail, ResponseChart
│       │   ├── qr/                  QR share modal
│       │   └── shared/              Button, Input, Toast, etc.
│       ├── hooks/                   useOfflineSync
│       ├── pages/                   Route-level components
│       ├── stores/                  Zustand state stores
│       ├── types/                   TypeScript interfaces
│       └── utils/                   validation, helpers
└── docker-compose.prod.yml          Production container config
```

---

*This document reflects the system as built through Sprint 1. Phase 2 (Webhooks, File Uploads, Heatmaps, Smart QR, Auto-Translate, Team Collaboration, Custom Domain, Razorpay billing) is planned for the next sprint.*
