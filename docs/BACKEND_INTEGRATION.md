# Backend integration handoff (frontend → backend)

**Audience:** backend developer (Pravin). **Status:** current as of 26 Nov 2026.
Everything here is read from the frontend code. The backend repo's `docs/API_CONTRACT.md` stays the source of
truth for the contract. This document lists what the frontend **calls and relies on**, so mismatches show up quickly.

> `docs/BACKEND_HANDOFF.md` and `docs/API_INTEGRATION.md` are older and superseded (uppercase roles, `/agents`,
> `pageSize`). Use this file instead.

---

## 1. Architecture at a glance

| | Admin web portal | Field Agent portal |
| --- | --- | --- |
| Folder | `admin-web/` | `agent-mobile/` (web + Capacitor Android) |
| Dev URL | http://localhost:3000 | http://localhost:3001 |
| Roles allowed | `super_admin`, `marketing_manager`, `team_leader` | `field_agent` |
| Routes | `/login`, `/admin/*` | `/login`, `/dashboard`, `/leads`, `/attendance`, `/visits`, `/profile` |

- React 18 + Vite 5 + TypeScript, Redux Toolkit + **RTK Query** for all API calls, Tailwind CSS.
- Shared code lives in `shared/`: API types (`shared/api/*.ts`), the base query (`shared/api/createBaseQuery.ts`),
  auth helpers (`shared/auth/*`), shared components, and the dev-only mock (`shared/mock/*`).
- API services: `admin-web/src/redux/services/*.ts` and `agent-mobile/src/redux/services/*.ts`
  (`authApi`, `crmApi`, `staffApi`, `teamApi`, `fieldApi`, `dashboardApi`).

## 2. API base URL

- `VITE_API_BASE_URL` (see each app's `.env.example`), **including** `/api/v1`, e.g. `http://localhost:5000/api/v1`.
- Dev default when unset: `http://localhost:5000/api/v1`. A **production build without it fails on purpose**
  (`resolveApiBaseUrl`).
- Request timeout: 30 s.
- **CORS:** allow the frontend origins (`http://localhost:3000`, `http://localhost:3001`; for the Android build
  `capacitor://localhost` and `http://localhost`), the `Authorization` and `Content-Type` headers, and the methods
  `GET, POST, PATCH, DELETE`.

## 3. Wire format the frontend expects

Success (`shared/api/types.ts`):

```json
{ "success": true, "data": { }, "message": "…", "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6 } }
```

- List endpoints return `data: T[]`. Paging is read from `meta.total | page | limit | totalPages`
  (**`limit`**, not `pageSize`). If a field is missing, the frontend falls back to sensible defaults.
- Single resources return `data: T`.

Error:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Human readable", "details": [{ "path": "email", "message": "Enter an email" }] } }
```

- `details[].path` is mapped to **form field names**, so validation messages appear under the right input
  (e.g. `email`, `password`, `mobileNumber`, `lostReason`, `newPassword`, `currentPassword`).
- `error.message` is shown to the user as written.

Error codes the UI reacts to specifically:

| Code / status | Where | Effect |
| --- | --- | --- |
| `401` + `AUTH_REQUIRED` or `AUTH_INVALID_TOKEN` | any request | session cleared, user sent to `/login` |
| `AUTH_INVALID_CREDENTIALS` | login | "Incorrect email or password." (**must not** use the two codes above) |
| `ACCOUNT_LOCKED` | login | "Too many failed attempts…" |
| `RATE_LIMITED` | login | "Too many requests…" |
| `409` whose message contains "mobile" | create lead | shows the duplicate warning and offers "save anyway" (`allowDuplicate: true`) |

## 4. Authentication & tokens

1. `POST /auth/login` `{ email, password }` → `data: { token, user }`.
2. The app checks `user.role`. If it is the wrong portal's role, it calls `POST /auth/logout` with that token and
   shows a message ("This account is for the Field Agent mobile app…" / "This app is for Field Agents…").
3. Every request sends `Authorization: Bearer <token>`.
4. On reload the stored token is validated with `GET /auth/me` → `data: User`. If that fails, the token is
   cleared and the user is signed out.
5. Sign out: `POST /auth/logout` (best effort), then local state is cleared anyway.
6. Change password (admin): `POST /auth/change-password` `{ currentPassword, newPassword }` → `data: { token }`.
   The frontend switches to the **new** token (other sessions are expected to be revoked).

Token storage: admin uses `sessionStorage` (or `localStorage` with "Keep me signed in"); agent uses
`localStorage` on the web and Capacitor Preferences in the Android app. Key: `jbconx.crm.token`.

**`User` shape used everywhere** (`shared/types/index.ts`): `id, name, email, phone?, employeeCode?, role,
teamId, team {id,name} | null, isActive, joiningDate?, targetLeadsMonthly?, lastLoginAt?, createdAt, updatedAt`.
Roles are lowercase: `super_admin | marketing_manager | team_leader | field_agent`.

## 5. Role expectations (UI mirrors; the backend must enforce)

- `super_admin`: everything. Can create `marketing_manager`, `team_leader` and `field_agent`.
- `marketing_manager`: organisation-wide. Can create and manage `team_leader` and `field_agent`; can write teams; can mark and correct attendance.
- `team_leader`: **own team only** (leads, staff, attendance, visits, reports). Cannot create staff or write teams. Settings route is hidden.
- `field_agent`: **own** leads, follow-ups, attendance and visits only. Cannot reach the admin portal.

The UI hides actions by role (`shared/auth/roles.ts`), but it relies on the backend to enforce every rule.

## 6. Endpoints the frontend calls

All paths are relative to `VITE_API_BASE_URL`. "A" = admin portal, "G" = agent portal.

### Auth
| Method & path | Body / params | `data` | Used by |
| --- | --- | --- | --- |
| POST `/auth/login` | `{ email, password }` | `{ token, user }` | A, G |
| GET `/auth/me` | | `User` | A, G |
| POST `/auth/logout` | | `null` | A, G |
| POST `/auth/change-password` | `{ currentPassword, newPassword }` | `{ token }` | A |
| PATCH `/users/me` | `{ name?, phone? }` | `User` | G (defined; not used by any screen yet) |

### Staff (`/users`), used by A
| Method & path | Body / params | `data` |
| --- | --- | --- |
| GET `/users` | `page, limit, search, role, teamId, isActive, unassigned, sort (name\|email\|role\|createdAt\|employeeCode), order` | `User[]` + paging |
| POST `/users` | `{ name, email, password, role, phone?, teamId?, joiningDate?, targetLeadsMonthly? }` | `User` |
| PATCH `/users/:id` | any of `name, email, role, phone, teamId, joiningDate, targetLeadsMonthly` | `User` |
| PATCH `/users/:id/status` | `{ isActive }` | `User` |
| POST `/users/:id/reset-password` | `{ newPassword }` | `null` |

Password rule shown in the UI: at least 10 characters with a letter and a digit.

### Teams (`/teams`), used by A
`Team = { id, name, description, isActive, leaderId, leader {id,name,email,employeeCode?} | null, agentCount, leadCount, convertedCount, createdAt, updatedAt }`

| Method & path | Body / params | `data` |
| --- | --- | --- |
| GET `/teams` | `page, limit, search, isActive` | `Team[]` + paging |
| POST `/teams` | `{ name, description?, leaderId? }` | `Team` |
| PATCH `/teams/:id` | `{ name?, description?, leaderId?, isActive? }` | `Team` |
| DELETE `/teams/:id` | | `null` (UI says teams with agents or leads cannot be deleted) |
| GET `/teams/:id/members` | | `User[]` (**array**) |
| POST `/teams/:id/agents` | `{ agentIds: string[] }` | `User[]` |
| DELETE `/teams/:id/agents/:agentId` | | `null` |

### Leads (`/leads`), used by A and G
`LeadDto` is in `shared/api/crm.ts` (includes `team`, `assignedAgent`, `createdBy` refs, `nextFollowUpAt`,
`isFollowUpOverdue`, `onboarding { registrationStatus, documentStatus, onboardingStatus }`).
Statuses: `new, assigned, contacted, interested, meeting_scheduled, converted, lost`. Priorities: `low, medium, high, urgent`.

| Method & path | Body / params | `data` |
| --- | --- | --- |
| GET `/leads` | `page, limit, search, status (comma-separated), priority, teamId, assignedAgentId, unassigned, leadSource, followUp (overdue\|today\|upcoming\|none), sort (createdAt\|updatedAt\|customerName\|nextFollowUpAt\|leadCode), order` | `LeadDto[]` + paging |
| GET `/leads/:id` | | `LeadDto` |
| POST `/leads` | `{ customerName, mobileNumber, city, state, leadSource, interestedService, email?, address?, priority?, teamId?, assignedAgentId?, remarks?, nextFollowUpAt? (ISO), allowDuplicate? }` | `LeadDto` |
| PATCH `/leads/:id` | partial of the editable fields | `LeadDto` |
| PATCH `/leads/:id/status` | `{ status, remarks?, lostReason? }` (`lostReason` required for `lost`) | `LeadDto` |
| POST `/leads/:id/assign` | `{ assignedAgentId?, teamId?, remarks? }` | `LeadDto` |
| POST `/leads/bulk-assign` | `{ leadIds, assignedAgentId?, teamId? }` | `{ assigned: string[], failed: {id, reason}[] }` |
| GET `/leads/:id/activities` | `page, limit` | `LeadActivityDto[]` + paging |
| POST `/leads/:id/activities` | `{ message }` | `null` |
| GET `/leads/:id/documents` | | `DocumentDto[]` |

Agents may set only `contacted, interested, meeting_scheduled, converted, lost`. The agent UI says a closed lead
can only be reopened by the team leader. Closing a lead is described in the UI as cancelling its pending follow-ups.

### Follow-ups (`/followups`), used by A and G
| Method & path | Body / params | `data` |
| --- | --- | --- |
| GET `/followups` | `page, limit, status (pending\|overdue\|completed\|cancelled), type, leadId, assignedAgentId, order` | `FollowUpDto[]` + paging |
| GET `/followups/summary` | | `{ pending, overdue, dueToday, completed }` |
| POST `/followups` | `{ leadId, type, dueAt (ISO), notes?, assignedAgentId? }` | `FollowUpDto` |
| PATCH `/followups/:id` | `{ type?, dueAt?, notes? }` | `FollowUpDto` |
| POST `/followups/:id/complete` | `{ outcomeNotes? }` | `FollowUpDto` |
| POST `/followups/:id/cancel` | `{ reason? }` | `FollowUpDto` |

Types: `call, meeting, customer_visit, demo, documentation, other`. `displayStatus` is
`pending | overdue | completed | cancelled`.
⚠ **Please confirm:** the "Upcoming" tab sends `status=pending` and labels its count as `pending − overdue`, so the
frontend assumes `status=pending` returns pending items that are **not** overdue.

### Settings, used by A and G
| GET `/settings` | → `{ organization { name }, attendance { timezone }, operational { agentsCanCreateLeads, requireCheckInForVisits, leadSources: string[] } }` |
| --- | --- |

`leadSources` fills the lead-source dropdowns. `agentsCanCreateLeads` shows or hides "New lead" for agents.

### Attendance (`/attendance`)
`AttendanceDto` in `shared/api/fieldwork.ts`: `date` is `YYYY-MM-DD` **in the organisation timezone**; `checkIn` and
`checkOut` are `{ at, latitude?, longitude?, accuracy?, lowAccuracy?, withinGeofence?, distanceMeters? }`;
plus `workingMinutes, isOpen, status (present|half_day|absent|on_leave), source (self|admin), agent {id,name,employeeCode?}`.

| Method & path | Body / params | `data` | Used by |
| --- | --- | --- | --- |
| GET `/attendance` | `page, limit, agentId, teamId, status, from, to` (`YYYY-MM-DD`) | `AttendanceDto[]` + paging | A |
| POST `/attendance/mark` | `{ agentId, date, status, remarks? }` | `AttendanceDto` | A |
| PATCH `/attendance/:id/correct` | `{ checkOutAt?, remarks }` | `AttendanceDto` | A |
| GET `/attendance/today` | | `AttendanceDto \| null` | G |
| GET `/attendance/me` | `page, limit, from?, to?` | `AttendanceDto[]` + paging | G |
| POST `/attendance/check-in` | `{ latitude?, longitude?, accuracy?, remarks? }` | `AttendanceDto` | G |
| POST `/attendance/check-out` | same | `AttendanceDto` | G |

### Visits (`/visits`)
`VisitDto`: `lead {id, leadCode, customerName, city}`, `agent`, `visitedAt`, `location {latitude, longitude, accuracy?, lowAccuracy?}`,
`notes`, `outcome (interested|not_interested|follow_up_required|converted|not_available|other)`,
`status (completed|cancelled|rescheduled)`, `nextFollowUpAt`, `followUpId`, `photoCount`.

| Method & path | Body / params | `data` | Used by |
| --- | --- | --- | --- |
| GET `/visits` | `page, limit, agentId, teamId, leadId, outcome, status, from, to` (**ISO** datetimes) | `VisitDto[]` + paging | A, G |
| POST `/visits` | `{ leadId, latitude, longitude, accuracy?, notes, outcome, visitedAt?, nextFollowUpAt? }` | `VisitDto` | G |
| PATCH `/visits/:id` | `{ notes?, outcome?, status? }` | `VisitDto` | A |
| POST `/visits/:id/photos` | `multipart/form-data`, field **`photos`** (repeated), max 5 per visit, 5 MB each (client-side checks) | `DocumentDto[]` | G |

`requireCheckInForVisits` is enforced by the backend. The agent UI expects an error message it can show.

**Photos / documents:** `DocumentDto.downloadPath` is a path **relative to the API origin**. The UI loads
`new URL(VITE_API_BASE_URL).origin + downloadPath` with `fetch` and the `Authorization` header (not a plain `<img src>`),
so that route must accept the bearer token and allow it through CORS.

### Dashboard & reports, used by A and G
| Method & path | Params | `data` |
| --- | --- | --- |
| GET `/dashboard` | | `DashboardDto` (`shared/api/reports.ts`): `leads{…}, followUps{pending,dueToday,overdue}, visits{today}, attendanceToday{…}, monthlyTrend[{month:'YYYY-MM',created,converted}], sourceDistribution[], timezone, generatedAt`, and for agents `personal{monthlyTarget, convertedThisMonth, targetProgress}` |
| GET `/reports/team-performance` | `from, to` (ISO), `teamId?` | `{ range, teams: TeamPerformanceRow[] }` |
| GET `/reports/agent-performance` | same | `{ range, agents: AgentPerformanceRow[] }` (the agent Home uses it for "My last 30 days") |
| GET `/reports/attendance-summary` | same | `{ range, agents: AttendanceSummaryRow[] }` |
| GET `/reports/visit-summary` | same | `{ range, total, byOutcome, byDay[{date,visits}], byAgent[] }` |
| GET `/reports/onboarding-progress` | same | `{ registration, documents, onboarding }` (count maps) |
| GET `/reports/lead-funnel` | same | `{ range, byStatus, byPriority, bySource[{source,total,converted,conversionRate}] }` |

The dashboard is expected to be **scoped by the caller's role** (whole organisation, the leader's team, or the agent's own data).

## 7. Mock mode (frontend-only, development only)

`npm run dev:mock` answers all of the endpoints above **in the browser** (`shared/mock/mockBackend.ts`), with sample data, so
the UI can be tested without the backend. It is enabled only on the Vite dev server **and** with
`VITE_ENABLE_MOCK_AUTH=true` (`--mode mock` loads `.env.mock`). Production builds remove it entirely; this was verified
by building with the flag set. Normal `npm run dev` / `npm run build` always use the real API. Details: `docs/MOCK_MODE.md`.

The mock mirrors the contract above. If the real backend differs, **the backend wins**: tell the frontend so the
services and types can be updated.

## 8. What is (and is not) integrated

| Screen | Data source |
| --- | --- |
| Admin: Dashboard, Leads, Staff, Teams, Visits & Attendance, Follow-ups, Customer Visits, Reports | **Real API** (sections 4–6) |
| Agent: Home, Leads/Follow-ups, Attendance, Visits, Profile | **Real API** |
| Admin: Field Tracking, Registration & Onboarding, Settings | **Preview screens with built-in sample data**, not connected (planned Phase 8/9). Banner says "Preview screen". |

Not built in the frontend yet: notifications (the header bell only appears when the store has items), campaigns,
live GPS tracking, document uploads other than visit photos, and self-service profile editing (`PATCH /users/me` is defined but unused).

## 9. Known frontend items to be aware of

- `admin-web` **`npm run build` currently fails at `tsc`** because of 20 pre-existing type errors in **unrouted legacy files**
  (`src/features/agent/*`, `src/components/mobile/*`, `src/features/agents/AgentManagementPage.tsx`,
  `src/features/auth/AdminLoginPage.tsx`, `src/features/auth/UnifiedLoginPage.tsx`). The app itself compiles and
  `npx vite build` succeeds. `agent-mobile` builds cleanly.
- The integration tests (`npm test` in each app) need a running **test** backend (`docs/FRONTEND_TESTING.md`).
- `npm audit` (runtime deps): `react-router-dom` 6.x (moderate) and `zod` 3.x (high, oversized-input memory use).
  The fixes are major-version upgrades and have not been applied yet.
