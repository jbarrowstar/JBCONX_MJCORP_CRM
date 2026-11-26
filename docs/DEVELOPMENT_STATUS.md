# Development Status (accurate as of 21 Nov 2026)

This file replaces an earlier version that marked nearly every screen "completed". Those screens were visual prototypes driven by sample data. Status below reflects what actually talks to the real backend.

## Connected to the real backend (tested)

| Area | App | Notes |
|---|---|---|
| Login, current user, logout, session restore, change password | admin web + agent mobile | JWT, server-side revocation, 4 lowercase roles |
| Role-based routes and navigation | admin web (+ mobile guard) | backend re-enforces everything |
| Staff management | admin web | create, edit, activate/deactivate, reset password, search, filter, pagination |
| Team management | admin web | create/edit/delete, leader, roster add/remove, counts |
| Agent profile | agent mobile | real account data |
| Lead management (list, filters, create/edit, status, assign, bulk assign, notes, timeline) | admin web | CSV export covers the visible page only |
| Follow-ups & tasks (overdue/upcoming/done, complete, reschedule, cancel) | admin web | scheduled from a lead |
| Dashboard (KPIs, trend, sources, pipeline, attendance today) and Reports (team, agent, attendance, visits, onboarding, funnel; date ranges; CSV) | admin web | role-scoped aggregates from the backend |
| Dashboard (own numbers, target progress, 30-day activity) | agent mobile | |
| Visits & Attendance monitoring (records, GPS links, flags, mark leave/absence, fix check-out) and Customer Visits (list, filters, drawer, photos, edit) | admin web | map links open OpenStreetMap; no coordinates are sent to third parties by the CRM |
| Attendance (check in/out with GPS) and Customer visits (record with GPS + photos) | agent mobile | browser geolocation/file input; native Capacitor paths untested |
| My leads, lead details, status, notes, new lead, follow-ups | agent mobile | respects the admin 'agents can create leads' setting |

## Preview only (sample data, marked "Preview" in the UI)

Field tracking, Onboarding/documents, Settings (admin web). The agent mobile app has no preview screens left. Backend endpoints for all of these exist and are documented in the backend `docs/API_CONTRACT.md`; the screens are wired in later phases.

## Not done

- Native Capacitor features: camera, geolocation permissions, Android project, device testing (Phase 7). The GPS/photo code paths exist and the browser paths are tested; native paths are not. Mobile token storage uses `@capacitor/preferences` code that is untested on a device and is not encrypted storage.
- Real map for tracking.
- Frontend tests for preview screens.
- Dependency upgrades flagged by `npm audit` (react-router 7, zod 4) are deferred; see `FRONTEND_TESTING.md`.

## Removed

- Fabricated "live" store-downloads card (hardcoded numbers + random increments) and its types.
- Embedded agent portal inside the admin web (the mobile app is the only agent client).
- Hard-coded logged-in users, pre-filled demo credentials, the fake notification, dead login pages.
