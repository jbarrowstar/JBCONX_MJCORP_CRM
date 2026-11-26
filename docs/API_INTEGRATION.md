> **Superseded (17 Nov 2026):** this document predates the real backend. Roles are lowercase (`super_admin`, `marketing_manager`, `team_leader`, `field_agent`), IDs are `id`, paging is in `meta`, and `/agents` became `/users`. The source of truth is the backend repo's `docs/API_CONTRACT.md`. Kept for history only.

# JBConX Marketing CRM - API Integration Specification

This document details the HTTP and WebSocket API contracts required by the frontend from the independently developed backend.

## Environment Variables
- `VITE_API_BASE_URL`: Base REST API endpoint (e.g., `https://api.jbconx.com/v1`)
- `VITE_GOOGLE_MAPS_API_KEY`: API Key for Google Maps SDK tracking

## Module Endpoints

### 1. Authentication
- `POST /auth/login`
  - Body: `{ email: string, password: string }`
  - Response: `{ success: boolean, data: { user: User, token: string } }`
- `POST /auth/logout`

### 2. Leads Management
- `GET /leads`
  - Query Params: `search`, `status`, `assignedAgentId`, `teamId`, `page`, `pageSize`
- `POST /leads`
  - Body: `CreateLeadPayload`
- `GET /leads/:id`
- `PATCH /leads/:id`
- `POST /leads/:id/assign`
  - Body: `{ agentId: string }`

### 3. Agent & Squad Management
- `GET /agents`
- `GET /agents/:id`
- `GET /teams`
- `POST /teams`

### 4. Field Tracking & Attendance
- `GET /tracking/live`
- `POST /attendance/check-in`
  - Body: `{ lat: number, lng: number, timestamp: string }`
- `POST /attendance/check-out`
  - Body: `{ lat: number, lng: number, timestamp: string }`

### 5. Customer Visits
- `GET /visits`
- `POST /visits`
  - Multipart/FormData: `leadId`, `remarks`, `lat`, `lng`, `photos`

### 6. Follow-ups & Tasks
- `GET /followups`
- `POST /followups`
- `PATCH /followups/:id/status`

### 7. Registration & Onboarding
- `GET /onboarding`
- `PATCH /onboarding/:id/kyc`

