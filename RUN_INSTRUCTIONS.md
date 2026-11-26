# JBConX Marketing CRM - Setup & Run Instructions

Welcome to **JBConX Marketing CRM**. Follow these simple instructions to run the project on your machine.

---

## Prerequisites

Before starting, ensure you have installed:
1. **Node.js** (v18 or v20+ recommended) - [Download Node.js](https://nodejs.org/)
2. **npm** (comes bundled with Node.js)

---

## 1. Extract the Project
Extract `jbconx-crm-frontend.zip` to your preferred folder (e.g., `Desktop` or `Projects`).

Open your terminal (Command Prompt, PowerShell, or Terminal) and navigate into the extracted project folder:
```bash
cd jbconx-crm-frontend
```

---

## 2. Install Dependencies
Run the installation command from the root directory:
```bash
npm install --legacy-peer-deps
```

> **Note**: All packages for both Admin and Agent portals are installed into a single centralized `node_modules` at the root!

---

## 3. Run the Unified Web Application

Run this single command:
```bash
npm run dev:admin
```
- Open your browser at: **http://localhost:3000**

---

## 4. Sign-in & Role-Based Access

There are two separate apps:

| App | URL | Who signs in | Lands on |
| --- | --- | --- | --- |
| Admin web portal | http://localhost:3000 | Super Admin (`super_admin`), Marketing Manager (`marketing_manager`), Team Leader (`team_leader`) | `/admin/dashboard` |
| Field Agent portal | http://localhost:3001 | Field Agent (`field_agent`) | `/dashboard` |

Each app rejects the other app's roles. Run both with `npm run dev`.

**With the real backend** (`VITE_API_BASE_URL`, default `http://localhost:5000/api/v1`): sign in with accounts that
exist in the backend database. The first Super Admin is created on the backend with `npm run create:admin`;
create agents from **Staff Management** in the admin portal.

**Without the backend (development-only mock mode):** run `npm run dev:mock` and sign in with:

* Admin portal: `admin@jbconx.com` / `password123` (Super Admin)
* Agent portal: `agent.miller@jbconx.com` / `password123` (Field Agent)

Mock mode uses sample data stored in your browser only (nothing is saved to MongoDB) and is removed from
production builds. See [`docs/MOCK_MODE.md`](docs/MOCK_MODE.md).

---

## 5. Tablet & Mobile Responsive View
When field agents open the website on their tablet or phone (via Google Chrome or Safari):
* The UI automatically adapts:
  * On mobile phones: Bottom navigation bar + thumb-friendly actions.
  * On tablets & laptops: Expands to full sidebar navigation.

---

## 6. Production Build
To create a production-ready build:
```bash
npm run build:admin
```
The optimized production bundle will be created in `admin-web/dist/`.
