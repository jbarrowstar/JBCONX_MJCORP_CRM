# JBConX CRM — Setup Guide

Three parts: **backend** (API + MongoDB), **admin web** and **agent mobile app** (both in the frontend zip).
Everything below was exercised in a Linux sandbox; Windows commands are given for PowerShell (your usual `E:\Ongoing` setup) but were **not** run on Windows.

## 0. Prerequisites

| Need | Version | Notes |
|---|---|---|
| Node.js | 20 or newer (22 tested) | `node -v` |
| npm | 10+ | ships with Node |
| MongoDB | 6+ | **Atlas** (free tier works) or local. Atlas/replica set lets you turn on transactions |
| Git | any | optional |
| Android Studio | later | only for the native mobile build (Phase 7, not done yet) |

## 1. Rotate the credentials from the original archive (do this first)

The original `src.zip` shipped a real `.env` (database user/password, JWT secret, super-admin password). Treat all of them as exposed:

1. In MongoDB Atlas create a **new database user** limited to the `jbconx_crm_db` database; delete the old one.
2. Atlas → Network Access: allow only your server/office IPs (not `0.0.0.0/0`).
3. You will generate a new JWT secret and super-admin password below.

## 2. Backend

```powershell
# unzip jbconx-crm-backend.zip, then:
cd E:\Ongoing\jbconx-crm-backend
copy .env.example .env          # macOS/Linux: cp .env.example .env
npm install
```

Edit `.env`:

| Variable | What to put |
|---|---|
| `MONGODB_URI` | your **new** connection string, database name `jbconx_crm_db` (e.g. `mongodb+srv://USER:PASS@cluster.mongodb.net/jbconx_crm_db`) |
| `MONGO_TRANSACTIONS` | `true` on Atlas / any replica set; `false` for a plain local `mongod` |
| `JWT_SECRET` | generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `1h` is the default. **Field agents will be signed out hourly**; for now set e.g. `12h` (see decision note in the progress report) |
| `CORS_ORIGINS` | leave empty in development; in production list exact origins, e.g. `https://crm.example.com,https://localhost,capacitor://localhost` |
| `SUPER_ADMIN_NAME/EMAIL/PASSWORD` | your first Super Admin (password 12+ characters) |

Create the first Super Admin, then **delete `SUPER_ADMIN_PASSWORD` from `.env`**:

```powershell
npm run create:admin
npm run dev                      # API on http://localhost:5000
```

Check it: open `http://localhost:5000/api/v1/health` → `"database":"connected"`.

Local MongoDB without Atlas (needs Docker): `docker run -d --name jbconx-mongo -p 27017:27017 mongo:7` and use
`MONGODB_URI=mongodb://127.0.0.1:27017/jbconx_crm_db` with `MONGO_TRANSACTIONS=false`.

### Production build of the backend

```powershell
npm run build
npm run db:indexes:prod         # builds indexes (autoIndex is off in production)
$env:NODE_ENV="production"; npm start
```

Put it behind HTTPS (reverse proxy / platform), set `TRUST_PROXY=true`, set `CORS_ORIGINS`, and point `UPLOAD_DIR` at a persistent, backed-up folder (documents and photos live there). Full checklist: `docs/DEPLOYMENT_GUIDE.md`.

## 3. Frontend (admin web + agent mobile)

```powershell
# unzip jbconx-crm-frontend.zip -> folder JBCONX_MJCORP_CRM
cd E:\Ongoing\JBCONX_MJCORP_CRM
npm install                      # one install at the repo root covers both apps (npm workspaces)
```

Create the two env files (each app needs to know where the API is):

```powershell
copy admin-web\.env.example admin-web\.env
copy agent-mobile\.env.example agent-mobile\.env
# both contain:  VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Run:

```powershell
npm run dev            # admin on http://localhost:3000 and mobile on http://localhost:3001
# or one at a time:  npm run dev:admin   /   npm run dev:mobile
```

Production builds: `npm run build` (outputs `admin-web/dist` and `agent-mobile/dist`). `VITE_API_BASE_URL` is read **at build time**: set it to your real HTTPS API before building (the build refuses to run without it in production).

## 4. First-run walkthrough (5 minutes)

1. Open **http://localhost:3000** and sign in as the Super Admin you created.
2. **Staff Management → Add staff member**: create a Marketing Manager, a Team Leader and a couple of Field Agents (the *Generate* button makes a policy-compliant password; share it securely).
3. **Team Management → Create team**: pick the Team Leader, then **Manage roster → Add agents**.
4. **Lead Management → New lead**: create a lead and assign it to an agent. Open it to see the timeline, change status, schedule a follow-up.
5. Open **Dashboard** and **Reports & Analytics** to see the numbers update as you work.
6. Open **http://localhost:3001** and sign in as that Field Agent: dashboard, My leads, lead details, notes, status, follow-ups, **Attendance** (check in / out) and **Visits** (record a visit with notes and a photo). Then look at **Visits & Attendance** and **Customer Visits** in the admin app.

   Browsers only allow location access on `https://` pages or `http://localhost`, and ask the user for permission. For a phone on your network use HTTPS (a deployed URL or a tunnel). The agent app on a real phone is set up properly in Phase 7.

Notes: field agents cannot sign in to the admin web and managers cannot sign in to the mobile app (by design). A user can change their own password from the key icon in the admin header; admins reset other users' passwords from Staff Management.

## 5. Tests

**Backend** (needs a MongoDB; the database name **must end in `_test`** and is wiped on every run):

```powershell
$env:TEST_MONGODB_URI="mongodb://127.0.0.1:27017/jbconx_crm_test"
npm test                          # 84 tests
```

**Frontend** (the tests create users/teams/leads in the backend they point at, so use a throw-away database):

```powershell
# 1. start a TEST backend: NODE_ENV=development, MONGODB_URI -> a disposable db,
#    RATE_LIMIT_MAX=100000, LOGIN_RATE_LIMIT_MAX=100000, MAX_FAILED_LOGINS=100, and run `npm run create:admin` on it
$env:VITE_API_BASE_URL="http://localhost:5000/api/v1"
$env:E2E_ADMIN_EMAIL="<that backend's super admin email>"
$env:E2E_ADMIN_PASSWORD="<its password>"
npm test -w admin-web             # 103 tests
npm test -w agent-mobile          # 39 tests
```

Type checks: `npm run typecheck` (frontend root) and `npm run typecheck` (backend).

## 6. Postman

Import `postman/JBConX-CRM.postman_collection.json` (backend zip). Set `baseUrl`, run **1. Auth → POST /auth/login**; it stores the token automatically.

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `Invalid environment configuration` on backend start | a required `.env` value is missing/too short (`JWT_SECRET` needs 32+ chars, `MONGODB_URI` required) |
| `/health` returns 503 | database unreachable: check the connection string, Atlas IP allow-list, user/password |
| `querySrv ECONNREFUSED` / DNS errors with `mongodb+srv` | set `MONGO_DNS_SERVERS=8.8.8.8,8.8.4.4` in `.env` |
| Browser shows a CORS error | development: use `localhost`/`127.0.0.1`; production: put the exact origin in `CORS_ORIGINS` |
| Frontend says `VITE_API_BASE_URL is not set` | create the `.env` files in step 3 (production builds need it at build time) |
| "Too many failed attempts" at login | 5 wrong passwords lock the account for 15 minutes (`MAX_FAILED_LOGINS`, `LOCKOUT_MINUTES`) |
| Signed out after an hour | token lifetime, raise `JWT_EXPIRES_IN` (or ask for refresh tokens) |
| Check-in says "Location permission was denied" | allow location for the site/app in the browser or phone settings and press **Try again**; plain `http://` pages (other than localhost) cannot use location |
| Mobile app on an Android emulator cannot reach the API | `localhost` means the emulator itself; use `http://10.0.2.2:5000/api/v1` (HTTPS required for real devices) |
| `npm install` peer-dependency noise | expected: the repo uses `legacy-peer-deps=true` |

## 8. What is and isn't finished

Working end to end: sign-in/sessions, staff, teams, leads (create, edit, assign, bulk assign, status, notes, timeline), follow-ups, dashboards and reports, attendance and customer visits (GPS + photos in the browser), on both web and mobile where relevant. **Still preview screens (sample data, labelled in the UI):** field tracking, onboarding/documents, settings. The backend for all of them already exists and is tested. **Not done:** native Android build and device permissions, native camera/GPS, offline mode (Phase 7).
