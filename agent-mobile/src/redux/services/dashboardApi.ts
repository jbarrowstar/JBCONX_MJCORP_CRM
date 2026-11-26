import { unwrap } from '@shared/api/types';
import type { ApiSuccess } from '@shared/api/types';
import type {
  AgentPerformanceReport, AttendanceSummaryReport, DashboardDto, DateRangeInput, LeadFunnelReport, OnboardingProgress,
  TeamPerformanceReport, VisitSummaryReport,
} from '@shared/api/reports';
import { baseApi } from './baseApi';

const report = <T,>(path: string) => ({
  query: (params: DateRangeInput) => ({ url: `/reports/${path}`, params }),
  transformResponse: (r: ApiSuccess<T>) => unwrap(r),
  providesTags: ['Report' as const, 'Lead' as const, 'Followup' as const],
});

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query<DashboardDto, void>({
      query: () => '/dashboard',
      transformResponse: (r: ApiSuccess<DashboardDto>) => unwrap(r),
      providesTags: ['Report', 'Lead', 'Followup'],
    }),
    getTeamPerformance: build.query<TeamPerformanceReport, DateRangeInput>(report<TeamPerformanceReport>('team-performance')),
    getAgentPerformance: build.query<AgentPerformanceReport, DateRangeInput>(report<AgentPerformanceReport>('agent-performance')),
    getAttendanceSummary: build.query<AttendanceSummaryReport, DateRangeInput>(report<AttendanceSummaryReport>('attendance-summary')),
    getVisitSummary: build.query<VisitSummaryReport, DateRangeInput>(report<VisitSummaryReport>('visit-summary')),
    getOnboardingProgress: build.query<OnboardingProgress, DateRangeInput>(report<OnboardingProgress>('onboarding-progress')),
    getLeadFunnel: build.query<LeadFunnelReport, DateRangeInput>(report<LeadFunnelReport>('lead-funnel')),
  }),
});

export const {
  useGetDashboardQuery, useGetTeamPerformanceQuery, useGetAgentPerformanceQuery, useGetAttendanceSummaryQuery,
  useGetVisitSummaryQuery, useGetOnboardingProgressQuery, useGetLeadFunnelQuery,
} = dashboardApi;
