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

## 4. Single Login Page & Role-Based Access

Anyone (Admin or Agent) goes to the **same URL (`http://localhost:3000`)** and logs in with their credentials:

### 1. Admin Login
* **Email**: `admin@jbconx.com`
* **Password**: `password123`
* **Role**: `ADMIN`
* ➔ Automatically directs to **`/admin/dashboard`** with full management controls, multi-team live GPS tracking, lead assignment, and live Google Play & Apple App Store telemetry.

### 2. Field Agent Login
* **Agent Email / ID**: `agent.miller@jbconx.com`
* **Password**: `password123`
* **Role**: `AGENT`
* ➔ Automatically directs to **`/agent/dashboard`** with the mobile & tablet field UI (GPS attendance punch in/out, site visit logging with camera photo upload, and assigned leads).

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
