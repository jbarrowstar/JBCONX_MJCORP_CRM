import { unwrap, unwrapPaged } from '@shared/api/types';
import type { ApiSuccess, Paged } from '@shared/api/types';
import type {
  AttendanceDto, AttendanceStatusValue, DocumentDto, VisitDto, VisitOutcomeValue, VisitStatusValue,
} from '@shared/api/fieldwork';
import { baseApi } from './baseApi';

export interface AttendanceQuery {
  page?: number;
  limit?: number;
  agentId?: string;
  teamId?: string;
  status?: AttendanceStatusValue;
  from?: string; // YYYY-MM-DD
  to?: string;
}

export interface VisitQuery {
  page?: number;
  limit?: number;
  agentId?: string;
  teamId?: string;
  leadId?: string;
  outcome?: VisitOutcomeValue;
  status?: VisitStatusValue;
  from?: string; // ISO
  to?: string;
}

export interface PunchInput {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  remarks?: string;
}

export interface CreateVisitInput {
  leadId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  notes: string;
  outcome: VisitOutcomeValue;
  visitedAt?: string;
  nextFollowUpAt?: string;
}

export const fieldApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // ---- attendance (management)
    listAttendance: build.query<Paged<AttendanceDto>, AttendanceQuery | void>({
      query: (params) => ({ url: '/attendance', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<AttendanceDto[]>) => unwrapPaged(r),
      providesTags: ['Attendance'],
    }),
    markAttendance: build.mutation<AttendanceDto, { agentId: string; date: string; status: AttendanceStatusValue; remarks?: string }>({
      query: (body) => ({ url: '/attendance/mark', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<AttendanceDto>) => unwrap(r),
      invalidatesTags: ['Attendance', 'Report'],
    }),
    correctAttendance: build.mutation<AttendanceDto, { id: string; checkOutAt?: string; remarks: string }>({
      query: ({ id, ...body }) => ({ url: `/attendance/${id}/correct`, method: 'PATCH', body }),
      transformResponse: (r: ApiSuccess<AttendanceDto>) => unwrap(r),
      invalidatesTags: ['Attendance', 'Report'],
    }),
    // ---- attendance (field agent)
    getTodayAttendance: build.query<AttendanceDto | null, void>({
      query: () => '/attendance/today',
      transformResponse: (r: ApiSuccess<AttendanceDto | null>) => unwrap(r),
      providesTags: ['Attendance'],
    }),
    listMyAttendance: build.query<Paged<AttendanceDto>, { page?: number; limit?: number; from?: string; to?: string } | void>({
      query: (params) => ({ url: '/attendance/me', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<AttendanceDto[]>) => unwrapPaged(r),
      providesTags: ['Attendance'],
    }),
    checkIn: build.mutation<AttendanceDto, PunchInput>({
      query: (body) => ({ url: '/attendance/check-in', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<AttendanceDto>) => unwrap(r),
      invalidatesTags: ['Attendance', 'Report'],
    }),
    checkOut: build.mutation<AttendanceDto, PunchInput>({
      query: (body) => ({ url: '/attendance/check-out', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<AttendanceDto>) => unwrap(r),
      invalidatesTags: ['Attendance', 'Report'],
    }),

    // ---- visits
    listVisits: build.query<Paged<VisitDto>, VisitQuery | void>({
      query: (params) => ({ url: '/visits', params: params ?? undefined }),
      transformResponse: (r: ApiSuccess<VisitDto[]>) => unwrapPaged(r),
      providesTags: ['Visit'],
    }),
    getVisit: build.query<VisitDto, string>({
      query: (id) => `/visits/${id}`,
      transformResponse: (r: ApiSuccess<VisitDto>) => unwrap(r),
      providesTags: ['Visit'],
    }),
    createVisit: build.mutation<VisitDto, CreateVisitInput>({
      query: (body) => ({ url: '/visits', method: 'POST', body }),
      transformResponse: (r: ApiSuccess<VisitDto>) => unwrap(r),
      invalidatesTags: ['Visit', 'Lead', 'Followup', 'Activity', 'Report'],
    }),
    updateVisit: build.mutation<VisitDto, { id: string; changes: { notes?: string; outcome?: VisitOutcomeValue; status?: VisitStatusValue } }>({
      query: ({ id, changes }) => ({ url: `/visits/${id}`, method: 'PATCH', body: changes }),
      transformResponse: (r: ApiSuccess<VisitDto>) => unwrap(r),
      invalidatesTags: ['Visit'],
    }),
    uploadVisitPhotos: build.mutation<DocumentDto[], { id: string; files: File[] }>({
      query: ({ id, files }) => {
        const body = new FormData();
        files.forEach((f) => body.append('photos', f, f.name));
        return { url: `/visits/${id}/photos`, method: 'POST', body };
      },
      transformResponse: (r: ApiSuccess<DocumentDto[]>) => unwrap(r),
      invalidatesTags: ['Visit', 'Photos'],
    }),
    listLeadDocuments: build.query<DocumentDto[], string>({
      query: (leadId) => `/leads/${leadId}/documents`,
      transformResponse: (r: ApiSuccess<DocumentDto[]>) => unwrap(r),
      providesTags: ['Photos'],
    }),
  }),
});

export const {
  useListAttendanceQuery, useMarkAttendanceMutation, useCorrectAttendanceMutation, useGetTodayAttendanceQuery,
  useListMyAttendanceQuery, useCheckInMutation, useCheckOutMutation, useListVisitsQuery, useGetVisitQuery,
  useCreateVisitMutation, useUpdateVisitMutation, useUploadVisitPhotosMutation, useListLeadDocumentsQuery,
} = fieldApi;
