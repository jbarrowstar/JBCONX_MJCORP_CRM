import { screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD, TOKEN_KEY, World, call, loginApi, renderApp, seedWorld, signInViaUi, uid } from './helpers';

let w: World;
beforeAll(async () => {
  w = await seedWorld();
});

const createManager = async () => {
  const name = `Temp Manager ${uid()}`;
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@e2e.test`;
  const r = await call('/users', { method: 'POST', token: w.adminToken, body: { name, email, password: PASSWORD, role: 'marketing_manager' } });
  return { id: r.data.id as string, email };
};

describe('login screen', () => {
  it('starts on the login page when there is no session (no fake logged-in user)', async () => {
    renderApp('/admin/dashboard');
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toHaveValue(''); // no pre-filled demo credentials
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('validates the form before calling the server', async () => {
    const ctx = renderApp('/login');
    await ctx.user.click(await screen.findByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter your work email')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    await ctx.user.type(screen.getByLabelText('Work email'), 'not-an-email');
    await ctx.user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('wrong password shows a generic error and stores nothing', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.manager.email, 'wrong-Password-1');
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(ctx.store.getState().auth.status).toBe('anonymous');
  });

  it('unknown account gets the same message as a wrong password', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, 'ghost@e2e.test', 'Whatever-Pass-1');
    expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
  });

  it('a manager signs in with the real backend and lands on the dashboard; token kept for the tab only', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.manager.email);
    expect(await screen.findByText('Marketing Manager', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getAllByText(w.manager.name).length).toBeGreaterThan(0);
    const token = window.sessionStorage.getItem(TOKEN_KEY);
    expect(token).toBeTruthy();
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(ctx.store.getState().auth.user?.role).toBe('marketing_manager');
    // the token really is a valid server session
    expect((await call('/auth/me', { token: token! })).status).toBe(200);
  });

  it('"keep me signed in" persists the token in localStorage', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.manager.email, PASSWORD, { remember: true });
    await screen.findByText('Marketing Manager', { selector: 'span' });
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeTruthy();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('a field agent cannot use the admin web: message shown, nothing stored', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.agent.email);
    expect(await screen.findByText(/for the Field Agent mobile app/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(ctx.store.getState().auth.status).toBe('anonymous');
    expect(screen.queryByText('Staff Management')).not.toBeInTheDocument();
  });
});

describe('session restore and route guards', () => {
  it('a stored valid token restores the session on reload without showing the login page', async () => {
    window.sessionStorage.setItem(TOKEN_KEY, await loginApi(w.manager.email));
    renderApp('/admin/staff');
    expect(await screen.findByRole('heading', { name: 'Staff Management' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Work email')).not.toBeInTheDocument();
  });

  it('a stored invalid token is discarded and the user is sent to login', async () => {
    window.sessionStorage.setItem(TOKEN_KEY, 'not.a.real.token');
    const ctx = renderApp('/admin/staff');
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(ctx.store.getState().auth.status).toBe('anonymous');
  });

  it('a stored token belonging to a field agent never opens the admin app', async () => {
    window.sessionStorage.setItem(TOKEN_KEY, await loginApi(w.agent.email));
    renderApp('/admin/dashboard');
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('anonymous users are redirected from protected routes', async () => {
    renderApp('/admin/teams');
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument();
  });

  it('navigation is role based: manager sees Settings, team leader does not and is redirected away from it', async () => {
    window.sessionStorage.setItem(TOKEN_KEY, await loginApi(w.manager.email));
    const m = renderApp('/admin/dashboard');
    const nav = await screen.findByRole('navigation');
    expect(within(nav).getByText('Settings')).toBeInTheDocument();
    expect(within(nav).getByText('Staff Management')).toBeInTheDocument();
    m.unmount();

    window.sessionStorage.setItem(TOKEN_KEY, await loginApi(w.leader.email));
    renderApp('/admin/settings');
    const nav2 = await screen.findByRole('navigation');
    expect(within(nav2).queryByText('Settings')).not.toBeInTheDocument();
    expect(await screen.findByText(/Dashboard/, { selector: 'span' })).toBeInTheDocument(); // redirected to the dashboard
    expect(screen.queryByRole('heading', { name: /settings/i })).not.toBeInTheDocument();
  });

  it('sample-data screens carry a visible preview banner; live screens do not', async () => {
    window.sessionStorage.setItem(TOKEN_KEY, await loginApi(w.manager.email));
    const ctx = renderApp('/admin/tracking');
    expect(await screen.findByText(/Preview screen\./)).toBeInTheDocument();
    ctx.unmount();
    renderApp('/admin/leads');
    await screen.findByRole('heading', { name: 'Lead Management' });
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('the fabricated store-downloads card and the fake notification are gone', async () => {
    window.sessionStorage.setItem(TOKEN_KEY, await loginApi(w.manager.email));
    renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads'); // the dashboard now shows live aggregates
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Play Store/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apex Solutions/i)).not.toBeInTheDocument();
  });

});

describe('sign out and revoked sessions', () => {
  it('sign out clears the stored token, returns to login and the server revokes the token', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.manager.email);
    await screen.findByText('Marketing Manager', { selector: 'span' });
    const token = window.sessionStorage.getItem(TOKEN_KEY)!;
    await ctx.user.click(screen.getByTitle('Sign out'));
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect((await call('/auth/me', { token })).status).toBe(401);
  });

  it('when the server revokes the session mid-use (account deactivated) the app signs the user out', async () => {
    const victim = await createManager();
    const ctx = renderApp('/login');
    await signInViaUi(ctx, victim.email);
    await screen.findByText('Marketing Manager', { selector: 'span' });
    const off = await call(`/users/${victim.id}/status`, { method: 'PATCH', token: w.adminToken, body: { isActive: false } });
    expect(off.status).toBe(200);
    // any further request now fails with 401 and must drop the session
    await ctx.user.click(within(screen.getByRole('navigation')).getByText('Team Management'));
    await waitFor(() => expect(ctx.store.getState().auth.status).toBe('anonymous'));
    expect(await screen.findByRole('heading', { name: /sign in to your workspace/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('the backend refuses to deactivate a sitting team leader (UI shows it; covered in staff tests)', async () => {
    const off = await call(`/users/${w.leader.id}/status`, { method: 'PATCH', token: w.adminToken, body: { isActive: false } });
    expect(off.status).toBe(409);
  });
});

describe('change password', () => {
  it('rejects a wrong current password, accepts the right one, keeps this session and revokes the old token', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.manager.email);
    await screen.findByText('Marketing Manager', { selector: 'span' });
    const oldToken = window.sessionStorage.getItem(TOKEN_KEY)!;

    await ctx.user.click(screen.getByLabelText('Change password'));
    const dialog = await screen.findByRole('dialog', { name: 'Change password' });
    await ctx.user.type(within(dialog).getByLabelText('Current password'), 'wrong-current-1');
    await ctx.user.type(within(dialog).getByLabelText('New password'), 'Another-Pass-2026');
    await ctx.user.type(within(dialog).getByLabelText('Confirm new password'), 'Another-Pass-2026');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Change password' }));
    expect((await within(dialog).findAllByText('Current password is incorrect')).length).toBeGreaterThan(0);

    await ctx.user.clear(within(dialog).getByLabelText('Current password'));
    await ctx.user.type(within(dialog).getByLabelText('Current password'), PASSWORD);
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText(/Password changed/)).toBeInTheDocument();

    const newToken = window.sessionStorage.getItem(TOKEN_KEY)!;
    expect(newToken).not.toBe(oldToken);
    expect((await call('/auth/me', { token: oldToken })).status).toBe(401);
    expect((await call('/auth/me', { token: newToken })).status).toBe(200);
    expect(ctx.store.getState().auth.status).toBe('authenticated');
    // restore the original password so other tests in this world keep working
    await call(`/users/${w.manager.id}/reset-password`, { method: 'POST', token: w.adminToken, body: { newPassword: PASSWORD } });
  });

  it('client-side policy: weak or mismatching passwords never reach the server', async () => {
    const ctx = renderApp('/login');
    await signInViaUi(ctx, w.manager.email);
    await screen.findByText('Marketing Manager', { selector: 'span' });
    await ctx.user.click(screen.getByLabelText('Change password'));
    const dialog = await screen.findByRole('dialog', { name: 'Change password' });
    await ctx.user.type(within(dialog).getByLabelText('Current password'), PASSWORD);
    await ctx.user.type(within(dialog).getByLabelText('New password'), 'short');
    await ctx.user.type(within(dialog).getByLabelText('Confirm new password'), 'different');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Change password' }));
    expect(await within(dialog).findByText('At least 10 characters')).toBeInTheDocument();
    expect(within(dialog).getByText('Passwords do not match')).toBeInTheDocument();
  });
});
