import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery, resolveApiBaseUrl } from '@shared/api/createBaseQuery';
import { MOCK_API_ENABLED } from '@shared/mock/mockMode';
import { webTokenStorage } from '@shared/auth/tokenStorage';
import { logout } from '../slices/authSlice';

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.DEV);

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: createBaseQuery({
    baseUrl: API_BASE_URL,
    // Narrow structural type on purpose: importing RootState here would make the store type circular.
    getToken: ({ getState }) => (getState() as { auth: { token: string | null } }).auth.token,
    // DEVELOPMENT-ONLY mock API (see docs/MOCK_MODE.md). Always undefined in production builds.
    // `import.meta.env.DEV` is written out here so production builds drop this branch (and the mock chunk) entirely.
    mockTransport: import.meta.env.DEV && MOCK_API_ENABLED
      ? async (args, token) => (await import('@shared/mock/mockBackend')).mockRequest(args, token)
      : undefined,
    // The server rejected our token (expired, revoked, user deactivated): drop the session everywhere.
    onUnauthorized: (api) => {
      void webTokenStorage.clear();
      api.dispatch(logout());
      api.dispatch({ type: 'baseApi/resetApiState' });
    },
  }),
  tagTypes: ['Me', 'Staff', 'Team', 'Lead', 'Activity', 'Attendance', 'Visit', 'Photos', 'Followup', 'Report', 'Settings'],
  endpoints: () => ({}),
});
