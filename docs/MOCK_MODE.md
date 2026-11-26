# Mock mode (development-only UI testing without the backend)

Mock mode lets you sign in to **both** the Admin web portal and the Field Agent portal and use every
integrated screen **without the CRM backend** (`localhost:5000`). It exists only so the frontend can be
tested while the backend is unavailable.

> **Nothing in mock mode is real.** All data is sample data kept in your browser. Nothing is sent to the
> backend and **nothing is saved to MongoDB**. A yellow **MOCK MODE · sample data** pill in the
> bottom-right corner is shown whenever it is active.

---

## 1. Start the apps in mock mode

From the frontend root (`JBCONX_MJCORP_CRM`):

```bash
npm install --legacy-peer-deps     # first time only
npm run dev:mock                   # starts BOTH apps in mock mode
```

Or one app at a time:

```bash
npm run dev:admin:mock     # Admin portal  -> http://localhost:3000
npm run dev:mobile:mock    # Agent portal  -> http://localhost:3001
```

| App | URL |
| --- | --- |
| Admin web portal | http://localhost:3000 |
| Field Agent portal | http://localhost:3001 |

`dev:mock` runs Vite with `--mode mock`, which loads `admin-web/.env.mock` and `agent-mobile/.env.mock`
(`VITE_ENABLE_MOCK_AUTH=true`).

## 2. Mock credentials

Every mock account uses the password **`password123`**. In mock mode the login page also shows buttons
that fill these in for you.

| Portal | Role (application role) | Email | Lands on |
| --- | --- | --- | --- |
| Admin | Super Admin (`super_admin`) | `admin@jbconx.com` | `/admin/dashboard` |
| Admin | Marketing Manager (`marketing_manager`) | `manager@jbconx.com` | `/admin/dashboard` |
| Admin | Team Leader (`team_leader`, team *Alpha*) | `leader@jbconx.com` | `/admin/dashboard` (team scope) |
| Agent | Field Agent (`field_agent`, team *Alpha*) | `agent.miller@jbconx.com` | `/dashboard` |

Other seeded staff (e.g. `priya@jbconx.com`, `ravi@jbconx.com`) also sign in with `password123`.
Accounts you create on the Staff page sign in with the password you gave them, in that same app.

Role separation is the app's normal behaviour and is unchanged:

- The Admin portal rejects field-agent accounts ("This account is for the Field Agent mobile app").
- The Agent portal rejects management accounts ("This app is for Field Agents…").
- Route guards still apply: e.g. a Team Leader opening `/admin/settings` is sent back to the dashboard,
  and signed-out users are sent to `/login`.

## 3. What is simulated

Requests that would go to the API are answered in the browser by `shared/mock/mockBackend.ts`, using the
**same endpoints, response envelope (`{ success, data, message, meta }`) and error codes** as the real
backend. The same scope rules apply: managers see everything, team leaders see their team, agents see
only their own leads, follow-ups, attendance and visits.

| Area | Works in mock mode |
| --- | --- |
| Sign-in / sign-out / session restore / change password | Yes |
| Dashboard (admin & agent) | Yes, computed from the mock data |
| Leads | List, search, filters, sort, pagination, create (incl. duplicate-mobile warning), edit, status changes, assign / bulk assign, notes, timeline |
| Follow-ups | Summary, tabs, filters, schedule, reschedule, complete, cancel |
| Staff | List, filters, add, edit, activate / deactivate, reset password |
| Teams | List, search, create, edit, delete (blocked while it has agents/leads), roster add/remove |
| Visits & Attendance (admin) | List, filters, mark leave/absence, fix check-out |
| Customer visits (admin) | List, filters, visit details |
| Reports | All six tabs, date ranges, team filter, CSV export |
| Agent attendance | Check in / check out (uses the browser's location) |
| Agent visits | Record visit (requires check-in, as configured), photos, details |
| Agent profile | Yes |

Data is **seeded relative to today's date** (≈32 leads, 10 staff, 3 teams, 14 days of attendance, recent
visits and follow-ups), so dashboards and "today/overdue" views always have something to show.

## 4. How the mock data behaves

- Stored in the browser's `localStorage` (key `jbconx.mock.db.v1`), so it **survives page reloads**.
- **Per app:** the Admin (port 3000) and Agent (port 3001) portals are different browser origins, so each
  keeps its **own copy**. A lead created in the Admin portal does not appear in the Agent portal.
- Uploaded visit photos are kept in memory for the current browser session only. After a reload they
  show as "Unavailable".
- **Reset:** click the **MOCK MODE** pill → **Reset mock data** (restores the sample data and signs you out).
- Requests have a short artificial delay so loading states are visible.

## 5. What still needs the real backend

- Real accounts, real data, and anything persisted to MongoDB.
- Shared data between the Admin and Agent portals (and between browsers / machines).
- Server-side validation and business rules beyond what the mock imitates. The mock mirrors the main
  rules but is **not** the source of truth. Always re-test against the backend.
- Real document/photo storage and downloads.
- Rate limiting, account lockout, token expiry, geofence checks.
- The automated test suites (`npm test`), which require a running **test** backend (see
  `docs/FRONTEND_TESTING.md`). They are not affected by mock mode.
- Field Tracking, Registration & Onboarding and Settings are still **preview screens** with built-in
  sample data, with or without mock mode.

## 6. Turn mock mode off / return to the real backend

Mock mode is only active when **both** are true:

1. the app runs on the Vite dev server, and
2. `VITE_ENABLE_MOCK_AUTH=true` is set (which `--mode mock` does).

So to use the real backend, run the normal scripts:

```bash
npm run dev            # both apps, real backend
npm run dev:admin      # admin only
npm run dev:mobile     # agent only
```

The apps then call `VITE_API_BASE_URL` (default `http://localhost:5000/api/v1`) exactly as before.
When Pravin's backend is running (see `RUN_INSTRUCTIONS.md`), sign in with real accounts.

- If you had signed in with a mock account, the stored mock token is rejected by the real backend and
  you are sent to the login page. That is expected.
- To remove mock mode completely, delete `shared/mock/`, the two `.env.mock` files and the `dev:*mock`
  scripts, then remove the few lines guarded by `MOCK_API_ENABLED` (listed below).

## 7. Safety: why this cannot reach production

- `MOCK_API_ENABLED` (`shared/mock/mockMode.ts`) requires `import.meta.env.DEV`, which Vite replaces
  with `false` in every `vite build`. Every place that uses mock mode also writes `import.meta.env.DEV`
  out directly, so production builds **remove** those branches and the mock files.
  Verified: building both apps with `VITE_ENABLE_MOCK_AUTH=true` set produces **no** mock code in `dist/`.
- The real authentication path is unchanged: with mock mode off, `createBaseQuery` uses the normal
  network transport, and the token handling, 401 handling and route guards are the same code in both modes.

### Files involved

| File | Purpose |
| --- | --- |
| `shared/mock/mockMode.ts` | The on/off flag and the documented mock credentials |
| `shared/mock/mockBackend.ts` | In-browser mock API (seed data, endpoints, scope rules) |
| `shared/mock/MockModeBanner.tsx` | The MOCK MODE pill + reset |
| `shared/mock/MockCredentialsHint.tsx` | Test-account buttons on the login pages |
| `shared/api/createBaseQuery.ts` | Optional `mockTransport` (unused unless mock mode is on) |
| `admin-web/src/redux/services/baseApi.ts`, `agent-mobile/src/redux/services/baseApi.ts` | Pass the mock transport in dev mock mode |
| `admin-web/src/App.tsx`, `agent-mobile/src/App.tsx` | Show the banner in mock mode |
| `admin-web/src/features/auth/LoginPage.tsx`, `agent-mobile/src/features/auth/AgentLoginPage.tsx` | Show test accounts; skip the server logout call in mock mode |
| `shared/components/AuthedImage.tsx` | Show photos uploaded in mock mode |
| `admin-web/.env.mock`, `agent-mobile/.env.mock` | `VITE_ENABLE_MOCK_AUTH=true` for `--mode mock` |
| `*/src/vite-env.d.ts`, `package.json` files | Env typing and the `dev:*mock` scripts |
