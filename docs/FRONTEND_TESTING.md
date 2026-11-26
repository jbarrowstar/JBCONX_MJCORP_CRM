# Frontend Testing (Phase 3)

All figures below were **executed**, not assumed. Date of run: 21 Nov 2026.

## What the tests are

Component/integration tests (Vitest + React Testing Library + happy-dom). They render the **real screens** with the **real Redux store and RTK Query layer** and talk over **real HTTP to a real running CRM backend and MongoDB**. Test data is created through the backend API; nothing in the UI layer is mocked.

| Suite | Tests |
|---|---|
| `admin-web/tests/auth.test.tsx` | 19 |
| `admin-web/tests/staff.test.tsx` | 17 |
| `admin-web/tests/teams.test.tsx` | 9 |
| `admin-web/tests/leads.test.tsx` | 16 |
| `admin-web/tests/followups.test.tsx` | 9 |
| `admin-web/tests/dashboard.test.tsx` | 7 |
| `admin-web/tests/reports.test.tsx` | 9 |
| `admin-web/tests/attendance.test.tsx` | 10 |
| `admin-web/tests/visits.test.tsx` | 7 |
| `agent-mobile/tests/auth.test.tsx` | 9 |
| `agent-mobile/tests/leads.test.tsx` | 12 |
| `agent-mobile/tests/dashboard.test.tsx` | 4 |
| `agent-mobile/tests/attendance.test.tsx` | 7 |
| `agent-mobile/tests/visits.test.tsx` | 7 |
| **Total** | **142 — all passed** (admin web 103, mobile 39) |

Also executed: `tsc --noEmit` and `npm run build` for both apps (0 type errors; builds succeed).

## What is covered

- Login (validation, wrong password, unknown account, success), token storage (tab-only vs "keep me signed in"), field agents refused on the admin web and managers refused on the mobile app (token revoked).
- Session restore on reload (valid / invalid / wrong-role tokens), route guards, role-based navigation, `Settings` hidden from team leaders.
- Sign-out revokes the token on the server; a session revoked mid-use (account deactivated) signs the user out on the next request (admin web and mobile).
- Change password (policy, wrong current password, token rotation keeps the session, old token revoked).
- Staff: live list, search, role filter, server pagination, empty state, hierarchy-aware role options, create (client + server validation, persists, new user can sign in), edit, activate/deactivate with confirmation, reset password, backend rule messages surfaced, read-only team-leader view, managers never see super admins.
- Teams: live list with counts and search, create with free leaders only, duplicate-name conflict, edit, roster add/remove, delete rules, read-only team-leader view.
- Leads: live list, search, server filters (status, priority, team, agent, source, follow-up, unassigned), sort, paging, create (validation, duplicate-number confirmation, assignment, first follow-up), edit, status workflow (lost needs a reason; agents cannot reopen closed leads), single and bulk assignment with per-lead failure reporting, notes and timeline, deep links, team-leader scoping. Mobile: own leads only, create (respecting the admin setting), tap-to-call, restricted edit, status, notes.
- Follow-ups: summary cards match the backend, overdue/upcoming/completed/cancelled tabs, type filter, complete/reschedule/cancel, closing a lead cancels its follow-ups, leader scoping; mobile follow-ups tab per agent.
- Dashboard and reports: KPIs checked against hand-computed values from a seeded scenario (6 leads in known statuses, follow-ups, a visit, a check-in) **and** against the API for the same user; role scoping (leader = own team, manager = organisation); Refresh; empty states; team filter; date presets, custom and invalid ranges; every report tab; CSV export content including formula neutralisation. Mobile dashboard: own numbers, target progress, 30-day activity, banner link, new-agent zeros.
- Attendance (admin): live records with times, GPS links, hours, status, geofence / low-accuracy flags, still-checked-in state, manager-marked leave, summary cards vs the API, filters and date validation, mark attendance, fix a forgotten check-out (reason required, audited), leader scoping and read-only view. Attendance (mobile): check in / out with a deterministic GPS mock; permission denied, unsupported and timeout are reported honestly and create no record; "continue without location" only when the organisation allows it; server geofence refusal shown; state restored from the server; manager-marked days in the history.
- Visits (admin): list, filters, drawer with notes/outcome/location/lead link, photos fetched with the user's bearer token, photo privacy (no token 401, other team 404, owner's manager 200), manager edit, leader scoping. Visits (mobile): record a visit with the real GPS fix, outcome, follow-up and photo (bytes verified server-side), no GPS = no save, client photo rules (type/count/size), server-side rejection of a fake image keeps the visit and offers retry/skip, own leads only, own visits only.
- Preview banners on sample-data screens; the fabricated store-downloads card and fake notification are gone.

## Bugs these tests found (fixed)

1. **Silent team removal:** the edit form's team `<select>` was uncontrolled while its options load asynchronously, so saving an agent could unassign them from their team. Selects are now controlled; there is a regression test.
2. The role select could display a different option than the form held (same cause).
4. **Attendance fix dialog:** defaulted to the current time rounded to the minute, which could be *before* a check-in made seconds earlier and was refused; blank now means "now" (server time).
5. **Attendance dates:** the default range used the viewer's clock; it now uses the organisation timezone.
6. **Backend:** a malformed or truncated multipart upload returned HTTP 500; it is now a 400 (regression test added, backend suite = 84).
3. **Backend:** API responses had no `Cache-Control`, so a client cache could replay one user's `/auth/me` for another token. The backend now sends `Cache-Control: no-store` on every API response (backend suite updated, 83 tests).

## How to run

```bash
# 1. start a TEST backend + database (never production data). From the backend repo:
#    NODE_ENV=development, MONGODB_URI=<a *_e2e or *_test database>, create a super admin with `npm run create:admin`
# 2. then, in this repo:
export VITE_API_BASE_URL="http://localhost:5000/api/v1"
export E2E_ADMIN_EMAIL="<super admin email of the TEST backend>"
export E2E_ADMIN_PASSWORD="<its password>"
npm test -w admin-web
npm test -w agent-mobile
```

The tests **create users and teams** in whichever backend they point at (unique names per run, nothing is deleted). Use a disposable database. Set high `RATE_LIMIT_MAX`/`LOGIN_RATE_LIMIT_MAX` on that backend or the login limiter will interfere.

## Not tested — do not assume these work

- Any real browser (tests run in happy-dom), visual layout/responsiveness, accessibility audits.
- The Capacitor native branch (`@capacitor/preferences`), Android build, camera, GPS. Phase 7.
- Charts are checked only for presence (happy-dom does not lay out SVG); their data comes from the same responses the tables use.
- Real device GPS and camera. Tests use a deterministic fake `navigator.geolocation` and a file input; the Capacitor native paths (`@capacitor/geolocation`, `@capacitor/camera`) are written but never exercised (Phase 7).
- The preview screens (tracking, onboarding, settings) have no tests because they are not connected to the backend yet.
- Lead CSV export ("Export this page") is a browser download and is not exercised by the tests.
- The service worker and the PWA install flow.
- Cross-browser behaviour, slow/failed networks beyond the happy-dom environment, token expiry after 1 hour while the app stays open (the next request signs the user out, which is tested through revocation, not through real expiry).

## Test-environment notes

- happy-dom's `Response.clone()` drops bodies, so `tests/setup.ts` buffers responses (as bytes). This is test-only code.
- happy-dom's `FormData` serializer omits the closing boundary, drops binary bytes and ignores filenames, so `tests/multipartShim.ts` re-encodes uploads correctly. Test-only; real browsers and the Android WebView are unaffected.
- The tests reuse one Redux store per file and reset it between cases (an RTK Query api object must not be attached to several stores).
