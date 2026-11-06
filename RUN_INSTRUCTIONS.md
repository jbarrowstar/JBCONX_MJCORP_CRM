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
npm install
```
*(If npm reports peer dependency warnings on older node versions, run: `npm install --legacy-peer-deps`)*

---

## 3. Run the Applications

### Option A: Run Both Apps Together (Recommended)
To launch both the **Admin Web Portal** and the **Field Agent Portal** simultaneously with one command:
```bash
npm run dev
```

---

### Option B: Run Apps Individually

#### To run the Admin Web Portal:
```bash
npm run dev:admin
```
- Open your browser at: **http://localhost:3000**
- Pre-filled credentials: `admin@jbconx.com` / `password123`

#### To run the Field Agent Portal (Mobile / Tablet / Laptop):
```bash
npm run dev:mobile
```
- Open your browser at: **http://localhost:3001**
- Pre-filled credentials: `AGT-101` / `password123`

---

## 4. Other Available Scripts

- **Typecheck**: `npm run typecheck` (verifies TypeScript strict types across all modules)
- **Production Build**: `npm run build` (builds production bundles for both apps)
- **Preview Production**:
  - `npm run preview:admin` (preview Admin on port 3000)
  - `npm run preview:mobile` (preview Agent app on port 3001)

---

## 5. Key Highlights for Your Demo

1. **Admin Portal (Port 3000)**:
   - Live Store Telemetry card tracking the verified Play Store app (`com.jbconx.mobile`) and App Store app (`id6761180171`).
   - 3-Theme Switcher in the top header (*Sapphire Executive*, *Emerald Wealth*, *Royal Obsidian*).
   - Full Lead Management with search, lifecycle status filtering, lead inspect drawer, and lead creation form.
   - Field GPS Telemetry map simulation, shift attendance logs, and reports.

2. **Agent Portal (Port 3001)**:
   - Responsive across Phone, Tablet, and Desktop/Laptop displays.
   - Interactive GPS punch-in / punch-out shift attendance.
   - Customer meeting visit recorder with photo capture simulation.
   - Prospect lead registration with mobile phone dialing.
