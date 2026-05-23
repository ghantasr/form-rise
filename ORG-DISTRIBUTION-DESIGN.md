# Org, Moderator & Distribution Design
## Formrise — Quiz Distribution for Schools & Colleges

---

## The Problem

Right now, anyone with the form link can submit. For educational use cases — a teacher running a test, a college conducting an exam — you need:
- Only enrolled students can submit (not the whole internet)
- A teacher/moderator can see results grouped by class
- Students see their own scores, not everyone's
- Invite flow that doesn't require manual email entry every time

---

## Core Concepts

### Organization
A school, college, or company. Created by a form owner (becomes the **Admin**).

```
Organization
  ├── name          "Sunrise College"
  ├── slug          "sunrise-college"
  ├── createdBy     → User (Admin)
  └── plan          free | pro
```

### Roles within an Org
| Role | What they can do |
|---|---|
| **Admin** | Create/manage groups, invite moderators, see all results |
| **Moderator** | Create forms/quizzes, assign to groups, see results for their forms |
| **Member** | Submit assigned forms, see their own results only |

### Groups (Classes/Sections)
A sub-unit inside an org. Moderators assign quizzes to groups.

```
Group
  ├── name          "Class 10-A"
  ├── orgId         → Organization
  └── managedBy     → User (Moderator)
```

### Form Assignment
A quiz assigned to a specific group with optional schedule.

```
FormAssignment
  ├── formId        → Form
  ├── groupId       → Group
  ├── assignedBy    → User
  ├── opensAt       datetime (optional)
  ├── closesAt      datetime (optional)
  └── mode          "attempt_once" | "unlimited"
```

---

## Access Modes on a Form

A form has an `accessMode` field (extends current `allowedEmails`):

| Mode | Who can submit |
|---|---|
| `public` | Anyone with the link (current default) |
| `org` | Any verified member of the linked org |
| `group` | Only members of assigned groups |
| `invite_only` | Explicit email allowlist (current `allowedEmails`) |

---

## User Flows

### Flow 1 — Teacher Sets Up a Quiz

```
Teacher creates form → enables Quiz Mode → sets accessMode = "group"
→ assigns to "Class 10-A" → sets opens/closes window
→ shares the form link (same /f/:slug URL)
```

When a student opens the link:
- If not signed in → prompted to sign in / join org
- If signed in but not in an assigned group → "You are not enrolled in this quiz"
- If in the group and window is open → quiz loads normally

### Flow 2 — Student Joins an Org

Option A — **Invite link**: Admin shares `formrise.fyi/join/sunrise-college?token=xyz`
- Student clicks, signs in, automatically added as Member

Option B — **Email domain whitelist**: Org sets `@sunrise.edu` → anyone signing in with that domain auto-joins as Member

Option C — **Manual add**: Admin pastes a CSV of student emails → bulk-invite sent

### Flow 3 — Results Dashboard (Moderator View)

```
Moderator → My Forms → Quiz Results
  └── Assignment: "Chapter 5 Test — Class 10-A"
        ├── 28/35 submitted
        ├── Avg score: 72%
        ├── Pass rate: 68%
        └── [Student table]
              Name | Email | Score | Result | Submitted At
              Rahul | ...  | 8/10  | Passed | 20 May 10:12
              Priya | ...  | 5/10  | Failed | 20 May 10:34
              ...
```

Export CSV covers the group's results only.

### Flow 4 — Student View (My Results)

```
Student → My Results
  └── Chapter 5 Test — Scored 8/10 — Passed — 20 May
  └── Chapter 3 Test — Scored 6/10 — Failed — 15 May
```

Student can click any result to see per-question breakdown (the same ThankYou quiz result screen, but accessible any time).

---

## Database Schema (New Tables)

```sql
-- Organizations
CREATE TABLE "Organizations" (
    "Id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"      text NOT NULL,
    "Slug"      text NOT NULL UNIQUE,
    "CreatedBy" uuid NOT NULL REFERENCES "Users"("Id"),
    "CreatedAt" timestamptz NOT NULL DEFAULT now()
);

-- Members
CREATE TABLE "OrgMembers" (
    "Id"     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "OrgId"  uuid NOT NULL REFERENCES "Organizations"("Id") ON DELETE CASCADE,
    "UserId" uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Role"   text NOT NULL DEFAULT 'member',  -- 'admin' | 'moderator' | 'member'
    "JoinedAt" timestamptz NOT NULL DEFAULT now(),
    UNIQUE ("OrgId", "UserId")
);

-- Groups (Classes)
CREATE TABLE "OrgGroups" (
    "Id"    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "OrgId" uuid NOT NULL REFERENCES "Organizations"("Id") ON DELETE CASCADE,
    "Name"  text NOT NULL,
    "CreatedBy" uuid NOT NULL REFERENCES "Users"("Id")
);

-- Group Members
CREATE TABLE "GroupMembers" (
    "GroupId" uuid NOT NULL REFERENCES "OrgGroups"("Id") ON DELETE CASCADE,
    "UserId"  uuid NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    PRIMARY KEY ("GroupId", "UserId")
);

-- Form Assignments
CREATE TABLE "FormAssignments" (
    "Id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "FormId"     uuid NOT NULL REFERENCES "Forms"("Id") ON DELETE CASCADE,
    "GroupId"    uuid NOT NULL REFERENCES "OrgGroups"("Id") ON DELETE CASCADE,
    "AssignedBy" uuid NOT NULL REFERENCES "Users"("Id"),
    "OpensAt"    timestamptz,
    "ClosesAt"   timestamptz,
    "Mode"       text NOT NULL DEFAULT 'attempt_once',
    "CreatedAt"  timestamptz NOT NULL DEFAULT now()
);

-- Invite tokens
CREATE TABLE "OrgInvites" (
    "Id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "OrgId"     uuid NOT NULL REFERENCES "Organizations"("Id") ON DELETE CASCADE,
    "Token"     text NOT NULL UNIQUE,
    "Role"      text NOT NULL DEFAULT 'member',
    "Email"     text,           -- null = open invite (anyone with token)
    "UsedAt"    timestamptz,
    "ExpiresAt" timestamptz,
    "CreatedBy" uuid NOT NULL REFERENCES "Users"("Id")
);
```

Changes to existing tables:
```sql
ALTER TABLE "Forms" ADD COLUMN "OrgId"      uuid REFERENCES "Organizations"("Id");
ALTER TABLE "Forms" ADD COLUMN "AccessMode" text NOT NULL DEFAULT 'public';
```

---

## API Endpoints (New)

```
POST   /api/orgs                          Create org
GET    /api/orgs/:slug                    Get org info
POST   /api/orgs/:id/members              Invite / bulk-add members
PATCH  /api/orgs/:id/members/:userId      Change role
DELETE /api/orgs/:id/members/:userId      Remove member

POST   /api/orgs/:id/groups               Create group
POST   /api/orgs/:id/groups/:gId/members  Add members to group

POST   /api/forms/:id/assignments         Assign form to group
GET    /api/forms/:id/assignments         List assignments
GET    /api/forms/:id/assignments/:aId/results  Per-assignment result table

GET    /api/students/me/results           Student's own result history
POST   /api/orgs/join/:token              Student joins via invite link
```

---

## Frontend Pages (New)

| Page | Path | Who sees it |
|---|---|---|
| Org dashboard | `/org/:slug` | Admin / Moderator |
| Group management | `/org/:slug/groups` | Admin |
| Member management | `/org/:slug/members` | Admin |
| Assignment results | `/forms/:id/assignments/:aId` | Moderator |
| Student results | `/my-results` | Member |
| Join org | `/join/:token` | Anyone |

---

## What Stays the Same

- Public forms work exactly as today — no org required
- Existing `allowedEmails` mode still works (renamed `invite_only`)
- Quiz Mode scoring, ThankYou screen, CSV export — unchanged
- No change to the form fill URL structure (`/f/:slug`)

---

## Edge Cases to Resolve Before Building

| Case | Decision needed |
|---|---|
| Student in multiple orgs | Each org is independent; results scoped per org |
| Form reused across groups | One form, multiple assignments — scores separate per assignment |
| Student leaves org mid-quiz | Their in-progress submission still counts |
| Moderator leaves org | Assignments stay; results remain; new moderator reassigned manually |
| Public form + org assignment | `accessMode` controls — can't be both public and group-locked |
| Anonymous respondents | Org/group mode requires login; anonymous mode disabled automatically |
| Free tier limits | Cap: 1 org, 3 groups, 50 members (decide before building) |

---

## Build Order (When We Start)

1. **Org + Members** (backend entities, invite flow, join page)
2. **Groups** (create, add members)
3. **Form access control** (accessMode guard in ResponseService.SubmitAsync)
4. **Assignments** (assign form to group, schedule window)
5. **Moderator dashboard** (assignment results table, CSV)
6. **Student dashboard** (my results, per-question replay)

---

*Document created: 2026-05-20*
*Status: Design only — not started*
