# JBConX Marketing CRM

Enterprise Marketing CRM suite composed of:
1. **Admin Web Portal**: Modern SaaS dashboard for Super Admins, Managers, and Team Leads.
2. **Field Agent Mobile App**: Mobile application with native Capacitor capabilities (GPS tracking, Camera capture).

## Brand & UI
- Official JBCONX logo artwork: `shared/assets/brand/`
- Brand blues (from the logo): `#00529C` (primary) and `#6096BA` (secondary). The full scale is in `shared/styles/tailwind.preset.mjs`.
- Shared UI primitives (buttons, form controls, tables, badges): `shared/styles/ui.css`. Single theme (Sapphire).

## Development Scripts

Run both applications simultaneously:
```bash
npm run dev
```

Run Admin Web independently (port 3000):
```bash
npm run dev:admin
```

Run Agent Mobile independently (port 3001):
```bash
npm run dev:mobile
```

Run both apps **without the backend** (development-only mock mode, sample data in the browser):
```bash
npm run dev:mock
```
See [`docs/MOCK_MODE.md`](docs/MOCK_MODE.md).

Run Typecheck and Production Builds:
```bash
npm run typecheck
npm run build
```

## Documentation
- [`docs/BACKEND_INTEGRATION.md`](docs/BACKEND_INTEGRATION.md): what the frontend expects from the backend (current)
- [`docs/MOCK_MODE.md`](docs/MOCK_MODE.md): development-only mock mode
- [`RUN_INSTRUCTIONS.md`](RUN_INSTRUCTIONS.md): setup and sign-in
- [`docs/FRONTEND_TESTING.md`](docs/FRONTEND_TESTING.md): integration test suites (need a test backend)
