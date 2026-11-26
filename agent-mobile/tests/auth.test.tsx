import { screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { authApi } from '../src/redux/services/authApi';
import { ADMIN, PASSWORD, TOKEN_KEY, call, loginApi, makePerson, renderApp, uid } from './helpers';

let adminToken: string;
let agent: { id: string; name: string; email: string };
let manager: { id: string; name: string; email: string };
let team: { id: string; name: string };
const tag = uid();

beforeAll(async () => {
  adminToken = await loginApi(ADMIN.email, ADMIN.password);
  agent = await makePerson(adminToken, 'field_agent', `Mobile Agent ${tag}`, { phone: '+91 98765 11111', targetLeadsMonthly: 20 });
  manager = await makePerson(adminToken, 'marketing_manager', `Mobile Manager ${tag}`);
  const t = await call('/teams', { method: 'POST', token: adminToken, body: { name: `Mobile Team ${tag}` } });
  team = { id: t.data.id, name: t.data.name };
  await call(`/teams/${team.id}/agents`, { method: 'POST', token: adminToken, body: { agentIds: [agent.id] } });
});

const signIn = async (ctx: ReturnType<typeof renderApp>, email: string, password = PASSWORD) => {
  await ctx.user.type(await screen.findByLabelText('Work email'), email);
  await ctx.user.type(screen.getByLabelText('Password'), password);
  await ctx.user.click(screen.getByRole('button', { name: /sign in/i }));
};

describe('agent login', () => {
  it('opens on the login screen with no fake session and no pre-filled credentials', async () => {
    renderApp('/dashboard');
    expect(await screen.findByLabelText('Work email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('validates input and shows a generic message for wrong credentials', async () => {
    const ctx = renderApp('/login');
    await ctx.user.click(await screen.findByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter your work email')).toBeInTheDocument();
    await signIn(ctx, agent.email, 'wrong-Password-1');
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('a field agent signs in with the real backend and sees their own name and team', async () => {
    const ctx = renderApp('/login');
    await signIn(ctx, agent.email);
    expect(await screen.findByText(`Welcome, ${agent.name}`)).toBeInTheDocument();
    expect(screen.getAllByText(team.name).length).toBeGreaterThan(0);
    expect(ctx.store.getState().auth.user?.role).toBe('field_agent');
    const token = window.localStorage.getItem(TOKEN_KEY);
    expect(token).toBeTruthy();
    expect((await call('/auth/me', { token: token! })).status).toBe(200);
  });

  it('a manager cannot use the mobile app: message shown, nothing stored', async () => {
    const ctx = renderApp('/login');
    await signIn(ctx, manager.email);
    expect(await screen.findByText(/for Field Agents/i)).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(ctx.store.getState().auth.status).toBe('anonymous');
  });
});

describe('session restore, guards and profile', () => {
  it('restores a stored session and the profile shows real account data (no invented numbers)', async () => {
    window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
    renderApp('/profile');
    expect(await screen.findByRole('heading', { name: agent.name })).toBeInTheDocument();
    expect(screen.getByText(agent.email)).toBeInTheDocument();
    expect(screen.getByText('+91 98765 11111')).toBeInTheDocument();
    expect(screen.getAllByText(team.name).length).toBeGreaterThan(0);
    expect(screen.getByText('Monthly target: 20 leads')).toBeInTheDocument();
    expect(screen.getAllByText(/^AGT-\d{4}$/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Preview screen/)).not.toBeInTheDocument();
  });

  it('invalid token -> login; a manager token never opens the agent app', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'garbage.token.value');
    const first = renderApp('/dashboard');
    expect(await screen.findByLabelText('Work email')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    first.unmount();

    window.localStorage.setItem(TOKEN_KEY, await loginApi(manager.email));
    renderApp('/dashboard');
    expect(await screen.findByLabelText('Work email')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('every agent screen now reads live data: no preview banners remain', async () => {
    window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
    for (const [route, heading] of [['/dashboard', /welcome/i], ['/leads', 'My leads'], ['/attendance', 'Attendance'], ['/visits', 'Customer visits']] as const) {
      const ctx = renderApp(route);
      await screen.findByRole('heading', { name: heading });
      expect(screen.queryByText(/Preview screen/)).not.toBeInTheDocument();
      ctx.unmount();
    }
  });


  it('sign out clears the device and the server revokes the token', async () => {
    window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
    const ctx = renderApp('/profile');
    await screen.findByRole('heading', { name: agent.name });
    const token = window.localStorage.getItem(TOKEN_KEY)!;
    await ctx.user.click(screen.getAllByRole('button', { name: /sign out/i })[0]);
    expect(await screen.findByLabelText('Work email')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect((await call('/auth/me', { token })).status).toBe(401);
  });

  it('when the server revokes the session (account deactivated) the next request signs the agent out', async () => {
    const victim = await makePerson(adminToken, 'field_agent', `Revoked Agent ${uid()}`);
    window.localStorage.setItem(TOKEN_KEY, await loginApi(victim.email));
    const ctx = renderApp('/profile');
    await screen.findByRole('heading', { name: victim.name });
    expect((await call(`/users/${victim.id}/status`, { method: 'PATCH', token: adminToken, body: { isActive: false } })).status).toBe(200);
    void ctx.store.dispatch(authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true }));
    await waitFor(() => expect(ctx.store.getState().auth.status).toBe('anonymous'));
    expect(await screen.findByLabelText('Work email')).toBeInTheDocument();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
