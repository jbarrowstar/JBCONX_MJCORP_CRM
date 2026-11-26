> **Current frontend ↔ backend notes:** see [`BACKEND_INTEGRATION.md`](BACKEND_INTEGRATION.md).

> **Superseded (17 Nov 2026):** this document predates the real backend. Roles are lowercase (`super_admin`, `marketing_manager`, `team_leader`, `field_agent`), IDs are `id`, paging is in `meta`, and `/agents` became `/users`. The source of truth is the backend repo's `docs/API_CONTRACT.md`. Kept for history only.

# Backend Developer Handoff Document

Dear Backend Engineer,

The JBConX frontend architecture has been structured with typed interfaces and RTK Query services. To ensure smooth integration, please adhere to the following contract standards:

1. **Envelope Format**:
```json
{
  "success": true,
  "data": {},
  "message": "Optional feedback message",
  "meta": {
    "total": 120,
    "page": 1,
    "pageSize": 20,
    "totalPages": 6
  }
}
```

2. **Error Format**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human readable explanation",
    "details": []
  }
}
```

3. **Authentication**:
- Bearer token authentication via HTTP Header: `Authorization: Bearer <JWT>`
- Roles supported in JWT payload: `'SUPER_ADMIN' | 'MARKETING_MANAGER' | 'TEAM_LEADER' | 'FIELD_AGENT'`.

