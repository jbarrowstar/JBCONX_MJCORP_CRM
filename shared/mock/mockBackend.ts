/**
 * DEVELOPMENT-ONLY mock backend for UI testing without the CRM API.
 *
 * - Loaded only when the app runs in Vite dev mode AND VITE_ENABLE_MOCK_AUTH=true (see shared/mock/mockMode.ts).
 *   Production builds never include or load this file.
 * - Answers the same endpoints, wire format ({ success, data, message, meta }) and error codes the real
 *   backend uses, so screens behave as they will against the real API.
 * - Data lives in the browser (localStorage, per app/origin). NOTHING is sent to the server or saved to MongoDB.
 */
import type { FetchArgs } from '@reduxjs/toolkit/query';
import type { User, UserRole } from '../types';
import type {
  FollowUpDto, FollowUpTypeValue, LeadActivityDto, LeadDto, LeadStatusValue, PriorityValue, PublicSettings,
} from '../api/crm';
import type { AttendanceDto, AttendanceStatusValue, DocumentDto, VisitDto, VisitOutcomeValue, VisitStatusValue } from '../api/fieldwork';

/* ───────────────────────── types ───────────────────────── */

interface TeamRecord {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  leaderId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityRecord {
  id: string;
  leadId: string;
  type: string;
  message: string | null;
  actorId: string | null;
  createdAt: string;
}

interface FollowUpRecord {
  id: string;
  leadId: string;
  type: FollowUpTypeValue;
  dueAt: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  outcomeNotes: string | null;
  cancelledReason: string | null;
  completedAt: string | null;
  completedById: string | null;
  assignedAgentId: string | null;
  teamId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

type LeadRecord = Omit<LeadDto, 'team' | 'assignedAgent' | 'createdBy' | 'nextFollowUpAt' | 'isFollowUpOverdue'> & { createdById: string | null };
type AttendanceRecord = Omit<AttendanceDto, 'agent'>;
type VisitRecord = Omit<VisitDto, 'lead' | 'agent' | 'photoCount'>;

interface MockDb {
  version: number;
  seq: number;
  users: User[];
  passwords: Record<string, string>;
  teams: TeamRecord[];
  leads: LeadRecord[];
  activities: ActivityRecord[];
  followUps: FollowUpRecord[];
  attendance: AttendanceRecord[];
  visits: VisitRecord[];
  documents: DocumentDto[];
  sessions: Record<string, string>; // token -> userId
}

type Result = { data: unknown } | { error: { status: number; data: unknown } };

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details: { path?: string; message: string }[] = []) {
    super(message);
  }
}

/* ───────────────────────── helpers ───────────────────────── */

const DB_VERSION = 1;
const STORAGE_KEY = 'jbconx.mock.db.v1';
const TZ = 'Asia/Kolkata';
const CLOSED: LeadStatusValue[] = ['converted', 'lost'];
const MGMT: UserRole[] = ['super_admin', 'marketing_manager'];

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, hour = 10, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d;
};
/** YYYY-MM-DD in the organisation timezone. */
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const monthKey = (d: Date) => dayKey(d).slice(0, 7);
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];

const nextId = (db: MockDb, prefix: string) => `${prefix}_${(++db.seq).toString(36)}`;

const fail = (status: number, code: string, message: string, details: { path?: string; message: string }[] = []): never => {
  throw new HttpError(status, code, message, details);
};
const required = (body: Record<string, unknown>, fields: [string, string][]) => {
  const details = fields.filter(([k]) => body[k] == null || String(body[k]).trim() === '').map(([path, message]) => ({ path, message }));
  if (details.length) fail(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', details);
};

/* ───────────────────────── seed data ───────────────────────── */

const seed = (): MockDb => {
  const now = new Date();
  const db: MockDb = { version: DB_VERSION, seq: 1000, users: [], passwords: {}, teams: [], leads: [], activities: [], followUps: [], attendance: [], visits: [], documents: [], sessions: {} };

  const team = (id: string, name: string, description: string | null, leaderId: string | null, isActive = true, created = 120): TeamRecord => ({
    id, name, description, isActive, leaderId, createdAt: iso(daysAgo(created)), updatedAt: iso(daysAgo(3)),
  });
  db.teams = [
    team('team_alpha', 'Alpha', 'Bengaluru south & central residential accounts', 'usr_tl1'),
    team('team_north', 'Bengaluru North', 'Commercial and industrial accounts', 'usr_tl2'),
    team('team_coastal', 'Chennai Coastal', null, null, false, 20),
  ];

  const user = (id: string, name: string, email: string, role: UserRole, teamId: string | null, code: string, extra: Partial<User> = {}): User => {
    const t = db.teams.find((x) => x.id === teamId);
    return {
      id, name, email, role, teamId, team: t ? { id: t.id, name: t.name } : null, employeeCode: code,
      phone: `+91 98${String(Math.abs(hash(email)) % 100000000).padStart(8, '0')}`.replace(/(\+91 \d{5})(\d{5})/, '$1 $2'),
      isActive: true, joiningDate: iso(daysAgo(180)), targetLeadsMonthly: role === 'field_agent' ? 10 : null,
      lastLoginAt: iso(daysAgo(1, 9)), createdAt: iso(daysAgo(200)), updatedAt: iso(daysAgo(2)), ...extra,
    };
  };
  db.users = [
    user('usr_admin', 'JBConX Administrator', 'admin@jbconx.com', 'super_admin', null, 'ADM-0001', { joiningDate: null }),
    user('usr_mm1', 'Sneha Reddy', 'manager@jbconx.com', 'marketing_manager', null, 'MM-0001'),
    user('usr_tl1', 'Anita Desai', 'leader@jbconx.com', 'team_leader', 'team_alpha', 'TL-0001'),
    user('usr_tl2', 'Mohammed Irfan', 'irfan@jbconx.com', 'team_leader', 'team_north', 'TL-0002'),
    user('usr_agent', 'David Miller', 'agent.miller@jbconx.com', 'field_agent', 'team_alpha', 'AGT-0003'),
    user('usr_a2', 'Priya Sharma', 'priya@jbconx.com', 'field_agent', 'team_alpha', 'AGT-0004', { targetLeadsMonthly: 12 }),
    user('usr_a3', 'Ravi Kumar', 'ravi@jbconx.com', 'field_agent', 'team_north', 'AGT-0005', { targetLeadsMonthly: 12 }),
    user('usr_a4', 'Karthik Rao', 'karthik@jbconx.com', 'field_agent', 'team_north', 'AGT-0006', { lastLoginAt: null }),
    user('usr_a5', 'Lakshmi Iyer', 'lakshmi@jbconx.com', 'field_agent', 'team_alpha', 'AGT-0007', { targetLeadsMonthly: null }),
    user('usr_a6', 'Arjun Nair', 'arjun@jbconx.com', 'field_agent', null, 'AGT-0008', { isActive: false }),
  ];
  db.users.forEach((u) => (db.passwords[u.id] = 'password123'));

  const agents = ['usr_agent', 'usr_a2', 'usr_a3', 'usr_a4', 'usr_a5'];
  const customers = [
    ['Lakshmi Textiles', 'Bengaluru', 'Karnataka'], ['Sri Sai Traders', 'Chennai', 'Tamil Nadu'], ['Ganesh Hardware', 'Mysuru', 'Karnataka'],
    ['Meena Iyer', 'Hyderabad', 'Telangana'], ['Coastal Agro Exports', 'Mangaluru', 'Karnataka'], ['Venkat Rao', 'Vijayawada', 'Andhra Pradesh'],
    ['Green Leaf Resorts', 'Coorg', 'Karnataka'], ['Patel Cold Storage', 'Hubballi', 'Karnataka'], ['Sunrise Apartments RWA', 'Bengaluru', 'Karnataka'],
    ['Anand Rice Mill', 'Kurnool', 'Andhra Pradesh'], ['Deccan Motors', 'Hyderabad', 'Telangana'], ['Kaveri School', 'Mandya', 'Karnataka'],
    ['Royal Bakers', 'Tirupati', 'Andhra Pradesh'], ['Shree Ganesh Temple Trust', 'Udupi', 'Karnataka'], ['Nandi Dairy', 'Tumakuru', 'Karnataka'],
    ['Blue Ocean Fisheries', 'Kochi', 'Kerala'], ['Fatima Hospital', 'Mangaluru', 'Karnataka'], ['Kumar Poultry Farm', 'Hosur', 'Tamil Nadu'],
    ['Silicon Heights', 'Bengaluru', 'Karnataka'], ['Ramesh Kirana', 'Chittoor', 'Andhra Pradesh'], ['Vijaya Textiles', 'Salem', 'Tamil Nadu'],
    ['Metro Gym', 'Bengaluru', 'Karnataka'], ['Annapurna Hotel', 'Kuppam', 'Andhra Pradesh'], ['Orchid Villas', 'Mysuru', 'Karnataka'],
    ['Star Printing Press', 'Hyderabad', 'Telangana'], ['Gokul Sweets', 'Bengaluru', 'Karnataka'], ['Coimbatore Pumps', 'Coimbatore', 'Tamil Nadu'],
    ['Lotus Clinic', 'Chennai', 'Tamil Nadu'], ['Harsha Constructions', 'Bengaluru', 'Karnataka'], ['Sai Krupa Lodge', 'Hampi', 'Karnataka'],
    ['Tech Park Canteen', 'Bengaluru', 'Karnataka'], ['Shanti Nursing Home', 'Davanagere', 'Karnataka'],
  ];
  const services = ['Solar rooftop 5 kW', 'Commercial solar 20 kW', 'Battery backup', 'Solar water heater', 'Inverter AMC', 'Solar pumps', 'Home solar 3 kW', 'EV charger install'];
  const sources = ['Referral', 'Field Visit', 'Cold Call', 'Website', 'Exhibition', 'Walk-in'];
  const statuses: LeadStatusValue[] = ['new', 'assigned', 'contacted', 'interested', 'meeting_scheduled', 'converted', 'lost', 'interested', 'contacted', 'converted', 'assigned'];
  const priorities: PriorityValue[] = ['medium', 'high', 'low', 'urgent', 'medium', 'high'];

  customers.forEach(([customerName, city, state], i) => {
    const status = pick(statuses, i);
    const agentId = status === 'new' ? null : pick(agents, i);
    const agent = db.users.find((u) => u.id === agentId);
    const created = daysAgo((i * 5) % 170 + 1, 9 + (i % 8), (i * 7) % 60);
    const lead: LeadRecord = {
      id: `lead_${i + 1}`,
      leadCode: `LD-${String(100231 + i).padStart(6, '0')}`,
      customerName,
      mobileNumber: `9${String(800000000 + i * 137531).slice(0, 9)}`,
      email: i % 3 === 0 ? null : `${customerName.split(' ')[0].toLowerCase()}@example.com`,
      address: `${12 + i}, ${pick(['MG Road', 'Station Road', 'Market Street', '4th Cross', 'Ring Road'], i)}`,
      city, state,
      leadSource: pick(sources, i),
      interestedService: pick(services, i),
      status,
      priority: pick(priorities, i),
      teamId: agent?.teamId ?? (i % 2 ? 'team_north' : 'team_alpha'),
      assignedAgentId: agentId,
      createdById: i % 4 === 0 ? agentId ?? 'usr_admin' : 'usr_admin',
      remarks: i % 5 === 0 ? 'Customer prefers a call after 5 PM.' : null,
      lostReason: status === 'lost' ? 'Chose a cheaper competitor' : null,
      lastContactedAt: ['new', 'assigned'].includes(status) ? null : iso(daysAgo(i % 9, 15)),
      convertedAt: status === 'converted' ? iso(new Date(created.getTime() + 12 * 86400000)) : null,
      onboarding: {
        registrationStatus: status === 'converted' ? pick(['completed', 'pending'], i) : 'not_started',
        documentStatus: status === 'converted' ? pick(['verified', 'pending', 'not_requested'], i) : 'not_requested',
        onboardingStatus: status === 'converted' ? pick(['in_progress', 'completed', 'not_started'], i) : 'not_started',
      },
      createdAt: iso(created),
      updatedAt: iso(daysAgo(i % 6, 12)),
    };
    db.leads.push(lead);
    db.activities.push({ id: `act_${i}_c`, leadId: lead.id, type: 'created', message: null, actorId: lead.createdById, createdAt: lead.createdAt });
    if (agentId) db.activities.push({ id: `act_${i}_a`, leadId: lead.id, type: 'assignment', message: `Assigned to ${agent?.name}`, actorId: 'usr_admin', createdAt: iso(new Date(created.getTime() + 3600000)) });
    if (!['new', 'assigned'].includes(status)) db.activities.push({ id: `act_${i}_s`, leadId: lead.id, type: 'status_change', message: `Status changed to ${status.replace('_', ' ')}`, actorId: agentId, createdAt: lead.updatedAt });
    if (i % 4 === 1) db.activities.push({ id: `act_${i}_n`, leadId: lead.id, type: 'note', message: 'Customer asked for EMI options and a site survey.', actorId: agentId, createdAt: iso(daysAgo(i % 5, 17)) });

    // Follow-ups for open, assigned leads
    if (agentId && !CLOSED.includes(status)) {
      const offsetHours = [-30, -5, 3, 26, 50, 75][i % 6];
      db.followUps.push({
        id: `fu_${i + 1}`, leadId: lead.id, type: pick<FollowUpTypeValue>(['call', 'meeting', 'customer_visit', 'demo'], i),
        dueAt: iso(new Date(now.getTime() + offsetHours * 3600000)), status: 'pending',
        notes: pick(['Confirm roof measurements', 'Share quotation PDF', 'Site survey with engineer', 'Bring battery brochure', null], i),
        outcomeNotes: null, cancelledReason: null, completedAt: null, completedById: null,
        assignedAgentId: agentId, teamId: lead.teamId, createdById: 'usr_admin', createdAt: iso(daysAgo(3)), updatedAt: iso(daysAgo(1)),
      });
    }
    if (agentId && i % 3 === 0) {
      db.followUps.push({
        id: `fu_${i + 1}_done`, leadId: lead.id, type: 'call', dueAt: iso(daysAgo(6 + (i % 10), 11)), status: 'completed',
        notes: 'Introductory call', outcomeNotes: 'Interested, requested a quotation', cancelledReason: null,
        completedAt: iso(daysAgo(6 + (i % 10), 12)), completedById: agentId, assignedAgentId: agentId, teamId: lead.teamId,
        createdById: 'usr_admin', createdAt: iso(daysAgo(20)), updatedAt: iso(daysAgo(6)),
      });
    }
  });

  // Attendance: last 14 days for active agents (today: some still checked in)
  const activeAgents = db.users.filter((u) => u.role === 'field_agent' && u.isActive);
  for (let d = 13; d >= 0; d--) {
    activeAgents.forEach((a, ai) => {
      const date = daysAgo(d);
      if (date.getDay() === 0) return; // Sundays off
      if (d === 0 && ai === activeAgents.length - 1) return; // one agent not marked yet today
      const roll = (d * 7 + ai * 3) % 17;
      const status: AttendanceStatusValue = roll === 4 ? 'on_leave' : roll === 9 ? 'absent' : roll === 13 ? 'half_day' : 'present';
      const checkIn = status === 'present' || status === 'half_day' ? daysAgo(d, 9, 5 + ((ai * 11) % 40)) : null;
      const open = d === 0 && checkIn != null && ai !== 1;
      const checkOut = checkIn && !open ? new Date(checkIn.getTime() + (status === 'half_day' ? 4.2 : 8.4 + (ai % 3) * 0.3) * 3600000) : null;
      const gps = (at: Date | null, drift = 0) => (at ? { at: iso(at), latitude: 12.9716 + drift, longitude: 77.5946 - drift, accuracy: 12 + ai * 4, lowAccuracy: ai === 3, withinGeofence: roll !== 2, distanceMeters: roll === 2 ? 640 : null } : null);
      db.attendance.push({
        id: `att_${d}_${a.id}`, userId: a.id, teamId: a.teamId, date: dayKey(date), status,
        checkIn: gps(checkIn), checkOut: gps(checkOut, 0.004), workingMinutes: checkIn && checkOut ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) : 0,
        isOpen: open, remarks: status === 'on_leave' ? 'Approved leave' : status === 'absent' ? 'No show' : null,
        source: status === 'on_leave' || status === 'absent' ? 'admin' : 'self', createdAt: iso(date), updatedAt: iso(date),
      });
    });
  }

  // Visits: last ~30 days
  const outcomes: VisitOutcomeValue[] = ['interested', 'follow_up_required', 'converted', 'not_interested', 'not_available', 'interested'];
  const notes = ['Met the owner, showed the brochure and rooftop layout.', 'Engineer needs a second survey for the shed roof.', 'Signed the agreement; documents to follow.', 'Not interested this year, revisit after monsoon.', 'Shop closed; neighbour says back on Monday.', 'Discussed financing options with the family.'];
  db.leads.filter((l) => l.assignedAgentId).forEach((l, i) => {
    const count = 1 + (i % 2);
    for (let k = 0; k < count; k++) {
      const when = daysAgo((i * 3 + k * 4) % 29, 11 + ((i + k) % 6), (i * 13) % 60);
      db.visits.push({
        id: `vis_${i}_${k}`, leadId: l.id, agentId: l.assignedAgentId!, teamId: l.teamId, visitedAt: iso(when),
        location: { latitude: 12.95 + (i % 9) / 100, longitude: 77.58 + (k % 5) / 100, accuracy: 15 },
        notes: pick(notes, i + k), outcome: pick(outcomes, i + k), status: (i + k) % 9 === 4 ? 'rescheduled' : 'completed',
        nextFollowUpAt: null, followUpId: null, createdAt: iso(when), updatedAt: iso(when),
      });
    }
  });
  return db;
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/* ───────────────────────── persistence ───────────────────────── */

let db: MockDb | null = null;
const photoUrls = new Map<string, string>(); // in-memory object URLs for photos uploaded this session

const load = (): MockDb => {
  if (db) return db;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed.version === DB_VERSION) return (db = parsed);
    }
  } catch {
    /* corrupt or unavailable storage: start fresh */
  }
  db = seed();
  save();
  return db;
};

const save = () => {
  try {
    if (db) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* storage full / unavailable: keep working in memory */
  }
};

/** Wipe all mock data and start again from the seed. */
export const resetMockData = (): void => {
  db = seed();
  save();
};

/** Object URL for a photo uploaded in mock mode this session (photos are not persisted). */
export const getMockPhotoUrl = (path: string): string | null => photoUrls.get(path) ?? null;

/* ───────────────────────── DTO mapping ───────────────────────── */

const ref = (u: User | undefined | null) => (u ? { id: u.id, name: u.name } : null);
const userById = (id: string | null | undefined) => (id ? load().users.find((u) => u.id === id) ?? null : null);
const teamRef = (id: string | null | undefined) => {
  const t = id ? load().teams.find((x) => x.id === id) : null;
  return t ? { id: t.id, name: t.name } : null;
};
const withTeam = (u: User): User => ({ ...u, team: teamRef(u.teamId) });

const pendingFollowUps = (leadId: string) =>
  load().followUps.filter((f) => f.leadId === leadId && f.status === 'pending').sort((a, b) => a.dueAt.localeCompare(b.dueAt));

const leadDto = (l: LeadRecord): LeadDto => {
  const next = pendingFollowUps(l.id)[0];
  return {
    ...l,
    team: teamRef(l.teamId),
    assignedAgent: ref(userById(l.assignedAgentId)),
    createdBy: ref(userById(l.createdById)),
    nextFollowUpAt: next?.dueAt ?? null,
    isFollowUpOverdue: !!next && new Date(next.dueAt) < new Date(),
  };
};

const followUpDto = (f: FollowUpRecord): FollowUpDto => {
  const l = load().leads.find((x) => x.id === f.leadId);
  const overdue = f.status === 'pending' && new Date(f.dueAt) < new Date();
  return {
    ...f,
    lead: l ? { id: l.id, leadCode: l.leadCode, customerName: l.customerName, mobileNumber: l.mobileNumber, status: l.status } : null,
    displayStatus: f.status === 'pending' ? (overdue ? 'overdue' : 'pending') : f.status,
    isOverdue: overdue,
    completedBy: ref(userById(f.completedById)),
    assignedAgent: ref(userById(f.assignedAgentId)),
    createdBy: ref(userById(f.createdById)),
  } as FollowUpDto;
};

const attendanceDto = (a: AttendanceRecord): AttendanceDto => {
  const u = userById(a.userId);
  return { ...a, agent: u ? { id: u.id, name: u.name, employeeCode: u.employeeCode } : null };
};

const visitDto = (v: VisitRecord): VisitDto => {
  const l = load().leads.find((x) => x.id === v.leadId);
  const u = userById(v.agentId);
  return {
    ...v,
    lead: l ? { id: l.id, leadCode: l.leadCode, customerName: l.customerName, city: l.city } : null,
    agent: u ? { id: u.id, name: u.name, employeeCode: u.employeeCode } : null,
    photoCount: load().documents.filter((d) => d.visitId === v.id).length,
  };
};

const teamDto = (t: TeamRecord) => {
  const d = load();
  const leader = userById(t.leaderId);
  const leads = d.leads.filter((l) => l.teamId === t.id);
  return {
    ...t,
    leader: leader ? { id: leader.id, name: leader.name, email: leader.email, employeeCode: leader.employeeCode } : null,
    agentCount: d.users.filter((u) => u.role === 'field_agent' && u.teamId === t.id && u.isActive).length,
    leadCount: leads.length,
    convertedCount: leads.filter((l) => l.status === 'converted').length,
  };
};

const activityDto = (a: ActivityRecord): LeadActivityDto => ({ id: a.id, type: a.type, message: a.message, metadata: null, actor: ref(userById(a.actorId)), createdAt: a.createdAt });

/* ───────────────────────── scope & permissions ───────────────────────── */

const isMgmt = (u: User) => MGMT.includes(u.role);
const requireRoles = (u: User, roles: UserRole[]) => {
  if (!roles.includes(u.role)) fail(403, 'PERMISSION_DENIED', 'You do not have permission to do that.');
};
const leadInScope = (u: User, l: LeadRecord) =>
  isMgmt(u) || (u.role === 'team_leader' ? !!u.teamId && l.teamId === u.teamId : l.assignedAgentId === u.id);
const userInScope = (u: User, target: User) =>
  isMgmt(u) ? u.role === 'super_admin' || target.role !== 'super_admin' : u.role === 'team_leader' ? target.teamId === u.teamId : target.id === u.id;
const agentInScope = (u: User, agentId: string, teamId: string | null) =>
  isMgmt(u) || (u.role === 'team_leader' ? teamId === u.teamId : agentId === u.id);

const findLead = (u: User, id: string) => {
  const l = load().leads.find((x) => x.id === id);
  if (!l || !leadInScope(u, l)) fail(404, 'NOT_FOUND', 'Lead not found.');
  return l!;
};

const addActivity = (leadId: string, type: string, message: string | null, actorId: string | null) => {
  const d = load();
  d.activities.push({ id: nextId(d, 'act'), leadId, type, message, actorId, createdAt: iso(new Date()) });
};

/* ───────────────────────── query helpers ───────────────────────── */

type Params = Record<string, string | undefined>;

const paginate = <T,>(items: T[], p: Params, defaultLimit = 20) => {
  const page = Math.max(1, Number(p.page ?? 1));
  const limit = Math.max(1, Math.min(200, Number(p.limit ?? defaultLimit)));
  const total = items.length;
  return { data: items.slice((page - 1) * limit, page * limit), meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

const inRange = (isoDate: string, p: Params) => (!p.from || isoDate >= p.from) && (!p.to || isoDate <= p.to);
const textMatch = (q: string | undefined, ...fields: (string | null | undefined)[]) =>
  !q || fields.some((f) => (f ?? '').toLowerCase().includes(q.toLowerCase()));

/* ───────────────────────── handlers ───────────────────────── */

const ok = (data: unknown, meta: Record<string, unknown> = {}, message = 'OK') => ({ success: true, data, message, meta });

const authUser = (token: string | null): User => {
  const d = load();
  const id = token ? d.sessions[token] : undefined;
  const u = id ? userById(id) : null;
  if (!token) fail(401, 'AUTH_REQUIRED', 'Please sign in.');
  if (!u || !u.isActive) fail(401, 'AUTH_INVALID_TOKEN', 'Your session has ended. Please sign in again.');
  return withTeam(u!);
};

const login = (body: Record<string, unknown>) => {
  const d = load();
  const email = String(body.email ?? '').trim().toLowerCase();
  const u = d.users.find((x) => x.email.toLowerCase() === email);
  if (!u || d.passwords[u.id] !== body.password) fail(401, 'AUTH_INVALID_CREDENTIALS', 'Incorrect email or password.');
  if (!u!.isActive) fail(403, 'ACCOUNT_DISABLED', 'This account has been deactivated. Contact your administrator.');
  const token = `mock.${u!.id}.${Date.now().toString(36)}`;
  d.sessions[token] = u!.id;
  u!.lastLoginAt = iso(new Date());
  return ok({ token, user: withTeam(u!) }, {}, 'Signed in (mock)');
};

const validatePassword = (pw: unknown, path: string) => {
  const s = String(pw ?? '');
  if (s.length < 10 || !/[a-z]/i.test(s) || !/\d/.test(s)) fail(400, 'VALIDATION_ERROR', 'Password is too weak.', [{ path, message: 'At least 10 characters with a letter and a digit' }]);
};

const codePrefix: Record<UserRole, string> = { super_admin: 'ADM', marketing_manager: 'MM', team_leader: 'TL', field_agent: 'AGT' };

const handleUsers = (me: User, method: string, parts: string[], p: Params, body: Record<string, unknown>) => {
  const d = load();
  if (parts.length === 1 && method === 'GET') {
    requireRoles(me, ['super_admin', 'marketing_manager', 'team_leader']);
    let list = d.users.filter((u) => userInScope(me, u));
    if (p.role) list = list.filter((u) => u.role === p.role);
    if (p.teamId) list = list.filter((u) => u.teamId === p.teamId);
    if (p.isActive != null) list = list.filter((u) => String(u.isActive) === p.isActive);
    if (p.unassigned === 'true') list = list.filter((u) => !u.teamId);
    list = list.filter((u) => textMatch(p.search, u.name, u.email, u.employeeCode, u.phone));
    const key = (p.sort ?? 'name') as keyof User;
    list = [...list].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')) * (p.order === 'desc' ? -1 : 1));
    const pg = paginate(list.map(withTeam), p);
    return ok(pg.data, pg.meta);
  }
  if (parts.length === 1 && method === 'POST') {
    requireRoles(me, ['super_admin', 'marketing_manager']);
    required(body, [['name', 'Enter the full name'], ['email', 'Enter an email'], ['role', 'Choose a role']]);
    const role = body.role as UserRole;
    if (me.role === 'marketing_manager' && !['team_leader', 'field_agent'].includes(role)) fail(403, 'PERMISSION_DENIED', 'You cannot create that role.');
    validatePassword(body.password, 'password');
    const email = String(body.email).trim().toLowerCase();
    if (d.users.some((u) => u.email.toLowerCase() === email)) fail(409, 'CONFLICT', 'An account with this email already exists.', [{ path: 'email', message: 'Email already in use' }]);
    const n = d.users.filter((u) => u.role === role).length + 1;
    const u: User = {
      id: nextId(d, 'usr'), name: String(body.name).trim(), email, role, phone: (body.phone as string) || null,
      employeeCode: `${codePrefix[role]}-${String(n + (role === 'field_agent' ? 2 : 0)).padStart(4, '0')}`,
      teamId: (body.teamId as string) || null, team: null, isActive: true, joiningDate: (body.joiningDate as string) || null,
      targetLeadsMonthly: body.targetLeadsMonthly != null ? Number(body.targetLeadsMonthly) : null, lastLoginAt: null,
      createdAt: iso(new Date()), updatedAt: iso(new Date()),
    };
    d.users.push(u);
    d.passwords[u.id] = String(body.password);
    return ok(withTeam(u), {}, 'Staff member created (mock)');
  }
  if (parts[1] === 'me' && method === 'PATCH') {
    const u = d.users.find((x) => x.id === me.id)!;
    if (body.name != null) u.name = String(body.name);
    if (body.phone !== undefined) u.phone = (body.phone as string) || null;
    u.updatedAt = iso(new Date());
    return ok(withTeam(u));
  }
  const target = d.users.find((x) => x.id === parts[1]);
  if (!target || !userInScope(me, target)) fail(404, 'NOT_FOUND', 'User not found.');
  const t = target!;
  const canManage = me.role === 'super_admin' || (me.role === 'marketing_manager' && ['team_leader', 'field_agent'].includes(t.role));
  if (!canManage) fail(403, 'PERMISSION_DENIED', 'You cannot change this account.');
  if (parts.length === 2 && method === 'PATCH') {
    for (const k of ['name', 'email', 'role', 'phone', 'teamId', 'joiningDate', 'targetLeadsMonthly'] as const) {
      if (body[k] !== undefined) (t as unknown as Record<string, unknown>)[k] = body[k] === '' ? null : body[k];
    }
    t.updatedAt = iso(new Date());
    return ok(withTeam(t), {}, 'Saved (mock)');
  }
  if (parts[2] === 'status' && method === 'PATCH') {
    if (t.id === me.id) fail(400, 'VALIDATION_ERROR', 'You cannot deactivate your own account.');
    t.isActive = !!body.isActive;
    if (!t.isActive) for (const [tok, uid] of Object.entries(d.sessions)) if (uid === t.id) delete d.sessions[tok];
    return ok(withTeam(t));
  }
  if (parts[2] === 'reset-password' && method === 'POST') {
    validatePassword(body.newPassword, 'newPassword');
    d.passwords[t.id] = String(body.newPassword);
    return ok(null, {}, 'Password reset (mock)');
  }
  return fail(404, 'NOT_FOUND', 'Route not found.');
};

const handleTeams = (me: User, method: string, parts: string[], p: Params, body: Record<string, unknown>) => {
  const d = load();
  if (parts.length === 1 && method === 'GET') {
    requireRoles(me, ['super_admin', 'marketing_manager', 'team_leader']);
    let list = d.teams.filter((t) => isMgmt(me) || t.id === me.teamId);
    if (p.isActive != null) list = list.filter((t) => String(t.isActive) === p.isActive);
    list = list.filter((t) => textMatch(p.search, t.name, t.description));
    const pg = paginate(list.map(teamDto), p);
    return ok(pg.data, pg.meta);
  }
  if (parts.length === 1 && method === 'POST') {
    requireRoles(me, MGMT);
    required(body, [['name', 'Enter a team name']]);
    if (d.teams.some((t) => t.name.toLowerCase() === String(body.name).trim().toLowerCase())) fail(409, 'CONFLICT', 'A team with this name already exists.', [{ path: 'name', message: 'Name already used' }]);
    const t: TeamRecord = { id: nextId(d, 'team'), name: String(body.name).trim(), description: (body.description as string) || null, isActive: true, leaderId: (body.leaderId as string) || null, createdAt: iso(new Date()), updatedAt: iso(new Date()) };
    d.teams.push(t);
    if (t.leaderId) { const l = d.users.find((u) => u.id === t.leaderId); if (l) l.teamId = t.id; }
    return ok(teamDto(t), {}, 'Team created (mock)');
  }
  const t = d.teams.find((x) => x.id === parts[1]);
  if (!t || !(isMgmt(me) || t.id === me.teamId)) fail(404, 'NOT_FOUND', 'Team not found.');
  const team = t!;
  if (parts.length === 2 && method === 'PATCH') {
    requireRoles(me, MGMT);
    if (body.name !== undefined) team.name = String(body.name);
    if (body.description !== undefined) team.description = (body.description as string) || null;
    if (body.isActive !== undefined) team.isActive = !!body.isActive;
    if (body.leaderId !== undefined) {
      team.leaderId = (body.leaderId as string) || null;
      const l = d.users.find((u) => u.id === team.leaderId);
      if (l) l.teamId = team.id;
    }
    team.updatedAt = iso(new Date());
    return ok(teamDto(team), {}, 'Saved (mock)');
  }
  if (parts.length === 2 && method === 'DELETE') {
    requireRoles(me, MGMT);
    const dto = teamDto(team);
    if (dto.agentCount > 0 || dto.leadCount > 0) fail(409, 'CONFLICT', 'This team still has agents or leads. Deactivate it instead.');
    d.teams = d.teams.filter((x) => x.id !== team.id);
    return ok(null, {}, 'Team deleted (mock)');
  }
  if (parts[2] === 'members' && method === 'GET') {
    return ok(d.users.filter((u) => u.teamId === team.id && u.role === 'field_agent').map(withTeam));
  }
  if (parts[2] === 'agents' && method === 'POST') {
    requireRoles(me, MGMT);
    const ids = (body.agentIds as string[]) ?? [];
    d.users.filter((u) => ids.includes(u.id)).forEach((u) => (u.teamId = team.id));
    return ok(d.users.filter((u) => ids.includes(u.id)).map(withTeam));
  }
  if (parts[2] === 'agents' && parts[3] && method === 'DELETE') {
    requireRoles(me, MGMT);
    const u = d.users.find((x) => x.id === parts[3]);
    if (u && u.teamId === team.id) u.teamId = null;
    return ok(null);
  }
  return fail(404, 'NOT_FOUND', 'Route not found.');
};

const scopedLeads = (me: User) => load().leads.filter((l) => leadInScope(me, l));

const handleLeads = (me: User, method: string, parts: string[], p: Params, body: Record<string, unknown>) => {
  const d = load();
  if (parts.length === 1 && method === 'GET') {
    const now = new Date();
    const today = dayKey(now);
    let list = scopedLeads(me).map(leadDto);
    if (p.status) { const set = p.status.split(','); list = list.filter((l) => set.includes(l.status)); }
    if (p.priority) list = list.filter((l) => l.priority === p.priority);
    if (p.teamId) list = list.filter((l) => l.teamId === p.teamId);
    if (p.assignedAgentId) list = list.filter((l) => l.assignedAgentId === p.assignedAgentId);
    if (p.unassigned === 'true') list = list.filter((l) => !l.assignedAgentId && !CLOSED.includes(l.status));
    if (p.leadSource) list = list.filter((l) => l.leadSource === p.leadSource);
    if (p.followUp === 'overdue') list = list.filter((l) => l.isFollowUpOverdue);
    if (p.followUp === 'today') list = list.filter((l) => l.nextFollowUpAt && dayKey(new Date(l.nextFollowUpAt)) === today);
    if (p.followUp === 'upcoming') list = list.filter((l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) > now);
    if (p.followUp === 'none') list = list.filter((l) => !l.nextFollowUpAt);
    list = list.filter((l) => textMatch(p.search, l.customerName, l.mobileNumber, l.email, l.leadCode, l.city));
    const key = (p.sort ?? 'createdAt') as keyof LeadDto;
    const dir = p.order === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return String(av).localeCompare(String(bv)) * dir;
    });
    const pg = paginate(list, p);
    return ok(pg.data, pg.meta);
  }
  if (parts.length === 1 && method === 'POST') {
    required(body, [['customerName', 'Enter the customer name'], ['mobileNumber', 'Enter a mobile number'], ['city', 'Enter the city'], ['state', 'Enter the state'], ['leadSource', 'Choose a source'], ['interestedService', 'Enter the product or service']]);
    if (!/^[6-9]\d{9}$/.test(String(body.mobileNumber).replace(/\D/g, '').slice(-10))) fail(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', [{ path: 'mobileNumber', message: 'Enter a valid mobile number' }]);
    if (!body.allowDuplicate && d.leads.some((l) => l.mobileNumber === body.mobileNumber)) fail(409, 'DUPLICATE_LEAD', 'A lead with this mobile number already exists.');
    const isAgent = me.role === 'field_agent';
    const agentId = isAgent ? me.id : (body.assignedAgentId as string) || null;
    const agent = userById(agentId);
    const now = iso(new Date());
    const lead: LeadRecord = {
      id: nextId(d, 'lead'), leadCode: `LD-${String(100231 + d.leads.length + d.seq).padStart(6, '0')}`,
      customerName: String(body.customerName).trim(), mobileNumber: String(body.mobileNumber), email: (body.email as string) || null,
      address: (body.address as string) || null, city: String(body.city), state: String(body.state), leadSource: String(body.leadSource),
      interestedService: String(body.interestedService), status: agentId ? 'assigned' : 'new', priority: (body.priority as PriorityValue) ?? 'medium',
      teamId: isAgent ? me.teamId : (body.teamId as string) || agent?.teamId || null, assignedAgentId: agentId, createdById: me.id,
      remarks: (body.remarks as string) || null, lostReason: null, lastContactedAt: null, convertedAt: null,
      onboarding: { registrationStatus: 'not_started', documentStatus: 'not_requested', onboardingStatus: 'not_started' }, createdAt: now, updatedAt: now,
    };
    d.leads.push(lead);
    addActivity(lead.id, 'created', null, me.id);
    if (agentId) addActivity(lead.id, 'assignment', `Assigned to ${agent?.name ?? me.name}`, me.id);
    if (body.nextFollowUpAt && agentId) createFollowUp(me, { leadId: lead.id, type: 'call', dueAt: body.nextFollowUpAt, assignedAgentId: agentId });
    return ok(leadDto(lead), {}, `Lead ${lead.leadCode} created (mock)`);
  }
  if (parts[1] === 'bulk-assign' && method === 'POST') {
    requireRoles(me, ['super_admin', 'marketing_manager', 'team_leader']);
    const res = { assigned: [] as string[], failed: [] as { id: string; reason: string }[] };
    for (const id of (body.leadIds as string[]) ?? []) {
      try { assign(me, findLead(me, id), body); res.assigned.push(id); } catch (e) { res.failed.push({ id, reason: (e as Error).message }); }
    }
    return ok(res);
  }
  const lead = findLead(me, parts[1]);
  if (parts.length === 2 && method === 'GET') return ok(leadDto(lead));
  if (parts.length === 2 && method === 'PATCH') {
    for (const k of ['customerName', 'mobileNumber', 'email', 'address', 'city', 'state', 'leadSource', 'interestedService', 'priority', 'remarks'] as const) {
      if (body[k] !== undefined) (lead as unknown as Record<string, unknown>)[k] = body[k] === '' ? null : body[k];
    }
    lead.updatedAt = iso(new Date());
    addActivity(lead.id, 'updated', null, me.id);
    return ok(leadDto(lead), {}, 'Saved (mock)');
  }
  if (parts[2] === 'status' && method === 'PATCH') {
    const status = body.status as LeadStatusValue;
    if (!status) fail(400, 'VALIDATION_ERROR', 'Choose a status.', [{ path: 'status', message: 'Choose a status' }]);
    if (me.role === 'field_agent' && !['contacted', 'interested', 'meeting_scheduled', 'converted', 'lost'].includes(status)) fail(403, 'PERMISSION_DENIED', 'Field agents cannot set that status.');
    if (me.role === 'field_agent' && CLOSED.includes(lead.status)) fail(403, 'PERMISSION_DENIED', 'This lead is closed. Only your team leader can reopen it.');
    if (status === 'lost' && !String(body.lostReason ?? '').trim()) fail(400, 'VALIDATION_ERROR', 'Please correct the highlighted fields.', [{ path: 'lostReason', message: 'Enter the reason the lead was lost' }]);
    const from = lead.status;
    lead.status = status;
    lead.lostReason = status === 'lost' ? String(body.lostReason) : null;
    lead.convertedAt = status === 'converted' ? iso(new Date()) : null;
    lead.lastContactedAt = iso(new Date());
    lead.updatedAt = iso(new Date());
    if (CLOSED.includes(status)) d.followUps.filter((f) => f.leadId === lead.id && f.status === 'pending').forEach((f) => { f.status = 'cancelled'; f.cancelledReason = 'Lead closed'; });
    addActivity(lead.id, 'status_change', `Status changed from ${from.replace('_', ' ')} to ${status.replace('_', ' ')}${body.remarks ? ` — ${body.remarks}` : ''}`, me.id);
    return ok(leadDto(lead), {}, 'Status updated (mock)');
  }
  if (parts[2] === 'assign' && method === 'POST') {
    requireRoles(me, ['super_admin', 'marketing_manager', 'team_leader']);
    assign(me, lead, body);
    return ok(leadDto(lead), {}, 'Lead assigned (mock)');
  }
  if (parts[2] === 'activities' && method === 'GET') {
    const list = d.activities.filter((a) => a.leadId === lead.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(activityDto);
    const pg = paginate(list, p, 15);
    return ok(pg.data, pg.meta);
  }
  if (parts[2] === 'activities' && method === 'POST') {
    if (!String(body.message ?? '').trim()) fail(400, 'VALIDATION_ERROR', 'Write a note first.', [{ path: 'message', message: 'Write a note first' }]);
    addActivity(lead.id, 'note', String(body.message).trim(), me.id);
    return ok(null, {}, 'Note added (mock)');
  }
  if (parts[2] === 'documents' && method === 'GET') return ok(d.documents.filter((x) => x.leadId === lead.id));
  return fail(404, 'NOT_FOUND', 'Route not found.');
};

const assign = (me: User, lead: LeadRecord, body: Record<string, unknown>) => {
  if (CLOSED.includes(lead.status)) fail(409, 'CONFLICT', 'Closed leads cannot be reassigned.');
  const agentId = (body.assignedAgentId as string | null | undefined) ?? null;
  const agent = userById(agentId);
  if (agentId && (!agent || agent.role !== 'field_agent' || !agent.isActive)) fail(400, 'VALIDATION_ERROR', 'Choose an active field agent.', [{ path: 'assignedAgentId', message: 'Choose an active field agent' }]);
  if (me.role === 'team_leader' && agent && agent.teamId !== me.teamId) fail(403, 'PERMISSION_DENIED', 'You can only assign agents in your team.');
  lead.assignedAgentId = agentId;
  lead.teamId = (body.teamId as string | undefined) ?? agent?.teamId ?? lead.teamId;
  if (agentId && lead.status === 'new') lead.status = 'assigned';
  lead.updatedAt = iso(new Date());
  load().followUps.filter((f) => f.leadId === lead.id && f.status === 'pending').forEach((f) => { f.assignedAgentId = agentId; f.teamId = lead.teamId; });
  addActivity(lead.id, 'assignment', agent ? `Assigned to ${agent.name}${body.remarks ? ` — ${body.remarks}` : ''}` : 'Unassigned', me.id);
};

const createFollowUp = (me: User, body: Record<string, unknown>) => {
  const d = load();
  required(body, [['leadId', 'Choose a lead'], ['type', 'Choose a type'], ['dueAt', 'Choose when it is due']]);
  const lead = findLead(me, String(body.leadId));
  if (CLOSED.includes(lead.status)) fail(409, 'CONFLICT', 'Closed leads cannot have follow-ups.');
  const agentId = me.role === 'field_agent' ? me.id : (body.assignedAgentId as string) || lead.assignedAgentId;
  if (!agentId) fail(400, 'VALIDATION_ERROR', 'Assign the lead to an agent before scheduling a follow-up.');
  const f: FollowUpRecord = {
    id: nextId(d, 'fu'), leadId: lead.id, type: body.type as FollowUpTypeValue, dueAt: String(body.dueAt), status: 'pending',
    notes: (body.notes as string) || null, outcomeNotes: null, cancelledReason: null, completedAt: null, completedById: null,
    assignedAgentId: agentId!, teamId: lead.teamId, createdById: me.id, createdAt: iso(new Date()), updatedAt: iso(new Date()),
  };
  d.followUps.push(f);
  addActivity(lead.id, 'followup_created', `${f.type.replace('_', ' ')} scheduled`, me.id);
  return f;
};

const handleFollowUps = (me: User, method: string, parts: string[], p: Params, body: Record<string, unknown>) => {
  const d = load();
  const now = new Date();
  const scoped = () => d.followUps.filter((f) => {
    const l = d.leads.find((x) => x.id === f.leadId);
    return !!l && (me.role === 'field_agent' ? f.assignedAgentId === me.id : leadInScope(me, l));
  });
  if (parts[1] === 'summary' && method === 'GET') {
    const list = scoped();
    const pending = list.filter((f) => f.status === 'pending');
    const today = dayKey(now);
    return ok({
      pending: pending.length,
      overdue: pending.filter((f) => new Date(f.dueAt) < now).length,
      dueToday: pending.filter((f) => dayKey(new Date(f.dueAt)) === today).length,
      completed: list.filter((f) => f.status === 'completed').length,
    });
  }
  if (parts.length === 1 && method === 'GET') {
    let list = scoped();
    if (p.status === 'overdue') list = list.filter((f) => f.status === 'pending' && new Date(f.dueAt) < now);
    else if (p.status === 'pending') list = list.filter((f) => f.status === 'pending' && new Date(f.dueAt) >= now);
    else if (p.status) list = list.filter((f) => f.status === p.status);
    if (p.type) list = list.filter((f) => f.type === p.type);
    if (p.leadId) list = list.filter((f) => f.leadId === p.leadId);
    if (p.assignedAgentId) list = list.filter((f) => f.assignedAgentId === p.assignedAgentId);
    list = [...list].sort((a, b) => a.dueAt.localeCompare(b.dueAt) * (p.order === 'desc' ? -1 : 1));
    const pg = paginate(list.map(followUpDto), p);
    return ok(pg.data, pg.meta);
  }
  if (parts.length === 1 && method === 'POST') return ok(followUpDto(createFollowUp(me, body)), {}, 'Follow-up scheduled (mock)');
  const f = scoped().find((x) => x.id === parts[1]);
  if (!f) fail(404, 'NOT_FOUND', 'Follow-up not found.');
  const fu = f!;
  if (fu.status !== 'pending' && method !== 'GET') fail(409, 'CONFLICT', 'This follow-up is already closed.');
  if (parts.length === 2 && method === 'PATCH') {
    if (body.type !== undefined) fu.type = body.type as FollowUpTypeValue;
    if (body.dueAt !== undefined) fu.dueAt = String(body.dueAt);
    if (body.notes !== undefined) fu.notes = (body.notes as string) || null;
    fu.updatedAt = iso(new Date());
    return ok(followUpDto(fu), {}, 'Follow-up updated (mock)');
  }
  if (parts[2] === 'complete' && method === 'POST') {
    fu.status = 'completed'; fu.outcomeNotes = (body.outcomeNotes as string) || null; fu.completedAt = iso(new Date()); fu.completedById = me.id;
    const lead = d.leads.find((l) => l.id === fu.leadId);
    if (lead) lead.lastContactedAt = iso(new Date());
    addActivity(fu.leadId, 'followup_completed', fu.outcomeNotes, me.id);
    return ok(followUpDto(fu), {}, 'Follow-up completed (mock)');
  }
  if (parts[2] === 'cancel' && method === 'POST') {
    fu.status = 'cancelled'; fu.cancelledReason = (body.reason as string) || null;
    addActivity(fu.leadId, 'followup_cancelled', fu.cancelledReason, me.id);
    return ok(followUpDto(fu), {}, 'Follow-up cancelled (mock)');
  }
  return fail(404, 'NOT_FOUND', 'Route not found.');
};

const SETTINGS: PublicSettings = {
  organization: { name: 'JBCONX (mock)' },
  attendance: { timezone: TZ },
  operational: { agentsCanCreateLeads: true, requireCheckInForVisits: true, leadSources: ['Referral', 'Field Visit', 'Cold Call', 'Website', 'Exhibition', 'Walk-in'] },
};

const scopedAttendance = (me: User) => load().attendance.filter((a) => agentInScope(me, a.userId, a.teamId));
const todayRecord = (userId: string) => load().attendance.find((a) => a.userId === userId && a.date === dayKey(new Date())) ?? null;

const handleAttendance = (me: User, method: string, parts: string[], p: Params, body: Record<string, unknown>) => {
  const d = load();
  if (parts.length === 1 && method === 'GET') {
    requireRoles(me, ['super_admin', 'marketing_manager', 'team_leader']);
    let list = scopedAttendance(me);
    if (p.agentId) list = list.filter((a) => a.userId === p.agentId);
    if (p.teamId) list = list.filter((a) => a.teamId === p.teamId);
    if (p.status) list = list.filter((a) => a.status === p.status);
    if (p.from) list = list.filter((a) => a.date >= p.from!);
    if (p.to) list = list.filter((a) => a.date <= p.to!);
    list = [...list].sort((a, b) => b.date.localeCompare(a.date) || (userById(a.userId)?.name ?? '').localeCompare(userById(b.userId)?.name ?? ''));
    const pg = paginate(list.map(attendanceDto), p);
    return ok(pg.data, pg.meta);
  }
  if (parts[1] === 'today' && method === 'GET') {
    const r = todayRecord(me.id);
    return ok(r ? attendanceDto(r) : null);
  }
  if (parts[1] === 'me' && method === 'GET') {
    let list = d.attendance.filter((a) => a.userId === me.id);
    if (p.from) list = list.filter((a) => a.date >= p.from!);
    if (p.to) list = list.filter((a) => a.date <= p.to!);
    const pg = paginate([...list].sort((a, b) => b.date.localeCompare(a.date)).map(attendanceDto), p);
    return ok(pg.data, pg.meta);
  }
  if ((parts[1] === 'check-in' || parts[1] === 'check-out') && method === 'POST') {
    requireRoles(me, ['field_agent']);
    const at = new Date();
    const point = { at: iso(at), latitude: body.latitude as number | undefined, longitude: body.longitude as number | undefined, accuracy: body.accuracy as number | undefined, lowAccuracy: Number(body.accuracy ?? 0) > 100, withinGeofence: null, distanceMeters: null };
    let r = todayRecord(me.id);
    if (parts[1] === 'check-in') {
      if (r) fail(409, 'CONFLICT', r.source === 'admin' ? 'Your manager has already marked today.' : 'You have already checked in today.');
      r = { id: nextId(d, 'att'), userId: me.id, teamId: me.teamId, date: dayKey(at), status: 'present', checkIn: point, checkOut: null, workingMinutes: 0, isOpen: true, remarks: (body.remarks as string) || null, source: 'self', createdAt: iso(at), updatedAt: iso(at) };
      d.attendance.push(r);
      return ok(attendanceDto(r), {}, 'Checked in (mock)');
    }
    if (!r || !r.isOpen) fail(409, 'CONFLICT', 'You are not checked in.');
    const rec = r!;
    rec.checkOut = point; rec.isOpen = false;
    rec.workingMinutes = Math.max(1, Math.round((at.getTime() - new Date(rec.checkIn!.at).getTime()) / 60000));
    rec.status = rec.workingMinutes < 240 ? 'half_day' : 'present';
    rec.updatedAt = iso(at);
    return ok(attendanceDto(rec), {}, 'Checked out (mock)');
  }
  if (parts[1] === 'mark' && method === 'POST') {
    requireRoles(me, MGMT);
    required(body, [['agentId', 'Choose an agent'], ['date', 'Choose a date'], ['status', 'Choose a status']]);
    const agent = userById(String(body.agentId));
    if (!agent) fail(404, 'NOT_FOUND', 'Agent not found.');
    const existing = d.attendance.find((a) => a.userId === agent!.id && a.date === body.date);
    if (existing?.checkIn) fail(409, 'CONFLICT', 'This agent already checked in that day. Correct the record instead.');
    const r: AttendanceRecord = existing ?? { id: nextId(d, 'att'), userId: agent!.id, teamId: agent!.teamId, date: String(body.date), status: 'present', checkIn: null, checkOut: null, workingMinutes: 0, isOpen: false, remarks: null, source: 'admin', createdAt: iso(new Date()), updatedAt: iso(new Date()) };
    r.status = body.status as AttendanceStatusValue; r.remarks = (body.remarks as string) || null; r.source = 'admin'; r.updatedAt = iso(new Date());
    if (!existing) d.attendance.push(r);
    return ok(attendanceDto(r), {}, 'Attendance marked (mock)');
  }
  if (parts[2] === 'correct' && method === 'PATCH') {
    requireRoles(me, MGMT);
    const r = d.attendance.find((a) => a.id === parts[1]);
    if (!r) fail(404, 'NOT_FOUND', 'Record not found.');
    const rec = r!;
    if (body.checkOutAt) {
      rec.checkOut = { at: String(body.checkOutAt) };
      rec.isOpen = false;
      rec.workingMinutes = rec.checkIn ? Math.max(0, Math.round((new Date(String(body.checkOutAt)).getTime() - new Date(rec.checkIn.at).getTime()) / 60000)) : 0;
    }
    rec.remarks = (body.remarks as string) || rec.remarks;
    rec.updatedAt = iso(new Date());
    return ok(attendanceDto(rec), {}, 'Record corrected (mock)');
  }
  return fail(404, 'NOT_FOUND', 'Route not found.');
};

const scopedVisits = (me: User) => load().visits.filter((v) => agentInScope(me, v.agentId, v.teamId));

const handleVisits = (me: User, method: string, parts: string[], p: Params, body: unknown) => {
  const d = load();
  const b = (body ?? {}) as Record<string, unknown>;
  if (parts.length === 1 && method === 'GET') {
    let list = scopedVisits(me);
    if (p.agentId) list = list.filter((v) => v.agentId === p.agentId);
    if (p.teamId) list = list.filter((v) => v.teamId === p.teamId);
    if (p.leadId) list = list.filter((v) => v.leadId === p.leadId);
    if (p.outcome) list = list.filter((v) => v.outcome === p.outcome);
    if (p.status) list = list.filter((v) => v.status === p.status);
    list = list.filter((v) => inRange(v.visitedAt, p));
    const pg = paginate([...list].sort((a, b2) => b2.visitedAt.localeCompare(a.visitedAt)).map(visitDto), p);
    return ok(pg.data, pg.meta);
  }
  if (parts.length === 1 && method === 'POST') {
    requireRoles(me, ['field_agent']);
    required(b, [['leadId', 'Choose a lead'], ['notes', 'Describe the visit'], ['outcome', 'Choose an outcome']]);
    if (b.latitude == null || b.longitude == null) fail(400, 'VALIDATION_ERROR', 'A GPS location is required to record a visit.');
    const open = todayRecord(me.id);
    if (SETTINGS.operational.requireCheckInForVisits && !(open && open.checkIn)) fail(409, 'CHECK_IN_REQUIRED', 'Check in for the day before recording a visit.');
    const lead = findLead(me, String(b.leadId));
    const at = b.visitedAt ? String(b.visitedAt) : iso(new Date());
    const v: VisitRecord = {
      id: nextId(d, 'vis'), leadId: lead.id, agentId: me.id, teamId: me.teamId, visitedAt: at,
      location: { latitude: Number(b.latitude), longitude: Number(b.longitude), accuracy: b.accuracy as number | undefined, lowAccuracy: Number(b.accuracy ?? 0) > 100 },
      notes: String(b.notes), outcome: b.outcome as VisitOutcomeValue, status: 'completed', nextFollowUpAt: (b.nextFollowUpAt as string) || null,
      followUpId: null, createdAt: iso(new Date()), updatedAt: iso(new Date()),
    };
    if (v.nextFollowUpAt && !CLOSED.includes(lead.status)) v.followUpId = createFollowUp(me, { leadId: lead.id, type: 'customer_visit', dueAt: v.nextFollowUpAt, notes: 'Follow-up from visit' }).id;
    d.visits.push(v);
    lead.lastContactedAt = at;
    addActivity(lead.id, 'visit', `Visit recorded: ${v.outcome.replace(/_/g, ' ')}`, me.id);
    return ok(visitDto(v), {}, 'Visit recorded (mock)');
  }
  const v = scopedVisits(me).find((x) => x.id === parts[1]);
  if (!v) fail(404, 'NOT_FOUND', 'Visit not found.');
  const visit = v!;
  if (parts.length === 2 && method === 'GET') return ok(visitDto(visit));
  if (parts.length === 2 && method === 'PATCH') {
    if (b.notes !== undefined) visit.notes = String(b.notes);
    if (b.outcome !== undefined) visit.outcome = b.outcome as VisitOutcomeValue;
    if (b.status !== undefined) visit.status = b.status as VisitStatusValue;
    visit.updatedAt = iso(new Date());
    return ok(visitDto(visit), {}, 'Visit updated (mock)');
  }
  if (parts[2] === 'photos' && method === 'POST') {
    const files = body instanceof FormData ? (body.getAll('photos').filter((x) => x instanceof File) as File[]) : [];
    const docs = files.map((file) => {
      const doc: DocumentDto = {
        id: nextId(d, 'doc'), leadId: visit.leadId, visitId: visit.id, category: 'visit_photo', originalName: file.name,
        mimeType: file.type || 'image/jpeg', sizeBytes: file.size, downloadPath: `/__mock__/photos/${d.seq}`, createdAt: iso(new Date()),
      };
      photoUrls.set(doc.downloadPath, URL.createObjectURL(file));
      d.documents.push(doc);
      return doc;
    });
    return ok(docs, {}, 'Photos uploaded (mock, this browser session only)');
  }
  return fail(404, 'NOT_FOUND', 'Route not found.');
};

/* ───────────────────────── dashboard & reports ───────────────────────── */

const rate = (part: number, total: number) => (total ? Math.round((part / total) * 1000) / 10 : 0);
const agentsInScope = (me: User) => load().users.filter((u) => u.role === 'field_agent' && u.isActive && agentInScope(me, u.id, u.teamId));

const dashboard = (me: User) => {
  const d = load();
  const now = new Date();
  const today = dayKey(now);
  const leads = scopedLeads(me);
  const count = (s: LeadStatusValue) => leads.filter((l) => l.status === s).length;
  const open = leads.filter((l) => !CLOSED.includes(l.status));
  const fus = d.followUps.filter((f) => f.status === 'pending' && (me.role === 'field_agent' ? f.assignedAgentId === me.id : leads.some((l) => l.id === f.leadId)));
  const agents = agentsInScope(me);
  const att = d.attendance.filter((a) => a.date === today && agents.some((u) => u.id === a.userId));
  const months = Array.from({ length: 6 }, (_, i) => { const x = new Date(now.getFullYear(), now.getMonth() - (5 - i), 15); return monthKey(x); });
  const sourceMap = new Map<string, { total: number; converted: number }>();
  leads.forEach((l) => { const s = sourceMap.get(l.leadSource) ?? { total: 0, converted: 0 }; s.total++; if (l.status === 'converted') s.converted++; sourceMap.set(l.leadSource, s); });
  const present = att.filter((a) => a.status === 'present').length;
  const halfDay = att.filter((a) => a.status === 'half_day').length;
  const onLeave = att.filter((a) => a.status === 'on_leave').length;
  const absent = att.filter((a) => a.status === 'absent').length;
  const thisMonth = monthKey(now);
  const convertedThisMonth = leads.filter((l) => l.status === 'converted' && l.convertedAt && monthKey(new Date(l.convertedAt)) === thisMonth).length;
  const target = me.role === 'field_agent' ? userById(me.id)?.targetLeadsMonthly ?? null : null;
  return {
    generatedAt: iso(now),
    timezone: TZ,
    leads: {
      total: leads.length, new: count('new'), assigned: count('assigned'), contacted: count('contacted'), interested: count('interested'),
      meetingScheduled: count('meeting_scheduled'), converted: count('converted'), lost: count('lost'), pending: open.length,
      unassigned: open.filter((l) => !l.assignedAgentId).length, conversionRate: rate(count('converted'), leads.length),
    },
    followUps: { pending: fus.length, dueToday: fus.filter((f) => dayKey(new Date(f.dueAt)) === today).length, overdue: fus.filter((f) => new Date(f.dueAt) < now).length },
    visits: { today: scopedVisits(me).filter((v) => dayKey(new Date(v.visitedAt)) === today).length },
    attendanceToday: { totalAgents: agents.length, present, halfDay, onLeave, absent, notMarked: Math.max(0, agents.length - present - halfDay - onLeave - absent) },
    monthlyTrend: months.map((m) => ({
      month: m,
      created: leads.filter((l) => monthKey(new Date(l.createdAt)) === m).length,
      converted: leads.filter((l) => monthKey(new Date(l.createdAt)) === m && l.status === 'converted').length,
    })),
    sourceDistribution: [...sourceMap.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.total - a.total),
    ...(me.role === 'field_agent' && { personal: { monthlyTarget: target, convertedThisMonth, targetProgress: target ? Math.round((convertedThisMonth / target) * 100) : null } }),
  };
};

const report = (me: User, name: string, p: Params) => {
  const d = load();
  const range = { from: p.from ?? iso(daysAgo(29, 0)), to: p.to ?? iso(new Date()) };
  const rp: Params = { ...p, ...range };
  const team = (t: { teamId: string | null }) => !p.teamId || t.teamId === p.teamId;
  const leads = scopedLeads(me).filter(team);
  const visits = scopedVisits(me).filter(team).filter((v) => inRange(v.visitedAt, rp));
  const fusDone = d.followUps.filter((f) => f.status === 'completed' && f.completedAt && inRange(f.completedAt, rp));
  const att = scopedAttendance(me).filter(team).filter((a) => a.date >= dayKey(new Date(range.from)) && a.date <= dayKey(new Date(range.to)));
  const agents = d.users.filter((u) => u.role === 'field_agent' && agentInScope(me, u.id, u.teamId)).filter((u) => !p.teamId || u.teamId === p.teamId);

  switch (name) {
    case 'team-performance': {
      const teams = d.teams.filter((t) => (isMgmt(me) || t.id === me.teamId) && (!p.teamId || t.id === p.teamId));
      return ok({
        range, teams: teams.map((t) => {
          const tl = leads.filter((l) => l.teamId === t.id);
          const converted = tl.filter((l) => l.status === 'converted').length;
          return {
            teamId: t.id, name: t.name, leader: ref(userById(t.leaderId)), agents: d.users.filter((u) => u.role === 'field_agent' && u.teamId === t.id && u.isActive).length,
            totalLeads: tl.length, openLeads: tl.filter((l) => !CLOSED.includes(l.status)).length, converted, conversionRate: rate(converted, tl.length),
            leadsCreatedInRange: tl.filter((l) => inRange(l.createdAt, rp)).length, convertedInRange: tl.filter((l) => l.convertedAt && inRange(l.convertedAt, rp)).length,
            visitsInRange: visits.filter((v) => v.teamId === t.id).length, followUpsCompletedInRange: fusDone.filter((f) => f.teamId === t.id).length,
          };
        }),
      });
    }
    case 'agent-performance':
      return ok({
        range, agents: agents.map((a) => {
          const al = leads.filter((l) => l.assignedAgentId === a.id);
          const converted = al.filter((l) => l.status === 'converted').length;
          return {
            agentId: a.id, name: a.name, employeeCode: a.employeeCode ?? null, isActive: a.isActive, team: teamRef(a.teamId), monthlyTarget: a.targetLeadsMonthly ?? null,
            totalLeads: al.length, openLeads: al.filter((l) => !CLOSED.includes(l.status)).length, converted, conversionRate: rate(converted, al.length),
            convertedInRange: al.filter((l) => l.convertedAt && inRange(l.convertedAt, rp)).length, visitsInRange: visits.filter((v) => v.agentId === a.id).length,
            followUpsCompletedInRange: fusDone.filter((f) => f.assignedAgentId === a.id).length,
            attendanceDaysInRange: att.filter((x) => x.userId === a.id && (x.status === 'present' || x.status === 'half_day')).length,
          };
        }),
      });
    case 'attendance-summary':
      return ok({
        range, agents: agents.map((a) => {
          const rows = att.filter((x) => x.userId === a.id);
          const worked = rows.filter((x) => x.workingMinutes > 0);
          const total = worked.reduce((s, x) => s + x.workingMinutes, 0);
          return {
            agentId: a.id, name: a.name, employeeCode: a.employeeCode ?? null, present: rows.filter((x) => x.status === 'present').length,
            halfDay: rows.filter((x) => x.status === 'half_day').length, absent: rows.filter((x) => x.status === 'absent').length,
            onLeave: rows.filter((x) => x.status === 'on_leave').length, totalWorkingMinutes: total, averageWorkingMinutes: worked.length ? Math.round(total / worked.length) : 0,
          };
        }).filter((r) => r.present + r.halfDay + r.absent + r.onLeave > 0),
      });
    case 'visit-summary': {
      const byOutcome: Record<string, number> = {};
      visits.forEach((v) => (byOutcome[v.outcome] = (byOutcome[v.outcome] ?? 0) + 1));
      const days: string[] = [];
      for (let t = new Date(range.from); t <= new Date(range.to) && days.length < 120; t = new Date(t.getTime() + 86400000)) days.push(dayKey(t));
      const byAgent = new Map<string, number>();
      visits.forEach((v) => byAgent.set(v.agentId, (byAgent.get(v.agentId) ?? 0) + 1));
      return ok({
        range, total: visits.length, byOutcome,
        byDay: days.map((date) => ({ date, visits: visits.filter((v) => dayKey(new Date(v.visitedAt)) === date).length })),
        byAgent: [...byAgent.entries()].map(([agentId, n]) => ({ agentId, name: userById(agentId)?.name ?? '—', visits: n })).sort((a, b) => b.visits - a.visits),
      });
    }
    case 'onboarding-progress': {
      const tally = (k: 'registrationStatus' | 'documentStatus' | 'onboardingStatus') => leads.reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.onboarding[k]]: (acc[l.onboarding[k]] ?? 0) + 1 }), {});
      return ok({ range, registration: tally('registrationStatus'), documents: tally('documentStatus'), onboarding: tally('onboardingStatus') });
    }
    case 'lead-funnel': {
      const created = leads.filter((l) => inRange(l.createdAt, rp));
      const byStatus: Record<string, number> = {};
      const byPriority: Record<string, number> = {};
      const src = new Map<string, { total: number; converted: number }>();
      created.forEach((l) => {
        byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
        byPriority[l.priority] = (byPriority[l.priority] ?? 0) + 1;
        const s = src.get(l.leadSource) ?? { total: 0, converted: 0 }; s.total++; if (l.status === 'converted') s.converted++; src.set(l.leadSource, s);
      });
      return ok({ range, byStatus, byPriority, bySource: [...src.entries()].map(([source, v]) => ({ source, ...v, conversionRate: rate(v.converted, v.total) })).sort((a, b) => b.total - a.total) });
    }
  }
  return fail(404, 'NOT_FOUND', 'Report not found.');
};

/* ───────────────────────── router ───────────────────────── */

const route = (args: string | FetchArgs, token: string | null) => {
  const fa: FetchArgs = typeof args === 'string' ? { url: args } : args;
  const method = (fa.method ?? 'GET').toUpperCase();
  const [path, qs] = fa.url.split('?');
  const params: Params = {};
  new URLSearchParams(qs ?? '').forEach((v, k) => (params[k] = v));
  for (const [k, v] of Object.entries((fa.params ?? {}) as Record<string, unknown>)) if (v !== undefined && v !== null && v !== '') params[k] = String(v);
  const body = fa.body instanceof FormData ? fa.body : ((fa.body ?? {}) as Record<string, unknown>);
  const parts = path.replace(/^\/+|\/+$/g, '').split('/');

  if (parts[0] === 'auth' && parts[1] === 'login' && method === 'POST') return login(body as Record<string, unknown>);
  const me = authUser(token);
  const json = body as Record<string, unknown>;

  switch (parts[0]) {
    case 'auth':
      if (parts[1] === 'me') return ok(me);
      if (parts[1] === 'logout') { delete load().sessions[token!]; return ok(null, {}, 'Signed out (mock)'); }
      if (parts[1] === 'change-password') {
        const d = load();
        if (d.passwords[me.id] !== json.currentPassword) fail(400, 'VALIDATION_ERROR', 'Current password is incorrect.', [{ path: 'currentPassword', message: 'Current password is incorrect' }]);
        validatePassword(json.newPassword, 'newPassword');
        d.passwords[me.id] = String(json.newPassword);
        return ok({ token: token! }, {}, 'Password changed (mock)');
      }
      break;
    case 'users': return handleUsers(me, method, parts, params, json);
    case 'teams': return handleTeams(me, method, parts, params, json);
    case 'leads': return handleLeads(me, method, parts, params, json);
    case 'followups': return handleFollowUps(me, method, parts, params, json);
    case 'settings': return ok(SETTINGS);
    case 'attendance': return handleAttendance(me, method, parts, params, json);
    case 'visits': return handleVisits(me, method, parts, params, body);
    case 'dashboard': return ok(dashboard(me));
    case 'reports': return report(me, parts[1], params);
  }
  return fail(404, 'NOT_FOUND', `Mock route not found: ${method} /${parts.join('/')}`);
};

/**
 * Entry point used by createBaseQuery in mock mode. Returns RTK Query's { data } / { error } shapes,
 * with the same error envelope the real backend sends.
 */
export const mockRequest = async (args: string | FetchArgs, token: string | null): Promise<Result> => {
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180)); // realistic loading states
  try {
    const data = route(args, token);
    save();
    return { data: JSON.parse(JSON.stringify(data)) };
  } catch (e) {
    save();
    if (e instanceof HttpError) {
      return { error: { status: e.status, data: { success: false, error: { code: e.code, message: e.message, details: e.details } } } };
    }
    console.error('[mock API] handler error', e);
    return { error: { status: 500, data: { success: false, error: { code: 'MOCK_ERROR', message: 'Mock API error (see console).', details: [] } } } };
  }
};
