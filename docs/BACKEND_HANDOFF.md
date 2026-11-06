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

