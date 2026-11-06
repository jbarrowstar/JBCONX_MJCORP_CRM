# JBConX Marketing CRM - Frontend Architecture

## 1. Overview
JBConX Marketing CRM is an enterprise-grade commercial system composed of two decoupled client applications sharing a common domain layer:
1. **Admin Web Portal** (`admin-web`): Comprehensive desktop SaaS dashboard for Super Admins, Marketing Managers, and Team Leaders.
2. **Field Agent Mobile Application** (`agent-mobile`): Touch-first mobile application powered by React and Capacitor for field staff.

## 2. Directory Architecture
```
jbconx-crm-frontend/
├── admin-web/              # Vite + React + TS Desktop CRM
│   ├── src/
│   │   ├── components/     # Layout, common, forms, tables, charts
│   │   ├── features/       # Modular features (leads, agents, tracking, etc.)
│   │   ├── redux/          # Store, slices, and RTK Query services
│   │   └── routes/         # React Router DOM v6 routing
├── agent-mobile/           # Vite + React + TS Mobile CRM (Capacitor ready)
│   ├── src/
│   │   ├── components/     # Mobile layouts, bottom navigation, touch controls
│   │   ├── features/       # Agent features (attendance GPS, visits camera, leads)
│   │   ├── redux/          # Independent Mobile Redux store
│   │   └── routes/         # Mobile routes
├── shared/                 # Independent shared domain contracts
│   ├── types/              # Domain models (Lead, Agent, User, Attendance, etc.)
│   ├── constants/          # Brand palettes, status configs
│   └── utils/              # Tailwind merge & date helpers
└── docs/                   # Complete architecture and integration handoff specs
```

## 3. State Management & Data Fetching
- **Redux Toolkit**: Independent stores configure client-side global state (auth sessions, UI drawers, notification badges).
- **RTK Query**: Dedicated caching and asynchronous data fetching. Server data is never duplicated into normal client slices.
- **Strict Role-Based Routing**: Authenticated role permissions enforce view segregation while respecting backend contract verification.

