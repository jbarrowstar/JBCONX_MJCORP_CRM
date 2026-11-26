/**
 * DEVELOPMENT-ONLY mock API switch.
 *
 * True only when BOTH hold:
 *   1. the app runs on the Vite dev server (`npm run dev`), and
 *   2. VITE_ENABLE_MOCK_AUTH=true is set (e.g. in admin-web/.env.development.local).
 *
 * `import.meta.env.DEV` is replaced with the literal `false` in every production build, so this constant is
 * `false` there and the mock backend is removed from the bundle — it cannot be switched on in production.
 */
export const MOCK_API_ENABLED: boolean = import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true';

/** Mock sign-in identities (documented in docs/MOCK_MODE.md). */
export const MOCK_CREDENTIALS = {
  admin: [
    { label: 'Super Admin', email: 'admin@jbconx.com', password: 'password123' },
    { label: 'Marketing Manager', email: 'manager@jbconx.com', password: 'password123' },
    { label: 'Team Leader', email: 'leader@jbconx.com', password: 'password123' },
  ],
  agent: [{ label: 'Field Agent', email: 'agent.miller@jbconx.com', password: 'password123' }],
} as const;
