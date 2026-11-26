/** Lead / follow-up types and display config shared by the admin web and the agent mobile app (mirrors backend docs/API_CONTRACT.md). */

export const LEAD_STATUSES = ['new', 'assigned', 'contacted', 'interested', 'meeting_scheduled', 'converted', 'lost'] as const;
export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatusValue, string> = {
  new: 'New',
  assigned: 'Assigned',
  contacted: 'Contacted',
  interested: 'Interested',
  meeting_scheduled: 'Meeting scheduled',
  converted: 'Converted',
  lost: 'Lost',
};

export const LEAD_STATUS_STYLES: Record<LeadStatusValue, string> = {
  new: 'bg-slate-100 text-slate-700 border-slate-200',
  assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  interested: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  meeting_scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  converted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const CLOSED_STATUSES: readonly LeadStatusValue[] = ['converted', 'lost'];

/** Statuses a field agent may set (the backend enforces this too). */
export const AGENT_SETTABLE_STATUSES: readonly LeadStatusValue[] = ['contacted', 'interested', 'meeting_scheduled', 'converted', 'lost'];
/** Statuses managers/leaders may set manually (`new`/`assigned` come from assignment). */
export const STAFF_SETTABLE_STATUSES: readonly LeadStatusValue[] = ['contacted', 'interested', 'meeting_scheduled', 'converted', 'lost'];

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export type PriorityValue = (typeof PRIORITIES)[number];
export const PRIORITY_LABELS: Record<PriorityValue, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
export const PRIORITY_STYLES: Record<PriorityValue, string> = {
  low: 'bg-slate-50 text-slate-500 border-slate-200',
  medium: 'bg-sky-50 text-sky-700 border-sky-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export const FOLLOWUP_TYPES = ['call', 'meeting', 'customer_visit', 'demo', 'documentation', 'other'] as const;
export type FollowUpTypeValue = (typeof FOLLOWUP_TYPES)[number];
export const FOLLOWUP_TYPE_LABELS: Record<FollowUpTypeValue, string> = {
  call: 'Call',
  meeting: 'Meeting',
  customer_visit: 'Customer visit',
  demo: 'Demo',
  documentation: 'Documentation',
  other: 'Other',
};

export type FollowUpDisplayStatus = 'pending' | 'overdue' | 'completed' | 'cancelled';

export interface Ref {
  id: string;
  name: string;
  employeeCode?: string;
  role?: string;
}

export interface LeadDto {
  id: string;
  leadCode: string;
  customerName: string;
  mobileNumber: string;
  email: string | null;
  address: string | null;
  city: string;
  state: string;
  leadSource: string;
  interestedService: string;
  status: LeadStatusValue;
  priority: PriorityValue;
  teamId: string | null;
  team: Ref | null;
  assignedAgentId: string | null;
  assignedAgent: Ref | null;
  createdBy: Ref | null;
  remarks: string | null;
  lostReason: string | null;
  nextFollowUpAt: string | null;
  isFollowUpOverdue: boolean;
  lastContactedAt: string | null;
  convertedAt: string | null;
  onboarding: { registrationStatus: string; documentStatus: string; onboardingStatus: string };
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpDto {
  id: string;
  leadId: string;
  lead: { id: string; leadCode: string; customerName: string; mobileNumber: string; status: LeadStatusValue } | null;
  type: FollowUpTypeValue;
  dueAt: string;
  status: 'pending' | 'completed' | 'cancelled';
  displayStatus: FollowUpDisplayStatus;
  isOverdue: boolean;
  notes: string | null;
  outcomeNotes: string | null;
  cancelledReason: string | null;
  completedAt: string | null;
  completedBy: Ref | null;
  assignedAgentId: string | null;
  assignedAgent: Ref | null;
  teamId: string | null;
  createdBy: Ref | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivityDto {
  id: string;
  type: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  actor: Ref | null;
  createdAt: string;
}

export interface FollowUpSummary {
  pending: number;
  overdue: number;
  dueToday: number;
  completed: number;
}

export interface PublicSettings {
  organization: { name: string };
  attendance: { timezone: string };
  operational: { agentsCanCreateLeads: boolean; requireCheckInForVisits: boolean; leadSources: string[] };
}

export const formatDateTime = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

/** <input type="datetime-local"> uses local time without a zone; the API needs a UTC ISO string. */
export const localInputToIso = (value: string): string => new Date(value).toISOString();

export const isoToLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Default value for a "schedule" input: tomorrow, 10:00 local. */
export const tomorrowTenAmLocal = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return isoToLocalInput(d.toISOString());
};

export const ACTIVITY_LABELS: Record<string, string> = {
  created: 'Lead created',
  updated: 'Details updated',
  status_change: 'Status changed',
  assignment: 'Assignment',
  note: 'Note',
  visit: 'Customer visit',
  followup_created: 'Follow-up scheduled',
  followup_completed: 'Follow-up completed',
  followup_cancelled: 'Follow-up cancelled',
  onboarding_change: 'Onboarding update',
  document: 'Document',
};
