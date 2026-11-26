# Implementation Progress

## Phase 1 — Audit: complete (`IMPLEMENTATION_AUDIT.md`)
## Backend (Phases 2/4/5/6/8/9-backend): complete and tested (see the backend repo docs)
## Phase 3 — Frontend authentication & administration: complete (this delivery)

1. **Inspected:** all admin-web and agent-mobile auth/store/routing/layout code, the staff and team pages, shared types, and the backend contract.
2. **Implemented:**
   - Shared API/auth layer (`shared/api`, `shared/auth`): typed client, error normalisation (server field errors → form errors), automatic sign-out when the server ends a session, session restore, role helpers that mirror the backend hierarchy.
   - Real login / current user / logout / change password in both apps; the mock "always logged in" state is gone.
   - Four lowercase roles everywhere; role-based navigation and route guards; field agents blocked from the admin web and managers from the mobile app.
   - Staff Management and Team Management connected to the backend (loading, empty, error, validation, success states, search, filters, server pagination).
   - Honest "Preview" banners and sidebar badges on screens that still use sample data.
   - Removed: fabricated store-downloads card, embedded agent portal, fake notification, pre-filled credentials, dead login pages.
3. **Files created:** `shared/api/*`, `shared/auth/*`, `redux/services/{authApi,staffApi,teamApi}.ts`, `redux/session.ts`, `redux/slices/toastSlice.ts`, common components (Modal, States, Pagination, ConfirmDialog, ToastHost, PreviewBanner), `features/auth/*`, `features/staff/*`, `features/teams/*` (rewritten), `components/layout/navigation.ts`, mobile `auth/tokenStorage.ts`, `.env.example` ×2, tests ×4, docs.
4. **Files modified:** stores, `baseApi`, `authSlice`, layouts, routes, `App`, mobile login/profile/layout, `shared/types`, dashboard page (card removed), notification slice, `package.json` (test scripts + dev dependencies: vitest, happy-dom, Testing Library).
5. **APIs used:** `/auth/*`, `/users*`, `/teams*` (see backend `API_CONTRACT.md`). No endpoint was invented.
6. **Database changes:** none.
7. **Tests executed:** see `FRONTEND_TESTING.md` — 54 UI/integration tests against the live backend, plus `tsc` and production builds for both apps.
8. **Results:** 54/54 pass; both builds succeed; 0 type errors.
9. **Remaining problems:**
   - Screens for leads, follow-ups, dashboard, reports, attendance, visits, tracking, onboarding, settings are still previews.
   - JWT lifetime defaults to 1 hour with no refresh token: a field agent's day-long session will end mid-shift. **Decision needed** (raise `JWT_EXPIRES_IN` for now, or add refresh tokens).
   - Mobile token storage is Capacitor Preferences (not encrypted) and untested on a device.
   - `npm audit`: react-router (moderate) and zod (high) need major-version upgrades; practical exposure is low in this app (internal navigation only; zod validates small client-side forms) but schedule them.
   - Admin bundle is ~920 kB (no code-splitting yet).
10. **Next phase:** Phase 4 — leads and follow-ups UI (lead list/detail/assignment, follow-ups, activity timeline) against the existing backend endpoints.


## Phase 4 — Leads and follow-ups UI: complete (19 Nov 2026)

1. **Inspected:** existing lead/follow-up pages (sample-data prototypes), the backend lead/follow-up/settings contract, shared constants.
2. **Implemented:**
   - Shared CRM types, labels, badges and activity timeline (`shared/api/crm.ts`, `shared/components/*`); one `crmApi` (leads, follow-ups, read-only public settings) used by both apps.
   - Admin web **Lead Management**: server-side search/filters/sort/paging, create and edit, status workflow, single and bulk assignment, notes, timeline, follow-ups inside a detail drawer (deep-linkable `?lead=`), "Export this page" CSV.
   - Admin web **Follow-ups & Tasks**: summary cards, Overdue/Upcoming/Completed/Cancelled tabs, filters, complete / reschedule / cancel.
   - Agent mobile **My leads**: own leads with search and filters, new lead (when the organisation allows it), lead sheet (tap-to-call, status, restricted edit, notes, timeline, follow-ups) and a Follow-ups tab.
   - CSV export now neutralises spreadsheet-formula injection.
3. **Files created:** `shared/api/crm.ts`, `shared/components/{LeadBadges,ActivityTimeline}.tsx`, `redux/services/crmApi.ts` (x2), admin `features/leads/*`, `features/followups/*`, mobile `features/leads/*`, mobile toast/sheet components, tests (admin 25, mobile 12), `SETUP_GUIDE.md`.
4. **Files modified:** navigation (Leads and Follow-ups now live), baseApi tag types, mobile layout/store, `ActivityTimeline` (no duplicate text), `exportUtils`.
5. **APIs used:** `/leads*`, `/followups*`, `/settings` (read), `/users` and `/teams` (pickers). No endpoint invented.
6. **Database changes:** none.
7. **Tests executed:** 91 UI/integration tests against the live backend (see `FRONTEND_TESTING.md`), plus `tsc` and production builds.
8. **Results:** 91/91 pass; both apps typecheck and build.
9. **Remaining problems:** unchanged from Phase 3 (token lifetime decision, dependency upgrades, untested native storage), plus: lead CSV export is page-only; no map/geo features yet.
10. **Next phase:** Phase 5 — dashboard and reports (replace the sample KPIs/charts with the backend aggregations), then Phase 6 attendance & visits.


## Phase 5 — Dashboard and reports: complete (20 Nov 2026)

1. **Inspected:** the sample-data dashboard/reports/mobile dashboard screens and the backend aggregation contract.
2. **Implemented:**
   - Admin **Dashboard**: lead, conversion, unassigned, follow-up, visit and attendance KPIs; six-month created-vs-converted trend; lead sources; pipeline by status; attendance today; role-aware scope label; Refresh. Removed the hard-coded figures and the "Live Tracking Active" label.
   - Admin **Reports & Analytics**: team performance (+chart), agent performance, attendance summary, customer visits (per day, per outcome, per agent), onboarding progress, lead funnel; date presets and custom range with validation; team filter for managers; per-table CSV export.
   - Agent **Dashboard**: own lead/follow-up/visit/attendance numbers, monthly-target progress, "last 30 days" activity, overdue banner.
3. **Files created:** `shared/api/reports.ts`, `redux/services/dashboardApi.ts` (x2), `features/reports/ReportParts.tsx`; rewrote `AdminDashboardPage`, `ReportsPage`, `AgentDashboardPage`; tests (admin 16, mobile 4).
4. **Files modified:** navigation (Dashboard and Reports live), mobile layout/baseApi, an older auth test.
5. **APIs used:** `/dashboard`, `/reports/*` (all existing, no new endpoints).
6. **Database changes:** none.
7. **Tests executed:** 111 UI/integration tests against the live backend; `tsc` and production builds.
8. **Results:** 111/111 pass.
9. **Remaining problems:** reports are not paginated (the backend returns whole result sets; fine for current scale, revisit for very large teams); attendance and visit figures will stay near zero until Phase 6/7 lets agents record them in the app; no scheduled/exported PDF reports.
10. **Next phase:** Phase 6 — attendance and customer visits screens (admin monitoring + agent recording), with GPS captured through a device abstraction that reports "unsupported/denied" honestly instead of faking a location.


## Phase 6 — Attendance and customer visits: complete (21 Nov 2026)

1. **Inspected:** backend attendance/visit/document contracts and DTOs, the sample-data screens, the Capacitor packages already in the mobile app.
2. **Implemented:**
   - Shared field-work types/labels, one `fieldApi` (attendance, visits, photos) and an `AuthedImage` component (private photos are fetched with the bearer token).
   - **Admin Visits & Attendance:** date range in the organisation timezone, filters, check-in/out with GPS link, hours, status, geofence and low-accuracy flags, "still checked in", summary cards, CSV (this page), mark leave/absence, fix a forgotten check-out.
   - **Admin Customer Visits:** filters, list, detail drawer with notes, outcome, location, lead link, photo grid and zoom, manager edit.
   - **Agent Attendance:** check in/out through a GPS wrapper (`device/geolocation.ts`) that returns a real fix or an explicit denied/unsupported/unavailable/timeout failure; optional "continue without location" only when the organisation allows it; history.
   - **Agent Customer Visits:** record visit (customer from own leads, GPS fix required, outcome, notes, optional follow-up, up to 5 photos via camera/gallery input), upload with partial-failure handling (visit kept, retry or skip), own visit list and detail with photos.
   - Backend: malformed multipart uploads now return 400 instead of 500.
3. **Files created:** `shared/api/fieldwork.ts`, `shared/components/AuthedImage.tsx`, `redux/services/fieldApi.ts` (x2), admin `features/attendance/*`, `features/visits/*`, mobile `device/{geolocation,photos}.ts`, `features/attendance/*`, `features/visits/*`, tests (admin 17, mobile 14), test shims.
4. **Files modified:** navigation, mobile layout (preview banner removed: no preview screens remain in the app), tag types, backend error handler and tests.
5. **APIs used:** `/attendance*`, `/visits*`, `/leads/:id/documents`, `/documents/:id/download`, `/settings` (read). No endpoint invented.
6. **Database changes:** none.
7. **Tests executed:** backend 84; frontend 142 (admin 103, mobile 39); `tsc` and production builds.
8. **Results:** all pass.
9. **Remaining problems / honest limits:**
   - GPS and camera were only exercised through a browser fake / file input. The Capacitor paths are written but untested, and Android permissions (`ACCESS_FINE_LOCATION`, camera) are not configured yet (Phase 7).
   - Browsers only expose geolocation on HTTPS (or `localhost`); production must be served over HTTPS.
   - A device clock can be wrong, but attendance and visit times are set by the server; the device's GPS can in principle be spoofed (the system records accuracy and geofence flags, it cannot prove authenticity).
   - Photos are not compressed on the device (limit 5 MB each); large camera photos may need compression in Phase 7.
   - No offline queue: a punch or visit made without connectivity is not stored for later.
10. **Next phase:** Phase 7 — Capacitor/Android configuration (permissions, native geolocation and camera, secure session storage) and real-device testing; then Phase 8 (field tracking with consent, documents/onboarding screens) and Phase 9 (settings, release).
