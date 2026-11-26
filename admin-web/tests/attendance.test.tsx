import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD, World, call, loginApi, loginAsToken, makePerson, renderApp, seedWorld, setSettings } from './helpers';

const GPS = { latitude: 12.9716, longitude: 77.5946, accuracy: 12 };
let w: World;
let a: { id: string; name: string; email: string }; // checked in and out
let b: { id: string; name: string; email: string }; // still checked in
let c: { id: string; name: string; email: string }; // marked on leave by admin
const dayKey = (offset = 0) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

beforeAll(async () => {
  w = await seedWorld();
  a = { id: w.agent.id, name: w.agent.name, email: w.agent.email };
  b = await makePerson(w.adminToken, 'field_agent', `Open Agent ${w.tag}`);
  c = await makePerson(w.adminToken, 'field_agent', `Leave Agent ${w.tag}`);
  await call(`/teams/${w.team.id}/agents`, { method: 'POST', token: w.adminToken, body: { agentIds: [b.id, c.id] } });
  const ta = await loginApi(a.email);
  const tb = await loginApi(b.email);
  expect((await call('/attendance/check-in', { method: 'POST', token: ta, body: GPS })).status).toBe(201);
  expect((await call('/attendance/check-out', { method: 'POST', token: ta, body: GPS })).status).toBe(200);
  expect((await call('/attendance/check-in', { method: 'POST', token: tb, body: GPS })).status).toBe(201);
  const m = await call('/attendance/mark', { method: 'POST', token: w.adminToken, body: { agentId: c.id, date: dayKey(-1), status: 'on_leave', remarks: 'Approved leave' } });
  expect(m.status).toBe(200);
});

const arows = async () => await screen.findAllByTestId('attendance-row');
const rowFor = async (text: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const r = (await arows()).find((x) => x.textContent?.includes(text));
    if (!r) throw new Error(`no attendance row for ${text}`);
    return r;
  });

describe('attendance monitoring (live data)', () => {
  it('shows real check-ins with times, location link, hours and status; no preview banner', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: a.name }));
    const row = await rowFor(a.name);
    expect(within(row).getByText('Half day')).toBeInTheDocument(); // checked out within a minute: under a full day
    const link = within(row).getAllByRole('link')[0];
    expect(link.getAttribute('href')).toContain('openstreetmap.org');
    expect(link.getAttribute('href')).toContain('12.9716');
    expect(link).toHaveTextContent('12.97160, 77.59460');
    expect(within(row).getByText(dayKey(0))).toBeInTheDocument();
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('an agent who has not checked out is shown as still checked in', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: b.name }));
    const row = await rowFor(b.name);
    expect(within(row).getByText('Still checked in')).toBeInTheDocument();
    expect(within(row).getByText('Present')).toBeInTheDocument();
  });

  it('manager-marked leave is labelled as such; status and date filters work', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by status'), 'on_leave');
    const row = await rowFor(c.name);
    expect(within(row).getByText('On leave')).toBeInTheDocument();
    expect(within(row).getByText('Marked by admin')).toBeInTheDocument();
    expect(within(row).getByText('Approved leave')).toBeInTheDocument();
    expect(within(row).getByText(dayKey(-1))).toBeInTheDocument();
    await ctx.user.selectOptions(screen.getByLabelText('Filter by status'), 'absent');
    expect(await screen.findByText('No attendance records in this range')).toBeInTheDocument(); // nobody was marked absent
  });

  it('today summary cards agree with the dashboard API', async () => {
    await loginAsToken(w.manager.email);
    renderApp('/admin/attendance');
    const api = (await call('/dashboard', { token: await loginApi(w.manager.email) })).data.attendanceToday;
    await waitFor(() => expect(screen.getByTestId('today-present')).toHaveTextContent(String(api.present + api.halfDay)));
    expect(screen.getByTestId('today-leave')).toHaveTextContent(String(api.onLeave));
    expect(screen.getByTestId('today-agents')).toHaveTextContent(String(api.totalAgents));
  });

  it('a date range with nothing recorded shows an empty state; an invalid range is refused', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await screen.findByLabelText('From');
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2020-01-07' } });
    expect(await screen.findByText('No attendance records in this range')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2019-12-31' } });
    expect(await screen.findByText('Pick a valid date range')).toBeInTheDocument();
    void ctx;
  });
});

describe('manager actions', () => {
  it('marks absence for an agent and it persists', async () => {
    const victim = await makePerson(w.adminToken, 'field_agent', `Absent Agent ${w.tag}`);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await ctx.user.click(await screen.findByRole('button', { name: /mark attendance/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Mark attendance' });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Choose an agent.')).toBeInTheDocument();
    const sel = within(dialog).getByLabelText('Agent');
    await ctx.user.selectOptions(sel, await within(sel).findByRole('option', { name: new RegExp(victim.name) }));
    fireEvent.change(within(dialog).getByLabelText('Date'), { target: { value: dayKey(-2) } });
    await ctx.user.selectOptions(within(dialog).getByLabelText('Status'), 'absent');
    await ctx.user.type(within(dialog).getByLabelText('Remarks'), 'No call, no show');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/Marked absent for/)).toBeInTheDocument();
    const list = await call(`/attendance?agentId=${victim.id}`, { token: w.adminToken });
    expect(list.data[0]).toMatchObject({ date: dayKey(-2), status: 'absent', source: 'admin', remarks: 'No call, no show' });
  });

  it('cannot overwrite a day that has a check-in: the server rule is shown', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await ctx.user.click(await screen.findByRole('button', { name: /mark attendance/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Mark attendance' });
    const sel = within(dialog).getByLabelText('Agent');
    await ctx.user.selectOptions(sel, await within(sel).findByRole('option', { name: new RegExp(a.name) }));
    await ctx.user.selectOptions(within(dialog).getByLabelText('Status'), 'absent'); // date defaults to today (org timezone)
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/already has a recorded check-in/i);
  });

  it('fixes a forgotten check-out: reason required, hours calculated, audit trail kept', async () => {
    const forgot = await makePerson(w.adminToken, 'field_agent', `Forgot Agent ${w.tag}`);
    await call(`/teams/${w.team.id}/agents`, { method: 'POST', token: w.adminToken, body: { agentIds: [forgot.id] } });
    expect((await call('/attendance/check-in', { method: 'POST', token: await loginApi(forgot.email), body: GPS })).status).toBe(201);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/attendance');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: forgot.name }));
    const row = await rowFor(forgot.name);
    await ctx.user.click(within(row).getByRole('button', { name: /fix check-out/i }));
    const dialog = await screen.findByRole('dialog', { name: new RegExp(`Fix check-out — ${forgot.name}`) });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Record check-out' }));
    expect(await within(dialog).findByText(/Explain the correction/)).toBeInTheDocument();
    await ctx.user.type(within(dialog).getByLabelText('Reason *'), 'Phone died, confirmed by team leader');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Record check-out' }));
    expect(await screen.findByText('Check-out recorded.')).toBeInTheDocument();
    await waitFor(async () => expect(within(await rowFor(forgot.name)).queryByText('Still checked in')).not.toBeInTheDocument());
    const rec = (await call(`/attendance?agentId=${forgot.id}`, { token: w.adminToken })).data[0];
    expect(rec.checkOut).toBeTruthy();
    expect(rec.remarks).toBe('Phone died, confirmed by team leader');
    const audit = await call('/audit-logs?action=attendance.correct', { token: w.adminToken });
    expect(audit.data.length).toBeGreaterThan(0);
  });
});

describe('location flags', () => {
  it('shows "outside area" and "low accuracy" flags from the geofence and accuracy rules', async () => {
    const far = await makePerson(w.adminToken, 'field_agent', `Far Agent ${w.tag}`);
    await call(`/teams/${w.team.id}/agents`, { method: 'POST', token: w.adminToken, body: { agentIds: [far.id] } });
    expect((await setSettings(w.adminToken, { geofence: { enabled: true, enforce: false, centerLatitude: 19.076, centerLongitude: 72.8777, radiusMeters: 300 } })).status).toBe(200);
    try {
      const ci = await call('/attendance/check-in', { method: 'POST', token: await loginApi(far.email), body: { latitude: 12.9716, longitude: 77.5946, accuracy: 900 } });
      expect(ci.status).toBe(201);
      await loginAsToken(w.manager.email);
      const ctx = renderApp('/admin/attendance');
      await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: far.name }));
      const row = await rowFor(far.name);
      expect(within(row).getByText(/Outside area · \d+ m/)).toBeInTheDocument();
      expect(within(row).getByText(/Low accuracy · ±900 m/)).toBeInTheDocument();
    } finally {
      await setSettings(w.adminToken, { geofence: { enabled: false, enforce: false } });
    }
  });
});

describe('team leader scoping', () => {
  it('sees only their team, read-only (no mark / fix actions)', async () => {
    await loginAsToken(w.leader.email);
    const ctx = renderApp('/admin/attendance');
    await screen.findByLabelText('Filter by status');
    await ctx.user.selectOptions(screen.getByLabelText('Filter by status'), 'present');
    await rowFor(b.name);
    expect(screen.queryByRole('button', { name: /mark attendance/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /fix check-out/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filter by team')).not.toBeInTheDocument();
    const other = await makePerson(w.adminToken, 'field_agent', `Bravo Agent ${w.tag}`);
    await call(`/teams/${w.otherTeam.id}/agents`, { method: 'POST', token: w.adminToken, body: { agentIds: [other.id] } });
    await call('/attendance/check-in', { method: 'POST', token: await loginApi(other.email), body: GPS });
    ctx.unmount();
    renderApp('/admin/attendance');
    await rowFor(b.name);
    expect((await arows()).some((r) => r.textContent?.includes(other.name))).toBe(false);
  });
});

void PASSWORD;
