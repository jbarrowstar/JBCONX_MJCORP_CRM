import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.jbconx.example.com/v1';

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AgentDashboard', 'MyLeads', 'MyAttendance', 'MyVisits', 'MyFollowups', 'MyProfile'],
  endpoints: () => ({}),
});

