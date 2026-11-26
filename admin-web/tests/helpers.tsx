import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../src/redux/store';
import { baseApi } from '../src/redux/services/baseApi';
import { resetAuth } from '../src/redux/slices/authSlice';
import { dismissToast } from '../src/redux/slices/toastSlice';
import { AuthGate } from '../src/features/auth/AuthGate';
import { AppRoutes } from '../src/routes';

export const API = import.meta.env.VITE_API_BASE_URL as string;
export const PASSWORD = 'Str0ng-Test-Pass1';
export const TOKEN_KEY = 'jbconx.crm.token';

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? '',
  password: process.env.E2E_ADMIN_PASSWORD ?? '',
};

export const uid = () => Math.random().toString(36).slice(2, 8);

export const call = async (path: string, opts: { method?: string; token?: string; body?: unknown } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json()) as { success: boolean; data: any; error?: { code: string; message: string } };
  return { status: res.status, ...json };
};

export const loginApi = async (email: string, password = PASSWORD): Promise<string> => {
  const r = await call('/auth/login', { method: 'POST', body: { email, password } });
  if (r.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(r)}`);
  return r.data.token as string;
};

export interface Person { id: string; name: string; email: string; token: string }

export interface World {
  tag: string;
  adminToken: string;
  manager: Person;
  leader: Person;
  agent: Person;
  otherLeader: Person;
  team: { id: string; name: string };
  otherTeam: { id: string; name: string };
}

const makeUser = async (adminToken: string, role: string, name: string, extra: Record<string, unknown> = {}): Promise<Person> => {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@e2e.test`;
  const r = await call('/users', { method: 'POST', token: adminToken, body: { name, email, password: PASSWORD, role, ...extra } });
  if (r.status !== 201) throw new Error(`create ${role} failed: ${JSON.stringify(r)}`);
  return { id: r.data.id, name, email, token: '' };
};

/** Creates an isolated set of people/teams through the real API (unique names per test file). */
export const seedWorld = async (): Promise<World> => {
  const tag = uid();
  const adminToken = await loginApi(ADMIN.email, ADMIN.password);
  const manager = await makeUser(adminToken, 'marketing_manager', `Mia Manager ${tag}`);
  const leader = await makeUser(adminToken, 'team_leader', `Lena Leader ${tag}`);
  const otherLeader = await makeUser(adminToken, 'team_leader', `Omar Other ${tag}`);
  const agent = await makeUser(adminToken, 'field_agent', `Abe Agent ${tag}`, { targetLeadsMonthly: 12, phone: '+91 98765 43210' });
  const t1 = await call('/teams', { method: 'POST', token: adminToken, body: { name: `Alpha ${tag}`, leaderId: leader.id } });
  const t2 = await call('/teams', { method: 'POST', token: adminToken, body: { name: `Bravo ${tag}`, leaderId: otherLeader.id } });
  await call(`/teams/${t1.data.id}/agents`, { method: 'POST', token: adminToken, body: { agentIds: [agent.id] } });
  return { tag, adminToken, manager, leader, agent, otherLeader, team: { id: t1.data.id, name: t1.data.name }, otherTeam: { id: t2.data.id, name: t2.data.name } };
};

/**
 * One store for the whole test file (the RTK Query api object is a module singleton and must not be
 * attached to several stores). State is reset before every render.
 */
export const resetStore = () => {
  store.dispatch(baseApi.util.resetApiState());
  store.dispatch(resetAuth());
  store.getState().toast.items.forEach((t) => store.dispatch(dismissToast(t.id)));
};

export const renderApp = (route = '/') => {
  resetStore();
  const user = userEvent.setup();
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AuthGate>
          <AppRoutes />
        </AuthGate>
      </MemoryRouter>
    </Provider>
  );
  return { store, user, ...utils };
};

/** Sign in through the real login screen. */
export const signInViaUi = async (
  ctx: ReturnType<typeof renderApp>,
  email: string,
  password = PASSWORD,
  opts: { remember?: boolean } = {}
) => {
  const { screen } = await import('@testing-library/react');
  await ctx.user.type(await screen.findByLabelText('Work email'), email);
  await ctx.user.type(screen.getByLabelText('Password'), password);
  if (opts.remember) await ctx.user.click(screen.getByLabelText('Keep me signed in on this device'));
  await ctx.user.click(screen.getByRole('button', { name: /sign in/i }));
};

export const loginAsToken = async (email: string, password = PASSWORD) => {
  window.sessionStorage.setItem(TOKEN_KEY, await loginApi(email, password));
};

export const makePerson = async (adminToken: string, role: string, name: string, extra: Record<string, unknown> = {}) => {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@e2e.test`;
  const r = await call('/users', { method: 'POST', token: adminToken, body: { name, email, password: PASSWORD, role, ...extra } });
  if (r.status !== 201) throw new Error(`create ${role} failed: ${JSON.stringify(r)}`);
  return { id: r.data.id as string, name, email };
};

export const makeLead = async (token: string, over: Record<string, unknown> = {}) => {
  const body = {
    customerName: `Cust ${uid()}`,
    mobileNumber: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    city: 'Pune', state: 'MH', leadSource: 'Referral', interestedService: 'Solar install', ...over,
  };
  const r = await call('/leads', { method: 'POST', token, body });
  if (r.status !== 201) throw new Error(`create lead failed: ${JSON.stringify(r)}`);
  return r.data as { id: string; leadCode: string; customerName: string; mobileNumber: string };
};

export const makeFollowUp = async (token: string, leadId: string, dueAt: Date, type = 'call', notes?: string) => {
  const r = await call('/followups', { method: 'POST', token, body: { leadId, type, dueAt: dueAt.toISOString(), ...(notes && { notes }) } });
  if (r.status !== 201) throw new Error(`create follow-up failed: ${JSON.stringify(r)}`);
  return r.data as { id: string };
};

export const minutesFromNow = (m: number) => new Date(Date.now() + m * 60000);

export interface Metrics extends World {
  agentToken: string;
  leads: { assigned1: string; assigned2: string; visited: string; converted: string; lost: string; unassigned: string };
}

/**
 * Deterministic scenario inside the world's team ("Alpha"): 6 leads (1 new, 2 assigned, 1 interested via a visit,
 * 1 converted, 1 lost), follow-ups (1 completed, 1 overdue, 1 pending in the future), 1 visit today, 1 check-in today.
 */
export const seedMetrics = async (): Promise<Metrics> => {
  const w = await seedWorld();
  const t = w.adminToken;
  const a1 = await makeLead(t, { customerName: `M-A1 ${w.tag}`, assignedAgentId: w.agent.id, leadSource: 'Referral' });
  const a2 = await makeLead(t, { customerName: `M-A2 ${w.tag}`, assignedAgentId: w.agent.id, leadSource: 'Referral' });
  const v = await makeLead(t, { customerName: `M-V ${w.tag}`, assignedAgentId: w.agent.id, leadSource: 'Field Visit' });
  const c = await makeLead(t, { customerName: `M-C ${w.tag}`, assignedAgentId: w.agent.id, leadSource: 'Referral' });
  const l = await makeLead(t, { customerName: `M-L ${w.tag}`, assignedAgentId: w.agent.id, leadSource: 'Cold Call' });
  const u = await makeLead(t, { customerName: `M-U ${w.tag}`, teamId: w.team.id, leadSource: 'Referral' });
  await call(`/leads/${c.id}/status`, { method: 'PATCH', token: t, body: { status: 'converted' } });
  await call(`/leads/${l.id}/status`, { method: 'PATCH', token: t, body: { status: 'lost', lostReason: 'No budget' } });
  const done = await makeFollowUp(t, a1.id, minutesFromNow(-4), 'call', `done ${w.tag}`);
  await call(`/followups/${done.id}/complete`, { method: 'POST', token: t, body: { outcomeNotes: 'ok' } });
  await makeFollowUp(t, a1.id, minutesFromNow(-3), 'demo', `overdue ${w.tag}`);
  await makeFollowUp(t, a2.id, minutesFromNow(60 * 48), 'meeting', `future ${w.tag}`);
  const agentToken = await loginApi(w.agent.email);
  const gps = { latitude: 12.97, longitude: 77.59, accuracy: 10 };
  const ci = await call('/attendance/check-in', { method: 'POST', token: agentToken, body: gps });
  if (ci.status !== 201) throw new Error(`check-in failed: ${JSON.stringify(ci)}`);
  const vis = await call('/visits', { method: 'POST', token: agentToken, body: { leadId: v.id, ...gps, notes: 'Showed brochure', outcome: 'interested' } });
  if (vis.status !== 201) throw new Error(`visit failed: ${JSON.stringify(vis)}`);
  return { ...w, agentToken, leads: { assigned1: a1.id, assigned2: a2.id, visited: v.id, converted: c.id, lost: l.id, unassigned: u.id } };
};

export const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);

export const uploadPhotos = async (token: string, visitId: string, count = 1) => {
  const fd = new FormData();
  for (let i = 0; i < count; i++) fd.append('photos', new Blob([PNG_BYTES], { type: 'image/png' }), `shot-${i + 1}.png`);
  const res = await fetch(`${API}/visits/${visitId}/photos`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd });
  const json = await res.json();
  if (res.status !== 201) throw new Error(`photo upload failed: ${res.status} ${JSON.stringify(json)}`);
  return json.data as { id: string; downloadPath: string }[];
};

export const setSettings = (adminToken: string, body: unknown) => call('/settings', { method: 'PATCH', token: adminToken, body });
