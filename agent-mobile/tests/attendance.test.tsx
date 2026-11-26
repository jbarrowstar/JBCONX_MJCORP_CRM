import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, GEO, TOKEN_KEY, call, dayKey, loginApi, makePerson, mockGeolocation, renderApp, setSettings, uid } from './helpers';

const tag = uid();
let adminToken: string;
let n = 0;

beforeAll(async () => {
  adminToken = await loginApi(ADMIN.email, ADMIN.password);
});
afterEach(() => mockGeolocation('ok'));

/** Every test gets its own agent: there is only one attendance record per agent per day. */
const freshAgent = async () => {
  const a = await makePerson(adminToken, 'field_agent', `Att Agent ${tag} ${++n}`);
  window.localStorage.setItem(TOKEN_KEY, await loginApi(a.email));
  return a;
};
const mine = async (email: string) => (await call('/attendance/today', { token: await loginApi(email) })).data;

describe('attendance (live data, deterministic GPS)', () => {
  it('starts as "Not checked in"; check in records the real coordinates; then check out completes the shift', async () => {
    const a = await freshAgent();
    mockGeolocation('ok');
    const ctx = renderApp('/attendance');
    expect(await screen.findByTestId('attendance-status')).toHaveTextContent('Not checked in');
    expect(screen.queryByText(/Preview screen/)).not.toBeInTheDocument();

    await ctx.user.click(screen.getByRole('button', { name: /check in/i }));
    expect(await screen.findByText('You are checked in.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('attendance-status')).toHaveTextContent('You are checked in'));
    const rec = await mine(a.email);
    expect(rec.isOpen).toBe(true);
    expect(rec.checkIn).toMatchObject({ latitude: GEO.latitude, longitude: GEO.longitude, accuracy: GEO.accuracy });

    await ctx.user.click(await screen.findByRole('button', { name: /check out/i }));
    await waitFor(() => expect(screen.getByTestId('attendance-status')).toHaveTextContent('Shift completed'));
    expect(screen.queryByRole('button', { name: /check in|check out/i })).not.toBeInTheDocument();
    const done = await mine(a.email);
    expect(done).toMatchObject({ isOpen: false, status: 'half_day' });
    expect(done.checkOut.latitude).toBe(GEO.latitude);
    // history lists today
    const row = await screen.findByTestId('attendance-history-row');
    expect(row).toHaveTextContent(dayKey(0));
    expect(within(row).getByText('Half day')).toBeInTheDocument();
  });

  it('restores state from the server: an agent who is already checked in sees it (and can check out)', async () => {
    const a = await freshAgent();
    const t = await loginApi(a.email);
    expect((await call('/attendance/check-in', { method: 'POST', token: t, body: GEO })).status).toBe(201);
    renderApp('/attendance');
    await waitFor(() => expect(screen.getByTestId('attendance-status')).toHaveTextContent('You are checked in'));
    expect(screen.getByRole('button', { name: /check out/i })).toBeInTheDocument();
  });

  it('permission denied: honest message, no record is created, and retrying after allowing works', async () => {
    const a = await freshAgent();
    mockGeolocation('denied');
    const ctx = renderApp('/attendance');
    await ctx.user.click(await screen.findByRole('button', { name: /check in/i }));
    const problem = await screen.findByTestId('attendance-problem');
    expect(problem).toHaveTextContent(/permission was denied/i);
    expect(within(problem).queryByRole('button', { name: /continue without location/i })).not.toBeInTheDocument(); // org requires GPS
    expect(problem).toHaveTextContent(/requires a location/i);
    expect(await mine(a.email)).toBeNull();

    mockGeolocation('ok');
    await ctx.user.click(within(problem).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByTestId('attendance-status')).toHaveTextContent('You are checked in'));
    expect((await mine(a.email)).isOpen).toBe(true);
  });

  it('unsupported device and timeout are reported distinctly (never a faked location)', async () => {
    await freshAgent();
    mockGeolocation('unsupported');
    const ctx = renderApp('/attendance');
    await ctx.user.click(await screen.findByRole('button', { name: /check in/i }));
    expect(await screen.findByTestId('attendance-problem')).toHaveTextContent(/cannot provide a location/i);
    mockGeolocation('timeout');
    await ctx.user.click(within(screen.getByTestId('attendance-problem')).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(screen.getByTestId('attendance-problem')).toHaveTextContent(/took too long/i));
  });

  it('when the organisation does not require GPS the agent may continue without it; the record has no coordinates', async () => {
    expect((await setSettings(adminToken, { attendance: { requireLocation: false } })).status).toBe(200);
    try {
      const a = await freshAgent();
      mockGeolocation('denied');
      const ctx = renderApp('/attendance');
      await ctx.user.click(await screen.findByRole('button', { name: /check in/i }));
      const problem = await screen.findByTestId('attendance-problem');
      await ctx.user.click(await within(problem).findByRole('button', { name: /continue without location/i }));
      await waitFor(() => expect(screen.getByTestId('attendance-status')).toHaveTextContent('You are checked in'));
      const rec = await mine(a.email);
      expect(rec.checkIn.latitude).toBeUndefined();
      expect(rec.checkIn.at).toBeTruthy();
    } finally {
      await setSettings(adminToken, { attendance: { requireLocation: true } });
    }
  });

  it('a geofence refusal from the server is shown to the agent and nothing is recorded', async () => {
    expect((await setSettings(adminToken, { geofence: { enabled: true, enforce: true, centerLatitude: 19.076, centerLongitude: 72.8777, radiusMeters: 200 } })).status).toBe(200);
    try {
      const a = await freshAgent();
      mockGeolocation('ok'); // Bengaluru: far from the configured office in Mumbai
      const ctx = renderApp('/attendance');
      await ctx.user.click(await screen.findByRole('button', { name: /check in/i }));
      expect(await screen.findByTestId('attendance-problem')).toHaveTextContent(/outside the allowed area/i);
      expect(await mine(a.email)).toBeNull();
    } finally {
      await setSettings(adminToken, { geofence: { enabled: false, enforce: false } });
    }
  });

  it('shows days marked by a manager (leave) in the history and as today’s status when marked for today', async () => {
    const a = await freshAgent();
    await call('/attendance/mark', { method: 'POST', token: adminToken, body: { agentId: a.id, date: dayKey(-1), status: 'on_leave', remarks: 'Approved leave' } });
    await call('/attendance/mark', { method: 'POST', token: adminToken, body: { agentId: a.id, date: dayKey(0), status: 'absent' } });
    renderApp('/attendance');
    await waitFor(() => expect(screen.getByTestId('attendance-status')).toHaveTextContent(/Marked absent by your manager/));
    expect(screen.queryByRole('button', { name: /check in/i })).not.toBeInTheDocument();
    const rows = await screen.findAllByTestId('attendance-history-row');
    expect(rows.some((r) => r.textContent?.includes('On leave') && r.textContent?.includes('Approved leave'))).toBe(true);
  });
});
