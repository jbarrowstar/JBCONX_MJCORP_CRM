import { unwrap, unwrapPaged } from '@shared/api/types';
import type { ApiSuccess, Paged } from '@shared/api/types';
import type {
  FollowUpDto, FollowUpSummary, FollowUpTypeValue, LeadActivityDto, LeadDto, LeadStatusValue, PriorityValue, PublicSettings,
} from '@shared/api/crm';
import { baseApi } from './baseApi';

export interface LeadQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string; // comma separated
  priority?: PriorityValue;
  teamId?: string;
  assignedAgentId?: string;
  unassigned?: boolean;
  leadSource?: string;
  followUp?: 'overdue' | 'today' | 'upcoming' | 'none';
  sort?: 'createdAt' | 'updatedAt' | 'customerName' | 'nextFollowUpAt' | 'leadCode';
  order?: 'asc' | 'desc';
}

export interface CreateLeadInput {
  customerName: string;
  mobileNumber: string;
  email?: string;
  address?: string;
  city: string;
  state: string;
  leadSource: string;
  interestedService: string;
  priority?: PriorityValue;
  teamId?: string;
  assignedAgentId?: string;
  remarks?: string;
  nextFollowUpAt?: string;
  allowDuplicate?: boolean;
}

export type UpdateLeadInput = Partial<{
  customerName: string;
  mobileNumber: string;
  email: string | null;
  address: string | null;
  city: string;
  state: string;
  leadSource: string;
  interestedService: string;
  priority: PriorityValue;
  remarks: string | null;
}>;

export interface FollowUpQuery {
  page?: number;
  limit?: number;
  status?: 'pending' | 'overdue' | 'completed' | 'cancelled';
  type?: FollowUpTypeValue;
  leadId?: string;
  assignedAgentId?: string;
  order?: 'asc' | 'desc';
}

export interface BulkAssignResult {
  assigned: string[];
  failed: { id: string; reason: string }[];
}

export const crmApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---- leads
    listLeads: build.query<Paged<LeadDto>, LeadQuery | void>({
      query: (params) => ({ url: '/leads', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<LeadDto[]>) => unwrapPaged(r),
      providesTags: ['Lead'],
    }),
    getLead: build.query<LeadDto, string>({
      query: (id) => `/leads/${id}`,
      transformResponse: (r: ApiSuccess<LeadDto>) => unwrap(r),
      providesTags: ['Lead'],
    }),
    createLead: build.mutation<LeadDto, CreateLeadInput>({
      query: (body) => ({ url: '/leads', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<LeadDto>) => unwrap(r),
      invalidatesTags: ['Lead', 'Followup', 'Team'],
    }),
    updateLead: build.mutation<LeadDto, { id: string; changes: UpdateLeadInput }>({
      query: ({ id, changes }) => ({ url: `/leads/${id}`, method: 'PATCH', body: changes }),
      transformResponse: (r: ApiSuccess<LeadDto>) => unwrap(r),
      invalidatesTags: ['Lead', 'Activity'],
    }),
    changeLeadStatus: build.mutation<LeadDto, { id: string; status: LeadStatusValue; remarks?: string; lostReason?: string }>({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/status`, method: 'PATCH', body }),
      transformResponse: (r: ApiSuccess<LeadDto>) => unwrap(r),
      invalidatesTags: ['Lead', 'Activity', 'Followup', 'Team'],
    }),
    assignLead: build.mutation<LeadDto, { id: string; assignedAgentId?: string | null; teamId?: string | null; remarks?: string }>({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/assign`, method: 'POST', body }),
      transformResponse: (r: ApiSuccess<LeadDto>) => unwrap(r),
      invalidatesTags: ['Lead', 'Activity', 'Followup', 'Team'],
    }),
    bulkAssignLeads: build.mutation<BulkAssignResult, { leadIds: string[]; assignedAgentId?: string | null; teamId?: string | null }>({
      query: (body) => ({ url: '/leads/bulk-assign', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<BulkAssignResult>) => unwrap(r),
      invalidatesTags: ['Lead', 'Activity', 'Followup', 'Team'],
    }),
    listLeadActivities: build.query<Paged<LeadActivityDto>, { id: string; page?: number; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `/leads/${id}/activities`, params }),
      transformResponse: (r: ApiSuccess<LeadActivityDto[]>) => unwrapPaged(r),
      providesTags: ['Activity'],
    }),
    addLeadNote: build.mutation<null, { id: string; message: string }>({
      query: ({ id, message }) => ({ url: `/leads/${id}/activities`, method: 'POST', body: { message } }),
      transformResponse: (r: ApiSuccess<null>) => unwrap(r),
      invalidatesTags: ['Activity'],
    }),

    // ---- follow-ups
    listFollowUps: build.query<Paged<FollowUpDto>, FollowUpQuery | void>({
      query: (params) => ({ url: '/followups', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<FollowUpDto[]>) => unwrapPaged(r),
      providesTags: ['Followup'],
    }),
    followUpSummary: build.query<FollowUpSummary, void>({
      query: () => '/followups/summary',
      transformResponse: (r: ApiSuccess<FollowUpSummary>) => unwrap(r),
      providesTags: ['Followup'],
    }),
    createFollowUp: build.mutation<FollowUpDto, { leadId: string; type: FollowUpTypeValue; dueAt: string; notes?: string; assignedAgentId?: string }>({
      query: (body) => ({ url: '/followups', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<FollowUpDto>) => unwrap(r),
      invalidatesTags: ['Followup', 'Lead', 'Activity'],
    }),
    updateFollowUp: build.mutation<FollowUpDto, { id: string; changes: { type?: FollowUpTypeValue; dueAt?: string; notes?: string | null } }>({
      query: ({ id, changes }) => ({ url: `/followups/${id}`, method: 'PATCH', body: changes }),
      transformResponse: (r: ApiSuccess<FollowUpDto>) => unwrap(r),
      invalidatesTags: ['Followup', 'Lead'],
    }),
    completeFollowUp: build.mutation<FollowUpDto, { id: string; outcomeNotes?: string }>({
      query: ({ id, ...body }) => ({ url: `/followups/${id}/complete`, method: 'POST', body }),
      transformResponse: (r: ApiSuccess<FollowUpDto>) => unwrap(r),
      invalidatesTags: ['Followup', 'Lead', 'Activity'],
    }),
    cancelFollowUp: build.mutation<FollowUpDto, { id: string; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/followups/${id}/cancel`, method: 'POST', body }),
      transformResponse: (r: ApiSuccess<FollowUpDto>) => unwrap(r),
      invalidatesTags: ['Followup', 'Lead', 'Activity'],
    }),

    // ---- settings (read-only subset every user may read)
    getPublicSettings: build.query<PublicSettings, void>({
      query: () => '/settings',
      transformResponse: (r: ApiSuccess<PublicSettings>) => unwrap(r),
      providesTags: ['Settings'],
    }),
  }),
});

export const {
  useListLeadsQuery, useGetLeadQuery, useCreateLeadMutation, useUpdateLeadMutation, useChangeLeadStatusMutation,
  useAssignLeadMutation, useBulkAssignLeadsMutation, useListLeadActivitiesQuery, useAddLeadNoteMutation,
  useListFollowUpsQuery, useFollowUpSummaryQuery, useCreateFollowUpMutation, useUpdateFollowUpMutation,
  useCompleteFollowUpMutation, useCancelFollowUpMutation, useGetPublicSettingsQuery,
} = crmApi;
