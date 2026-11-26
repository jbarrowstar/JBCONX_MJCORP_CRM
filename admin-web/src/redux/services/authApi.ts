import type { ApiSuccess } from '@shared/api/types';
import type { User } from '@shared/types';
import { baseApi } from './baseApi';

export interface LoginResult {
  token: string;
  user: User;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<LoginResult, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<LoginResult>) => r.data,
    }),
    getMe: build.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (r: ApiSuccess<User>) => r.data,
      providesTags: ['Me'],
    }),
    logoutRequest: build.mutation<null, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      transformResponse: (r: ApiSuccess<null>) => r.data,
    }),
    changePassword: build.mutation<{ token: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: '/auth/change-password', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<{ token: string }>) => r.data,
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery, useLogoutRequestMutation, useChangePasswordMutation } = authApi;
