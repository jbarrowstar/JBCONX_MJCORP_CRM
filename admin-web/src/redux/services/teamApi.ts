import { unwrap, unwrapPaged } from '@shared/api/types';
import type { ApiSuccess, Paged } from '@shared/api/types';
import type { User } from '@shared/types';
import { baseApi } from './baseApi';

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  leaderId: string | null;
  leader: { id: string; name: string; email: string; employeeCode?: string } | null;
  agentCount: number;
  leadCount: number;
  convertedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const teamApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listTeams: build.query<Paged<Team>, TeamQuery | void>({
      query: (params) => ({ url: '/teams', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<Team[]>) => unwrapPaged(r),
      providesTags: ['Team'],
    }),
    createTeam: build.mutation<Team, { name: string; description?: string; leaderId?: string }>({
      query: (body) => ({ url: '/teams', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<Team>) => unwrap(r),
      invalidatesTags: ['Team', 'Staff'],
    }),
    updateTeam: build.mutation<
      Team,
      { id: string; changes: { name?: string; description?: string | null; leaderId?: string | null; isActive?: boolean } }
    >({
      query: ({ id, changes }) => ({ url: `/teams/${id}`, method: 'PATCH', body: changes }),
      transformResponse: (r: ApiSuccess<Team>) => unwrap(r),
      invalidatesTags: ['Team', 'Staff'],
    }),
    deleteTeam: build.mutation<null, string>({
      query: (id) => ({ url: `/teams/${id}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<null>) => unwrap(r),
      invalidatesTags: ['Team', 'Staff'],
    }),
    listTeamMembers: build.query<User[], string>({
      query: (id) => `/teams/${id}/members`,
      transformResponse: (r: ApiSuccess<User[]>) => unwrap(r),
      providesTags: ['Staff', 'Team'],
    }),
    addTeamAgents: build.mutation<User[], { id: string; agentIds: string[] }>({
      query: ({ id, agentIds }) => ({ url: `/teams/${id}/agents`, method: 'POST', body: { agentIds } }),
      transformResponse: (r: ApiSuccess<User[]>) => unwrap(r),
      invalidatesTags: ['Team', 'Staff'],
    }),
    removeTeamAgent: build.mutation<null, { id: string; agentId: string }>({
      query: ({ id, agentId }) => ({ url: `/teams/${id}/agents/${agentId}`, method: 'DELETE' }),
      transformResponse: (r: ApiSuccess<null>) => unwrap(r),
      invalidatesTags: ['Team', 'Staff'],
    }),
  }),
});

export const {
  useListTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useListTeamMembersQuery,
  useAddTeamAgentsMutation,
  useRemoveTeamAgentMutation,
} = teamApi;
