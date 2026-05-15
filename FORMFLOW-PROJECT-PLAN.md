# FormFlow — Complete Project Plan

> **Purpose**: This document is the single source of truth for building FormFlow, a free-tier-first form builder application. It is designed to be placed at the root of the VS Code workspace so that Claude CLI can reference it to build every component step by step.
>
> **Strategy**: Build the free version first (Phase 1), validate with real users, then layer premium features (Phase 2+).
>
> **Tech stack**: React 18 + Vite + Tailwind (frontend) · .NET 8 Web API (backend) · PostgreSQL 16 (database) · Redis 7 (cache/sessions) · Nginx (reverse proxy) · Docker Compose (orchestration) · Hetzner CX22 (hosting)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Database Schema](#2-database-schema)
3. [Backend — .NET 8 Web API](#3-backend--net-8-web-api)
4. [Frontend — React 18 + Vite](#4-frontend--react-18--vite)
5. [Authentication — Passwordless OTP](#5-authentication--passwordless-otp)
6. [Form Builder Engine](#6-form-builder-engine)
7. [Form Renderer & Submission](#7-form-renderer--submission)
8. [Response Dashboard](#8-response-dashboard)
9. [QR Code Sharing](#9-qr-code-sharing)
10. [Offline PWA Support](#10-offline-pwa-support)
11. [Fork & Remix System](#11-fork--remix-system)
12. [Docker & Deployment](#12-docker--deployment)
13. [Build Order & Milestones](#13-build-order--milestones)
14. [Phase 2 — Premium Features (Later)](#14-phase-2--premium-features-later)

---

## 1. Project Structure

```
formflow/
├── FORMFLOW-PROJECT-PLAN.md          # This file — Claude CLI reference
├── docker-compose.yml                 # Full stack orchestration
├── .env.example                       # Environment template
│
├── backend/                           # .NET 8 Web API
│   ├── FormFlow.Api/
│   │   ├── Program.cs                 # Entry point, DI, middleware
│   │   ├── appsettings.json
│   │   ├── appsettings.Development.json
│   │   │
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs      # OTP send/verify, token refresh
│   │   │   ├── FormController.cs      # CRUD forms, publish/unpublish
│   │   │   ├── ResponseController.cs  # Submit response, list responses
│   │   │   ├── TemplateController.cs  # Community templates, fork
│   │   │   └── QrController.cs        # Generate QR, validate token
│   │   │
│   │   ├── Services/
│   │   │   ├── AuthService.cs         # OTP generation, JWT creation
│   │   │   ├── EmailService.cs        # Brevo SMTP integration
│   │   │   ├── FormService.cs         # Form CRUD business logic
│   │   │   ├── ResponseService.cs     # Response collection logic
│   │   │   ├── QrService.cs           # QR generation + token mgmt
│   │   │   └── ForkService.cs         # Fork/remix logic
│   │   │
│   │   ├── Models/
│   │   │   ├── Entities/              # EF Core entity classes
│   │   │   │   ├── User.cs
│   │   │   │   ├── Form.cs
│   │   │   │   ├── FormField.cs
│   │   │   │   ├── FormResponse.cs
│   │   │   │   ├── FieldAnswer.cs
│   │   │   │   └── QrToken.cs
│   │   │   │
│   │   │   ├── DTOs/                  # Request/response DTOs
│   │   │   │   ├── Auth/
│   │   │   │   │   ├── SendOtpRequest.cs
│   │   │   │   │   ├── VerifyOtpRequest.cs
│   │   │   │   │   └── AuthResponse.cs
│   │   │   │   ├── Forms/
│   │   │   │   │   ├── CreateFormRequest.cs
│   │   │   │   │   ├── UpdateFormRequest.cs
│   │   │   │   │   ├── FormDto.cs
│   │   │   │   │   └── FormFieldDto.cs
│   │   │   │   └── Responses/
│   │   │   │       ├── SubmitResponseRequest.cs
│   │   │   │       └── ResponseDto.cs
│   │   │   │
│   │   │   └── Enums/
│   │   │       ├── FieldType.cs
│   │   │       ├── FormStatus.cs
│   │   │       └── QrTokenStatus.cs
│   │   │
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs         # EF Core DbContext
│   │   │   └── Migrations/            # EF Core migrations
│   │   │
│   │   ├── Middleware/
│   │   │   ├── RateLimitMiddleware.cs
│   │   │   └── ErrorHandlingMiddleware.cs
│   │   │
│   │   └── Helpers/
│   │       ├── JwtHelper.cs
│   │       ├── SlugGenerator.cs       # Short unique form IDs
│   │       └── QrGenerator.cs         # QR code image generation
│   │
│   ├── FormFlow.Api.csproj
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/                          # React 18 + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── Dockerfile
│   │
│   ├── public/
│   │   ├── manifest.json             # PWA manifest
│   │   ├── sw.js                     # Service worker for offline
│   │   ├── favicon.svg
│   │   └── icons/                    # PWA icons 192x192, 512x512
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    # Router setup
│       ├── index.css                  # Tailwind base + custom
│       │
│       ├── api/
│       │   ├── client.ts             # Axios instance, interceptors
│       │   ├── auth.ts               # Auth API calls
│       │   ├── forms.ts              # Form CRUD API calls
│       │   ├── responses.ts          # Response API calls
│       │   └── qr.ts                 # QR API calls
│       │
│       ├── stores/
│       │   ├── authStore.ts          # Zustand auth state
│       │   ├── formStore.ts          # Zustand form builder state
│       │   └── offlineStore.ts       # IndexedDB offline queue
│       │
│       ├── pages/
│       │   ├── Landing.tsx            # Public landing page
│       │   ├── Login.tsx              # OTP login page
│       │   ├── Dashboard.tsx          # User's form list + stats
│       │   ├── FormBuilder.tsx        # Drag-and-drop form editor
│       │   ├── FormPreview.tsx        # Live preview of form
│       │   ├── FormResponses.tsx      # Response table + charts
│       │   ├── Templates.tsx          # Community templates browse
│       │   ├── Settings.tsx           # User settings
│       │   └── FormFill.tsx           # Public form fill page (no auth)
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   └── AppLayout.tsx
│       │   │
│       │   ├── builder/
│       │   │   ├── FieldPicker.tsx     # Sidebar with draggable field types
│       │   │   ├── FieldCard.tsx       # Single field in the canvas
│       │   │   ├── FieldEditor.tsx     # Edit field properties panel
│       │   │   ├── FormCanvas.tsx      # Drop zone, reorder fields
│       │   │   ├── FormSettings.tsx    # Form-level settings panel
│       │   │   └── PublishModal.tsx    # Publish + get link/QR
│       │   │
│       │   ├── renderer/
│       │   │   ├── FormRenderer.tsx    # Renders form for respondents
│       │   │   ├── FieldRenderer.tsx   # Renders a single field by type
│       │   │   └── ThankYou.tsx        # Post-submission page
│       │   │
│       │   ├── responses/
│       │   │   ├── ResponseTable.tsx   # Tabular response view
│       │   │   ├── ResponseChart.tsx   # Simple bar/pie charts
│       │   │   └── ExportButton.tsx    # Export to CSV
│       │   │
│       │   ├── shared/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Toast.tsx
│       │   │   ├── LoadingSpinner.tsx
│       │   │   └── EmptyState.tsx
│       │   │
│       │   └── qr/
│       │       ├── QrDisplay.tsx       # Show QR code with download
│       │       └── QrShareModal.tsx    # QR sharing options
│       │
│       ├── hooks/
│       │   ├── useAuth.ts
│       │   ├── useForms.ts
│       │   ├── useOfflineSync.ts
│       │   └── useDragAndDrop.ts
│       │
│       ├── utils/
│       │   ├── fieldTypes.ts          # Field type definitions
│       │   ├── validation.ts          # Client-side validation
│       │   ├── dateFormat.ts
│       │   └── constants.ts
│       │
│       └── types/
│           ├── form.ts                # TypeScript types for forms
│           ├── response.ts
│           └── auth.ts
│
├── nginx/
│   └── nginx.conf                     # Reverse proxy config
│
└── scripts/
    ├── init-db.sql                    # Initial DB setup
    └── seed-templates.sql             # Seed community templates
```

---

## 2. Database Schema

### Entity Relationship Summary

```
users ──< forms ──< form_fields
                ──< form_responses ──< field_answers
                ──< qr_tokens
forms ──< form_forks (self-referential: forked_from_id → forms.id)
```

### SQL Schema

```sql
-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    display_name    VARCHAR(100),
    avatar_url      VARCHAR(500),
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- OTP TOKENS (stored in Redis, but fallback table)
-- ============================================================
CREATE TABLE otp_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    code            VARCHAR(6) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_used         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_tokens(email, is_used);

-- ============================================================
-- FORMS
-- ============================================================
CREATE TABLE forms (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug            VARCHAR(12) NOT NULL UNIQUE,       -- short URL ID e.g. "a8x2k9"
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'draft',       -- draft, active, paused, closed
    is_public       BOOLEAN DEFAULT TRUE,              -- listed in community templates
    allow_anonymous BOOLEAN DEFAULT TRUE,              -- respondents don't need login
    collect_email   BOOLEAN DEFAULT FALSE,
    limit_one_response BOOLEAN DEFAULT FALSE,
    shuffle_fields  BOOLEAN DEFAULT FALSE,
    show_progress   BOOLEAN DEFAULT TRUE,
    accept_from     TIMESTAMPTZ,                       -- time window start (nullable)
    accept_until    TIMESTAMPTZ,                       -- time window end (nullable)
    allowed_emails  TEXT[],                             -- restricted access emails (nullable)
    thank_you_msg   TEXT DEFAULT 'Thank you for your response!',
    forked_from_id  UUID REFERENCES forms(id) ON DELETE SET NULL,
    fork_count      INT DEFAULT 0,
    response_count  INT DEFAULT 0,                     -- denormalized counter
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_forms_user ON forms(user_id);
CREATE INDEX idx_forms_slug ON forms(slug);
CREATE INDEX idx_forms_public ON forms(is_public, status) WHERE is_public = TRUE;

-- ============================================================
-- FORM FIELDS
-- ============================================================
CREATE TABLE form_fields (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    field_type      VARCHAR(30) NOT NULL,
    -- Supported types (free tier):
    --   short_text, long_text, email, number, dropdown,
    --   checkbox, radio, date, rating, url
    -- Premium types (Phase 2):
    --   file_upload, phone, signature, payment
    label           VARCHAR(500) NOT NULL,
    placeholder     VARCHAR(300),
    help_text       VARCHAR(500),
    is_required     BOOLEAN DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    options         JSONB,                              -- for dropdown/radio/checkbox
    -- Example: ["Option A", "Option B", "Option C"]
    validation      JSONB,                              -- validation rules
    -- Example: {"min_length": 2, "max_length": 500, "pattern": "^[a-zA-Z]+$"}
    conditional     JSONB,                              -- conditional visibility
    -- Example: {"show_if": {"field_id": "uuid", "equals": "Yes"}}
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fields_form ON form_fields(form_id, sort_order);

-- ============================================================
-- FORM RESPONSES
-- ============================================================
CREATE TABLE form_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    respondent_email VARCHAR(255),                      -- if collect_email is on
    qr_token_id     UUID REFERENCES qr_tokens(id),     -- if submitted via QR
    ip_hash         VARCHAR(64),                        -- hashed IP for dedup
    user_agent      VARCHAR(500),
    is_complete     BOOLEAN DEFAULT TRUE,
    submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_responses_form ON form_responses(form_id, submitted_at DESC);

-- ============================================================
-- FIELD ANSWERS
-- ============================================================
CREATE TABLE field_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id     UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
    field_id        UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value           TEXT,                                -- text answer
    values_array    TEXT[],                              -- for multi-select fields
    numeric_value   DOUBLE PRECISION                     -- for number/rating fields
);

CREATE INDEX idx_answers_response ON field_answers(response_id);
CREATE INDEX idx_answers_field ON field_answers(field_id);

-- ============================================================
-- QR TOKENS
-- ============================================================
CREATE TABLE qr_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    token           VARCHAR(64) NOT NULL UNIQUE,
    status          VARCHAR(20) DEFAULT 'active',       -- active, used, expired
    label           VARCHAR(200),                        -- e.g. "Chair 1", "Table 5"
    expires_at      TIMESTAMPTZ,                         -- nullable = no expiry
    used_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_token ON qr_tokens(token);
CREATE INDEX idx_qr_form ON qr_tokens(form_id);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
```

### EF Core Entity Notes

- Use `Npgsql.EntityFrameworkCore.PostgreSQL` package for PostgreSQL support.
- Configure JSONB columns with `.HasColumnType("jsonb")` in `OnModelCreating`.
- Use `TEXT[]` for `allowed_emails` and `values_array` — Npgsql supports PostgreSQL arrays natively.
- Apply `IEntityTypeConfiguration<T>` pattern for clean entity config.

---

## 3. Backend — .NET 8 Web API

### Project Setup

```bash
dotnet new webapi -n FormFlow.Api --no-https false
cd FormFlow.Api
```

### Required NuGet Packages

```xml
<ItemGroup>
    <!-- Core -->
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.*" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.*" />

    <!-- Auth -->
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.*" />

    <!-- Redis -->
    <PackageReference Include="StackExchange.Redis" Version="2.*" />

    <!-- Email -->
    <PackageReference Include="MailKit" Version="4.*" />

    <!-- QR -->
    <PackageReference Include="QRCoder" Version="1.*" />

    <!-- Validation -->
    <PackageReference Include="FluentValidation.AspNetCore" Version="11.*" />

    <!-- Mapping -->
    <PackageReference Include="Mapster" Version="7.*" />

    <!-- Rate limiting (built into .NET 8) -->
    <!-- No extra package needed -->
</ItemGroup>
```

### Program.cs — Outline

```csharp
var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddStackExchangeRedisCache(opts =>
    opts.Configuration = builder.Configuration.GetConnectionString("Redis"));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts => { /* JWT config */ });

builder.Services.AddRateLimiter(opts =>
{
    opts.AddFixedWindowLimiter("otp", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 3; });
    opts.AddFixedWindowLimiter("submit", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 30; });
    opts.AddFixedWindowLimiter("general", o => { o.Window = TimeSpan.FromMinutes(1); o.PermitLimit = 60; });
});

builder.Services.AddCors(opts =>
    opts.AddDefaultPolicy(p => p.WithOrigins("https://formflow.yourdomain.com").AllowAnyMethod().AllowAnyHeader()));

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IFormService, FormService>();
builder.Services.AddScoped<IResponseService, ResponseService>();
builder.Services.AddScoped<IQrService, QrService>();
builder.Services.AddScoped<IForkService, ForkService>();
builder.Services.AddTransient<IEmailService, EmailService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();
app.Run();
```

### API Endpoints

#### Auth

| Method | Route | Auth | Rate Limit | Description |
|--------|-------|------|------------|-------------|
| POST | `/api/auth/send-otp` | No | 3/min | Send OTP to email |
| POST | `/api/auth/verify-otp` | No | 5/min | Verify OTP, return JWT + refresh |
| POST | `/api/auth/refresh` | No | 10/min | Refresh access token |
| POST | `/api/auth/logout` | Yes | — | Revoke refresh token |
| GET | `/api/auth/me` | Yes | — | Get current user profile |

#### Forms

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/forms` | Yes | List user's forms (paginated) |
| POST | `/api/forms` | Yes | Create new form |
| GET | `/api/forms/{id}` | Yes | Get form with fields |
| PUT | `/api/forms/{id}` | Yes | Update form metadata |
| DELETE | `/api/forms/{id}` | Yes | Soft-delete form |
| PUT | `/api/forms/{id}/fields` | Yes | Bulk update fields (reorder, add, remove) |
| POST | `/api/forms/{id}/publish` | Yes | Set status to active |
| POST | `/api/forms/{id}/unpublish` | Yes | Set status to paused |
| GET | `/api/forms/{id}/stats` | Yes | Response count, completion rate |

#### Public Form Access (no auth for respondents)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/f/{slug}` | No | Get published form for filling |
| POST | `/api/f/{slug}/submit` | No | Submit a response |
| GET | `/api/f/{slug}/verify-access?email=x` | No | Check if email is in allowed list |
| GET | `/api/f/{slug}/qr?token=x` | No | Validate QR token and load form |

#### Responses

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/forms/{id}/responses` | Yes | List responses (paginated) |
| GET | `/api/forms/{id}/responses/{rid}` | Yes | Single response detail |
| DELETE | `/api/forms/{id}/responses/{rid}` | Yes | Delete a response |
| GET | `/api/forms/{id}/responses/export` | Yes | Export as CSV |

#### QR Codes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/forms/{id}/qr` | Yes | Generate QR code (single or batch) |
| GET | `/api/forms/{id}/qr` | Yes | List QR codes for this form |
| DELETE | `/api/forms/{id}/qr/{qrId}` | Yes | Delete a QR token |

#### Templates & Fork

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/templates` | No | Browse public templates (paginated) |
| GET | `/api/templates/{slug}` | No | View a template |
| POST | `/api/templates/{slug}/fork` | Yes | Fork template to user's account |

---

## 4. Frontend — React 18 + Vite

### Setup Commands

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom@6 zustand axios
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install recharts qrcode.react
npm install lucide-react
npm install idb                     # IndexedDB wrapper for offline
```

### Routing Structure

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/f/:slug" element={<FormFill />} />           {/* Public form */}
    <Route path="/f/:slug/thank-you" element={<ThankYou />} />

    {/* Protected routes — wrapped in AppLayout with Sidebar */}
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forms/new" element={<FormBuilder />} />
        <Route path="/forms/:id/edit" element={<FormBuilder />} />
        <Route path="/forms/:id/preview" element={<FormPreview />} />
        <Route path="/forms/:id/responses" element={<FormResponses />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

### State Management (Zustand)

```tsx
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// stores/formStore.ts
interface FormBuilderState {
  form: FormDraft;
  fields: FieldDraft[];
  selectedFieldId: string | null;
  setTitle: (title: string) => void;
  addField: (type: FieldType) => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FieldDraft>) => void;
  reorderFields: (oldIndex: number, newIndex: number) => void;
  selectField: (id: string | null) => void;
}
```

### Field Types Definition

```ts
// utils/fieldTypes.ts
export const FIELD_TYPES = {
  short_text:  { label: "Short text",  icon: "Type",      hasOptions: false },
  long_text:   { label: "Long text",   icon: "AlignLeft",  hasOptions: false },
  email:       { label: "Email",       icon: "Mail",       hasOptions: false },
  number:      { label: "Number",      icon: "Hash",       hasOptions: false },
  dropdown:    { label: "Dropdown",    icon: "ChevronDown", hasOptions: true },
  radio:       { label: "Single choice", icon: "Circle",   hasOptions: true },
  checkbox:    { label: "Multi choice", icon: "CheckSquare", hasOptions: true },
  date:        { label: "Date",        icon: "Calendar",   hasOptions: false },
  rating:      { label: "Rating",      icon: "Star",       hasOptions: false },
  url:         { label: "URL",         icon: "Link",       hasOptions: false },
} as const;

export type FieldType = keyof typeof FIELD_TYPES;
```

---

## 5. Authentication — Passwordless OTP

### Flow

```
1. User enters email → POST /api/auth/send-otp
2. Server generates 6-digit OTP → stores in Redis (key: otp:{email}, TTL: 5min)
3. Server sends OTP via Brevo SMTP
4. User enters OTP → POST /api/auth/verify-otp
5. Server validates OTP → if valid:
   a. Create user if not exists (upsert by email)
   b. Generate JWT access token (15min expiry)
   c. Generate refresh token (stored in DB, 30 day expiry)
   d. Return { accessToken, refreshToken, user }
6. Frontend stores accessToken in memory (Zustand), refreshToken in httpOnly cookie
7. On 401, frontend calls POST /api/auth/refresh with refresh token
```

### OTP Redis Key Structure

```
otp:{email} → { code: "482917", attempts: 0 }  TTL: 300s
otp_cooldown:{email} → "1"                      TTL: 60s (prevent spam)
```

### JWT Claims

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "name": "SaGha",
  "iat": 1717000000,
  "exp": 1717000900
}
```

### Security Rules

- OTP is 6 digits, cryptographically random.
- Max 3 OTP requests per email per minute (rate limited).
- Max 5 verify attempts per OTP; lock after 5 failures.
- OTP expires after 5 minutes.
- One-time use — mark as consumed immediately on success.
- Refresh tokens are hashed before storage; raw token sent to client.

---

## 6. Form Builder Engine

### Builder UX Flow

```
1. User clicks "New form" → navigates to /forms/new
2. Left sidebar: field type picker (draggable)
3. Center canvas: drop zone showing form fields in order
4. Right panel (or inline): edit selected field properties
5. Top bar: form title (editable), Preview button, Publish button
6. Autosave: debounced PUT to /api/forms/{id}/fields every 3 seconds on change
```

### Drag and Drop

Use `@dnd-kit/core` and `@dnd-kit/sortable` for:
- Dragging field types from picker into canvas (add new field)
- Reordering existing fields by drag within canvas
- Each field card shows: drag handle, type badge, label, required indicator, delete button

### Field Editor Properties (per field)

| Property | Applies to | Description |
|----------|-----------|-------------|
| `label` | All | The question text |
| `placeholder` | text, email, number, url | Input placeholder text |
| `help_text` | All | Small helper text below the field |
| `is_required` | All | Toggle required validation |
| `options` | dropdown, radio, checkbox | Array of option strings |
| `validation.min_length` | short_text, long_text | Minimum character count |
| `validation.max_length` | short_text, long_text | Maximum character count |
| `validation.min` | number | Minimum numeric value |
| `validation.max` | number, rating | Maximum numeric value |
| `validation.pattern` | short_text | Regex pattern |

### Autosave Strategy

```
User edits field → debounce 3s → PUT /api/forms/{id}/fields
Send full field array (not diffs) — backend replaces all fields in transaction.
Show "Saving..." / "Saved" indicator in top bar.
If offline (PWA), queue in IndexedDB and sync when online.
```

---

## 7. Form Renderer & Submission

### Public Form Page (`/f/:slug`)

```
1. GET /api/f/{slug} → returns form metadata + fields
2. If form has allowed_emails:
   a. Show "Enter your email to access this form"
   b. POST /api/f/{slug}/verify-access?email=x
   c. If allowed → show form; if not → show "Access denied"
3. If form has accept_from/accept_until:
   a. Check current time vs window
   b. If outside → show "This form is not currently accepting responses"
4. Render form fields in sort_order
5. Client-side validation on submit
6. POST /api/f/{slug}/submit with answers
7. On success → redirect to /f/{slug}/thank-you
```

### QR Access Flow

```
1. Respondent scans QR → URL: /f/{slug}?token=abc123
2. Frontend detects ?token param
3. GET /api/f/{slug}/qr?token=abc123
4. Backend validates:
   - Token exists and belongs to this form
   - Token status is "active" (not used, not expired)
   - Token not expired (if expires_at is set)
5. If valid → return form data, set token in submission context
6. On submit → mark token as "used", record qr_token_id in response
7. If invalid → show "This QR code has already been used" or "expired"
```

### Client-side Validation Rules

```ts
function validateField(field: FormField, value: any): string | null {
  if (field.is_required && !value) return `${field.label} is required`;
  if (field.field_type === "email" && value && !isValidEmail(value)) return "Invalid email";
  if (field.field_type === "url" && value && !isValidUrl(value)) return "Invalid URL";
  if (field.validation?.min_length && value.length < field.validation.min_length)
    return `Minimum ${field.validation.min_length} characters`;
  if (field.validation?.max_length && value.length > field.validation.max_length)
    return `Maximum ${field.validation.max_length} characters`;
  if (field.validation?.min && Number(value) < field.validation.min)
    return `Minimum value is ${field.validation.min}`;
  if (field.validation?.max && Number(value) > field.validation.max)
    return `Maximum value is ${field.validation.max}`;
  return null;
}
```

---

## 8. Response Dashboard

### Dashboard Page (`/forms/:id/responses`)

Three tabs: **Responses** | **Charts** | **Export**

#### Responses Tab
- Paginated table of all responses
- Columns: one per field (truncated to 50 chars) + submitted_at + status
- Click a row to expand full response in a slide-out panel
- Bulk select + delete

#### Charts Tab
- For dropdown/radio/checkbox fields: bar chart of option distribution (use Recharts)
- For rating fields: average + distribution histogram
- For number fields: min, max, average, median
- Summary stats: total responses, completion rate, avg time (if tracked)

#### Export Tab
- Export to CSV button
- Download triggers GET /api/forms/{id}/responses/export
- Backend streams CSV with proper headers

---

## 9. QR Code Sharing

### Generation

```
POST /api/forms/{id}/qr
Body: {
  "count": 1,             // 1 for single, up to 100 for batch
  "label_prefix": "Chair", // optional: generates "Chair 1", "Chair 2", etc.
  "expires_at": null       // optional: ISO datetime
}

Response: [
  {
    "id": "uuid",
    "token": "a7b3c9d1...",
    "label": "Chair 1",
    "url": "https://formflow.yourdomain.com/f/a8x2k9?token=a7b3c9d1...",
    "qr_image_base64": "data:image/png;base64,..."
  }
]
```

### QR Image Generation (Backend)

Use `QRCoder` NuGet package:

```csharp
public byte[] GenerateQrImage(string url)
{
    using var generator = new QRCodeGenerator();
    using var data = generator.CreateQrCode(url, QRCodeGenerator.ECCLevel.M);
    using var qrCode = new PngByteQRCode(data);
    return qrCode.GetGraphic(10); // 10 pixels per module
}
```

### Frontend QR Display

Use `qrcode.react` for client-side rendering:

```tsx
<QRCodeSVG value={qrUrl} size={200} level="M" />
```

Provide download button that exports the QR as PNG.

---

## 10. Offline PWA Support

### Service Worker Strategy

```
Cache strategy: Network-first for API calls, cache-first for static assets.

Cached at install:
- index.html, JS bundles, CSS, fonts, icons
- /manifest.json

Runtime caching:
- API GET responses cached with 5-min stale-while-revalidate
- Form schema cached when user opens a form for filling
```

### Offline Form Submission

```
1. User fills form while offline
2. On submit → detect navigator.onLine === false
3. Store submission in IndexedDB (idb library):
   {
     id: uuid,
     slug: "a8x2k9",
     answers: {...},
     queued_at: ISO datetime
   }
4. Show "Response saved offline. Will submit when back online."
5. Service worker listens for 'online' event
6. On reconnect → read IndexedDB queue → POST each to /api/f/{slug}/submit
7. On success → remove from queue, show notification
8. On failure → keep in queue, retry with exponential backoff
```

### PWA Manifest

```json
{
  "name": "FormFlow",
  "short_name": "FormFlow",
  "description": "Free form builder that works offline",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FAFAF8",
  "theme_color": "#1B6B4A",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 11. Fork & Remix System

### Fork Flow

```
1. User browses /templates → sees public forms
2. Clicks "Fork this form" on a template
3. POST /api/templates/{slug}/fork
4. Backend:
   a. Deep-copy form record (new UUID, new slug, user_id = current user)
   b. Deep-copy all form_fields (new UUIDs, linked to new form)
   c. Set forked_from_id on new form
   d. Increment fork_count on original form
   e. Set status = "draft" on new form
5. Return new form → redirect to /forms/{newId}/edit
6. User customizes and publishes their version
```

### Community Template Listing

```
GET /api/templates?page=1&pageSize=12&category=healthcare&sort=popular

- Only forms where is_public = true AND status = "active"
- Sort options: popular (fork_count DESC), recent (created_at DESC)
- Category tags stored as a text array on the form (add category column)
- Show: title, description, field count, fork count, creator display name
```

---

## 12. Docker & Deployment

### docker-compose.yml

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: formflow
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/01-init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --maxmemory 100mb --maxmemory-policy allkeys-lru
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: unless-stopped
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__Default=Host=postgres;Database=formflow;Username=${DB_USER};Password=${DB_PASSWORD}
      - ConnectionStrings__Redis=redis:6379
      - Jwt__Secret=${JWT_SECRET}
      - Jwt__Issuer=formflow
      - Jwt__ExpiryMinutes=15
      - Email__SmtpHost=smtp-relay.brevo.com
      - Email__SmtpPort=587
      - Email__SmtpUser=${BREVO_SMTP_USER}
      - Email__SmtpPass=${BREVO_SMTP_PASS}
      - Email__FromAddress=noreply@yourdomain.com
      - Email__FromName=FormFlow
      - App__BaseUrl=https://formflow.yourdomain.com
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "5000:8080"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:80"

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend

volumes:
  pgdata:
```

### Backend Dockerfile

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY FormFlow.Api.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FormFlow.Api.dll"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name formflow.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name formflow.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/formflow.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/formflow.yourdomain.com/privkey.pem;

    # Frontend (React SPA)
    location / {
        proxy_pass http://frontend:80;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### .env.example

```env
# Database
DB_USER=formflow
DB_PASSWORD=change-me-strong-password

# JWT
JWT_SECRET=change-me-64-char-random-string

# Brevo SMTP
BREVO_SMTP_USER=your-brevo-smtp-login
BREVO_SMTP_PASS=your-brevo-smtp-password

# App
APP_BASE_URL=https://formflow.yourdomain.com
```

---

## 13. Build Order & Milestones

### Sprint 1 — Foundation (Week 1-2)

> Goal: project scaffolding, DB, auth, basic form CRUD

```
Tasks:
[ ] Initialize .NET 8 Web API project with folder structure
[ ] Set up EF Core with PostgreSQL, create all entity classes
[ ] Run initial migration, verify schema created
[ ] Implement AuthController + AuthService (OTP send/verify)
[ ] Implement EmailService with Brevo SMTP
[ ] Set up Redis for OTP storage
[ ] Implement JWT generation + refresh token flow
[ ] Initialize React + Vite + Tailwind project
[ ] Create Login page with OTP flow
[ ] Create authStore (Zustand) + API client with interceptors
[ ] Set up React Router with protected routes
[ ] Create AppLayout with Sidebar
[ ] Set up Docker Compose (postgres, redis, backend)
[ ] Verify end-to-end: user can login via OTP
```

### Sprint 2 — Form Builder (Week 3-4)

> Goal: users can create, edit, and publish forms

```
Tasks:
[ ] Implement FormController (CRUD endpoints)
[ ] Implement FormService with field management
[ ] Create Dashboard page (list forms, stats cards)
[ ] Create FieldPicker component with all free-tier field types
[ ] Create FormCanvas with @dnd-kit drag-and-drop
[ ] Create FieldCard component (display field in canvas)
[ ] Create FieldEditor panel (edit field properties)
[ ] Implement autosave (debounced PUT)
[ ] Create FormSettings panel (collect email, limit responses, etc.)
[ ] Create PublishModal (get link, copy URL)
[ ] Implement form status transitions (draft → active → paused → closed)
[ ] Verify: user can build a form with multiple field types and publish
```

### Sprint 3 — Form Filling & Responses (Week 5-6)

> Goal: respondents can fill forms, creators can view responses

```
Tasks:
[ ] Implement public form endpoint GET /api/f/{slug}
[ ] Implement submission endpoint POST /api/f/{slug}/submit
[ ] Create FormFill page (public, no auth required)
[ ] Create FieldRenderer component (renders each field type)
[ ] Implement client-side validation
[ ] Create ThankYou page
[ ] Implement email-restricted access flow
[ ] Implement time-window access checks
[ ] Implement ResponseController (list, detail, delete, export)
[ ] Create FormResponses page with response table
[ ] Create response detail slide-out panel
[ ] Create basic charts (Recharts) for dropdown/rating fields
[ ] Implement CSV export
[ ] Verify: full flow from form creation → filling → viewing responses
```

### Sprint 4 — QR & Templates (Week 7-8)

> Goal: QR sharing works, community templates exist

```
Tasks:
[ ] Implement QrController + QrService
[ ] Implement QR image generation (QRCoder)
[ ] Create QrShareModal in frontend
[ ] Create QrDisplay component with download
[ ] Implement QR token validation on form fill
[ ] Implement single-use QR burn-on-submit logic
[ ] Implement TemplateController + ForkService
[ ] Create Templates page (browse, search, filter)
[ ] Implement fork endpoint + deep copy logic
[ ] Seed 10-15 starter templates (init-db.sql)
[ ] Verify: QR codes work end-to-end, fork creates a working copy
```

### Sprint 5 — PWA & Polish (Week 9-10)

> Goal: works offline, production-ready

```
Tasks:
[ ] Create service worker with caching strategies
[ ] Create PWA manifest + icons
[ ] Implement offline form submission queue (IndexedDB)
[ ] Implement online sync with retry logic
[ ] Add "Saved offline" / "Synced" notifications
[ ] Add rate limiting middleware (production config)
[ ] Add error handling middleware
[ ] Add input sanitization (XSS prevention)
[ ] Add CAPTCHA (Cloudflare Turnstile) on public form submission
[ ] Write Dockerfiles for frontend + backend
[ ] Test full Docker Compose stack locally
[ ] Set up GitHub Actions CI (build, test, push images)
[ ] Deploy to Hetzner CX22
[ ] Configure Cloudflare DNS + SSL
[ ] Configure Nginx with Let's Encrypt
[ ] Verify: full app works on Hetzner, PWA installable, offline works
```

---

## 14. Phase 2 — Premium Features (Later)

> Build these AFTER free tier is live and has 100+ users.

### Behavior Heatmaps (Pro)

- Track time-per-field, backtrack events, abandonment point via frontend JS
- POST /api/forms/{id}/analytics/events (batch, debounced)
- Backend aggregates into per-field stats
- Frontend heatmap visualization on Responses page

### Smart QR (Pro)

- Location-bound QR (GPS check on submission)
- Time-expiring QR tokens
- Batch QR generation with labels (up to 500)
- QR usage analytics

### Auto-Translate (Pro)

- Self-hosted LibreTranslate on same server
- Detect browser locale → translate form labels
- Creator can review/edit translations
- Store translations as JSONB on form_fields

### Webhooks + API (Pro)

- Webhook URL per form → fire JSON on each submission
- Retry logic with exponential backoff (Hangfire)
- Public REST API with API key auth for developers

### File Uploads (Pro)

- Hetzner Object Storage (S3-compatible)
- Max 500 MB per Pro user, 5 GB per Team
- Accepted types: images, PDF, DOCX
- Virus scan before storage

### Team Collaboration (Team)

- Invite team members by email
- Role-based access: owner, editor, viewer
- Collaborative form editing (last-write-wins, not real-time collab)

### Custom Domain (Team)

- CNAME mapping: `forms.yourclinic.com` → FormFlow
- Nginx server_name wildcard + SNI routing
- Let's Encrypt wildcard certificate

### Pricing Implementation

- Razorpay integration (India-focused, UPI support)
- Plans stored in DB, checked via middleware
- Free: 100 responses/form/month, no file uploads, badge
- Pro ₹149/mo: unlimited responses, heatmaps, smart QR, translate, API, no badge
- Team ₹399/mo: everything + 5 members, custom domain, 5 GB storage

---

## Quick Reference: Commands

```bash
# Development — start everything
docker-compose up -d postgres redis
cd backend && dotnet run
cd frontend && npm run dev

# Database migration
cd backend
dotnet ef migrations add MigrationName
dotnet ef database update

# Production build
docker-compose build
docker-compose up -d

# Deploy to Hetzner
ssh root@your-hetzner-ip
cd /opt/formflow
git pull
docker-compose build --no-cache
docker-compose up -d

# Backup PostgreSQL
docker exec formflow-postgres pg_dump -U formflow formflow > backup-$(date +%F).sql
```

---

*This document is the complete blueprint. Place it at the project root. Point Claude CLI to it with: "Read FORMFLOW-PROJECT-PLAN.md and build Sprint 1 tasks."*
