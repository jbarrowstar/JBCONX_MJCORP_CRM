/** Dashboard and report shapes returned by the backend (see backend docs/API_CONTRACT.md). */

export interface DashboardDto {
  generatedAt: string;
  timezone: string;
  leads: {
    total: number; new: number; assigned: number; contacted: number; interested: number; meetingScheduled: number;
    converted: number; lost: number; pending: number; unassigned: number; conversionRate: number;
  };
  followUps: { pending: number; dueToday: number; overdue: number };
  visits: { today: number };
  attendanceToday: { totalAgents: number; present: number; halfDay: number; onLeave: number; absent: number; notMarked: number };
  monthlyTrend: { month: string; created: number; converted: number }[];
  sourceDistribution: { source: string; total: number; converted: number }[];
  personal?: { monthlyTarget: number | null; convertedThisMonth: number; targetProgress: number | null };
}

export interface DateRangeInput {
  from?: string;
  to?: string;
  teamId?: string;
}

export interface TeamPerformanceRow {
  teamId: string; name: string; leader: { id: string; name: string } | null; agents: number;
  totalLeads: number; openLeads: number; converted: number; conversionRate: number;
  leadsCreatedInRange: number; convertedInRange: number; visitsInRange: number; followUpsCompletedInRange: number;
}
export interface AgentPerformanceRow {
  agentId: string; name: string; employeeCode: string | null; isActive: boolean; team: { id: string; name: string } | null;
  monthlyTarget: number | null; totalLeads: number; openLeads: number; converted: number; conversionRate: number;
  convertedInRange: number; visitsInRange: number; followUpsCompletedInRange: number; attendanceDaysInRange: number;
}
export interface AttendanceSummaryRow {
  agentId: string; name: string; employeeCode: string | null; present: number; halfDay: number; absent: number; onLeave: number;
  totalWorkingMinutes: number; averageWorkingMinutes: number;
}
export interface VisitSummary {
  total: number;
  byOutcome: Record<string, number>;
  byDay: { date: string; visits: number }[];
  byAgent: { agentId: string; name: string; visits: number }[];
}
export interface OnboardingProgress {
  registration: Record<string, number>;
  documents: Record<string, number>;
  onboarding: Record<string, number>;
}
export interface LeadFunnel {
  byStatus: Record<string, number>;
  bySource: { source: string; total: number; converted: number; conversionRate: number }[];
  byPriority: Record<string, number>;
}
export interface Ranged<T> { range: { from: string; to: string }; }
export type TeamPerformanceReport = Ranged<unknown> & { teams: TeamPerformanceRow[] };
export type AgentPerformanceReport = Ranged<unknown> & { agents: AgentPerformanceRow[] };
export type AttendanceSummaryReport = Ranged<unknown> & { agents: AttendanceSummaryRow[] };
export type VisitSummaryReport = Ranged<unknown> & VisitSummary;
export type LeadFunnelReport = Ranged<unknown> & LeadFunnel;

export const RANGE_PRESETS = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '365', label: 'Last 12 months', days: 365 },
] as const;

/** Range ending now and starting at 00:00 local time `days - 1` days ago. */
export const presetRange = (days: number, now = new Date()): { from: string; to: string } => {
  const from = new Date(now);
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: now.toISOString() };
};

/** Custom range from two <input type="date"> values (local days, inclusive). */
export const customRange = (fromDay: string, toDay: string): { from: string; to: string } => {
  const from = new Date(`${fromDay}T00:00:00`);
  const to = new Date(`${toDay}T23:59:59.999`);
  return { from: from.toISOString(), to: to.toISOString() };
};

export const monthLabel = (ym: string): string => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString(undefined, { month: 'short', year: '2-digit' });
};

export const hours = (minutes: number): string => (minutes / 60).toFixed(1);
