import { unwrap, unwrapPaged } from '@shared/api/types';
import type { ApiSuccess, Paged } from '@shared/api/types';
import type { User, UserRole } from '@shared/types';
import { baseApi } from './baseApi';

export interface StaffQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  teamId?: string;
  isActive?: boolean;
  unassigned?: boolean;
  sort?: 'name' | 'email' | 'role' | 'createdAt' | 'employeeCode';
  order?: 'asc' | 'desc';
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<UserRole, 'super_admin'>;
  phone?: string;
  teamId?: string;
  joiningDate?: string;
  targetLeadsMonthly?: number;
}

export interface UpdateStaffInput {
  name?: string;
  email?: string;
  role?: Exclude<UserRole, 'super_admin'>;
  phone?: string | null;
  teamId?: string | null;
  joiningDate?: string | null;
  targetLeadsMonthly?: number | null;
}

export const staffApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listStaff: build.query<Paged<User>, StaffQuery | void>({
      query: (params) => ({ url: '/users', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<User[]>) => unwrapPaged(r),
      providesTags: ['Staff'],
    }),
    createStaff: build.mutation<User, CreateStaffInput>({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<User>) => unwrap(r),
      invalidatesTags: ['Staff', 'Team'],
    }),
    updateStaff: build.mutation<User, { id: string; changes: UpdateStaffInput }>({
      query: ({ id, changes }) => ({ url: `/users/${id}`, method: 'PATCH', body: changes }),
      transformResponse: (r: ApiSuccess<User>) => unwrap(r),
      invalidatesTags: ['Staff', 'Team'],
    }),
    setStaffStatus: build.mutation<User, { id: string; isActive: boolean }>({
      query: ({ id, isActive }) => ({ url: `/users/${id}/status`, method: 'PATCH', body: { isActive } }),
      transformResponse: (r: ApiSuccess<User>) => unwrap(r),
      invalidatesTags: ['Staff', 'Team'],
    }),
    resetStaffPassword: build.mutation<null, { id: string; newPassword: string }>({
      query: ({ id, newPassword }) => ({ url: `/users/${id}/reset-password`, method: 'POST', body: { newPassword } }),
      transformResponse: (r: ApiSuccess<null>) => unwrap(r),
    }),
  }),
});

export const {
  useListStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useSetStaffStatusMutation,
  useResetStaffPasswordMutation,
} = staffApi;
