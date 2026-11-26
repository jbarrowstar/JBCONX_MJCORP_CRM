/** Attendance and customer-visit shapes shared by the admin web and the agent mobile app. */

export const ATTENDANCE_STATUSES = ['present', 'half_day', 'absent', 'on_leave'] as const;
export type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number];
export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatusValue, string> = {
  present: 'Present', half_day: 'Half day', absent: 'Absent', on_leave: 'On leave',
};
export const ATTENDANCE_STATUS_STYLES: Record<AttendanceStatusValue, string> = {
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  half_day: 'bg-amber-50 text-amber-700 border-amber-200',
  absent: 'bg-rose-50 text-rose-700 border-rose-200',
  on_leave: 'bg-brand-50 text-brand-700 border-brand-200',
};

export const VISIT_OUTCOMES = ['interested', 'not_interested', 'follow_up_required', 'converted', 'not_available', 'other'] as const;
export type VisitOutcomeValue = (typeof VISIT_OUTCOMES)[number];
export const VISIT_OUTCOME_LABELS: Record<VisitOutcomeValue, string> = {
  interested: 'Interested', not_interested: 'Not interested', follow_up_required: 'Follow-up required',
  converted: 'Converted', not_available: 'Customer not available', other: 'Other',
};
export const VISIT_STATUSES = ['completed', 'cancelled', 'rescheduled'] as const;
export type VisitStatusValue = (typeof VISIT_STATUSES)[number];
export const VISIT_STATUS_LABELS: Record<VisitStatusValue, string> = { completed: 'Completed', cancelled: 'Cancelled', rescheduled: 'Rescheduled' };

export interface GpsPoint {
  at: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  lowAccuracy?: boolean;
  withinGeofence?: boolean | null;
  distanceMeters?: number | null;
}

export interface AttendanceDto {
  id: string;
  userId: string;
  agent: { id: string; name: string; employeeCode?: string } | null;
  teamId: string | null;
  date: string; // YYYY-MM-DD in the organisation timezone
  status: AttendanceStatusValue;
  checkIn: GpsPoint | null;
  checkOut: GpsPoint | null;
  workingMinutes: number;
  isOpen: boolean;
  remarks: string | null;
  source: 'self' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface VisitDto {
  id: string;
  leadId: string;
  lead: { id: string; leadCode: string; customerName: string; city: string } | null;
  agentId: string;
  agent: { id: string; name: string; employeeCode?: string } | null;
  teamId: string | null;
  visitedAt: string;
  location: { latitude: number; longitude: number; accuracy?: number; lowAccuracy?: boolean };
  notes: string;
  outcome: VisitOutcomeValue;
  status: VisitStatusValue;
  nextFollowUpAt: string | null;
  followUpId: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDto {
  id: string;
  leadId: string;
  visitId: string | null;
  category: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  downloadPath: string;
  createdAt: string;
}

export const formatTime = (iso?: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—';

export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

/** Link that opens a coordinate in an external map. The CRM itself never sends coordinates to a third party. */
export const mapsUrl = (lat: number, lng: number): string => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

export const formatCoords = (lat?: number, lng?: number): string =>
  lat == null || lng == null ? '—' : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

/** YYYY-MM-DD for a local calendar day (for the attendance date filters). */
export const localDayKey = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Today's calendar day (YYYY-MM-DD) in the organisation's timezone: attendance days are defined there, not by the viewer's clock. */
export const todayKeyInTz = (tz: string | undefined, now = new Date()): string => {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return localDayKey(now);
  }
};

export const addDaysToKey = (key: string, days: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
