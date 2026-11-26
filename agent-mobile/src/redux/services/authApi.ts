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
    updateOwnProfile: build.mutation<User, { name?: string; phone?: string | null }>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      transformResponse: (r: ApiSuccess<User>) => r.data,
      invalidatesTags: ['Me'],
    }),
  }),
});

export const { useLoginMutation, useGetMeQuery, useLogoutRequestMutation, useUpdateOwnProfileMutation } = authApi;
