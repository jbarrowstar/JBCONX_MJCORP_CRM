import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQuery, resolveApiBaseUrl } from '@shared/api/createBaseQuery';
import { mobileTokenStorage } from '../../auth/tokenStorage';
import { logout } from '../slices/authSlice';

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL, import.meta.env.DEV);

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: createBaseQuery({
    baseUrl: API_BASE_URL,
    // Narrow structural type on purpose: importing RootState here would make the store type circular.
    getToken: ({ getState }) => (getState() as { auth: { token: string | null } }).auth.token,
    onUnauthorized: (api) => {
      void mobileTokenStorage.clear();
      api.dispatch(logout());
      api.dispatch({ type: 'baseApi/resetApiState' });
    },
  }),
  tagTypes: ['Me', 'Team', 'Lead', 'Activity', 'Followup', 'Settings', 'Report', 'Attendance', 'Visit', 'Photos', 'AgentDashboard', 'MyAttendance', 'MyVisits'],
  endpoints: () => ({}),
});
