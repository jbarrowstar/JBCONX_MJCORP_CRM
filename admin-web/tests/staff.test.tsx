import { screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, PASSWORD, World, call, loginApi, loginAsToken, makePerson, renderApp, seedWorld, uid } from './helpers';

let w: World;

beforeAll(async () => {
  w = await seedWorld();
  for (let i = 1; i <= 14; i++) {
    await makePerson(w.adminToken, 'field_agent', `Pager ${w.tag} ${String(i).padStart(2, '0')}`);
  }
});

const cards = async () => await screen.findAllByTestId('staff-card');
/** Waits (polling) until a card for `name` is on screen: lists refresh asynchronously after typing in the search box. */
const cardFor = async (name: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const found = (await cards()).find((c) => c.textContent?.includes(name));
    if (!found) throw new Error(`no card for ${name}`);
    return found;
  });

describe('staff list (live data)', () => {
  it('shows real staff from the backend with roles, team, target and status', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), w.tag);
    await waitFor(async () => expect((await cards()).filter((c) => c.textContent?.includes(w.tag)).length).toBeGreaterThanOrEqual(4));
    const agent = await cardFor(w.agent.name);
    expect(within(agent).getByText('Field Agent')).toBeInTheDocument();
    expect(within(agent).getByText(w.team.name)).toBeInTheDocument();
    expect(within(agent).getByText('12 leads / month')).toBeInTheDocument();
    expect(within(agent).getByText('Active')).toBeInTheDocument();
    expect(within(agent).getByText(/^AGT-\d{4}$/)).toBeInTheDocument();
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('search narrows results; role filter works', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), `Pager ${w.tag} 03`);
    await waitFor(async () => expect((await cards()).length).toBe(1));
    expect(within((await cards())[0]).getByText(`Pager ${w.tag} 03`)).toBeInTheDocument();

    await ctx.user.clear(screen.getByLabelText('Search staff'));
    await ctx.user.type(screen.getByLabelText('Search staff'), w.tag);
    await ctx.user.selectOptions(screen.getByLabelText('Filter by role'), 'team_leader');
    await waitFor(async () => {
      const c = await cards();
      expect(c.length).toBe(2);
      c.forEach((x) => expect(within(x).getByText('Team Leader')).toBeInTheDocument());
    });
  });

  it('paginates (12 per page) using server-side paging', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), `Pager ${w.tag}`);
    // wait for the debounced search to be applied (exactly our 14 agents) before paging
    expect(await screen.findByText(/Page 1 of 2 · 14 total/)).toBeInTheDocument();
    expect((await cards()).length).toBe(12);
    await ctx.user.click(screen.getByRole('button', { name: /next/i }));
    expect(await screen.findByText(/Page 2 of 2/)).toBeInTheDocument();
    await waitFor(async () => expect((await cards()).length).toBe(2));
  });

  it('shows an empty state for no matches', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), `zzz-no-such-person-${uid()}`);
    expect(await screen.findByText('No staff found')).toBeInTheDocument();
  });

  it('a manager never sees super admin accounts', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), 'E2E Root');
    expect(await screen.findByText('No staff found')).toBeInTheDocument();
    const roleSelect = screen.getByLabelText('Filter by role');
    expect(within(roleSelect).queryByRole('option', { name: 'Super Admin' })).not.toBeInTheDocument();
  });

  it('a super admin sees their own card but gets no action buttons on it', async () => {
    await loginAsToken(ADMIN.email, ADMIN.password);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), 'E2E Root');
    const card = await cardFor('E2E Root');
    expect(within(card).getByText('Super Admin')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});

describe('creating staff', () => {
  const fill = async (ctx: ReturnType<typeof renderApp>, dialog: HTMLElement, v: { name: string; email: string; password: string }) => {
    await ctx.user.type(within(dialog).getByLabelText('Full name *'), v.name);
    await ctx.user.type(within(dialog).getByLabelText('Work email *'), v.email);
    await ctx.user.type(within(dialog).getByLabelText('Initial password *'), v.password);
  };

  it('client-side validation blocks bad input', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.click(await screen.findByRole('button', { name: /add staff member/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Add staff member' });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create account' }));
    expect(await within(dialog).findByText('Enter the full name')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter an email')).toBeInTheDocument();
    await ctx.user.type(within(dialog).getByLabelText('Initial password *'), 'weak');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create account' }));
    expect(await within(dialog).findByText('At least 10 characters')).toBeInTheDocument();
  });

  it('role choices follow the hierarchy: manager cannot create managers; super admin can', async () => {
    await loginAsToken(w.manager.email);
    const m = renderApp('/admin/staff');
    await m.user.click(await screen.findByRole('button', { name: /add staff member/i }));
    let dialog = await screen.findByRole('dialog', { name: 'Add staff member' });
    let opts = within(within(dialog).getByLabelText('Role *')).getAllByRole('option').map((o) => o.textContent);
    expect(opts).toEqual(['Team Leader', 'Field Agent']);
    m.unmount();

    await loginAsToken(ADMIN.email, ADMIN.password);
    const a = renderApp('/admin/staff');
    await a.user.click(await screen.findByRole('button', { name: /add staff member/i }));
    dialog = await screen.findByRole('dialog', { name: 'Add staff member' });
    opts = within(within(dialog).getByLabelText('Role *')).getAllByRole('option').map((o) => o.textContent);
    expect(opts).toEqual(['Marketing Manager', 'Team Leader', 'Field Agent']);
  });

  it('creates a field agent in a team; it persists in the backend and appears in the list', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.click(await screen.findByRole('button', { name: /add staff member/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Add staff member' });
    const name = `New Hire ${uid()}`;
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@e2e.test`;
    await fill(ctx, dialog, { name, email, password: PASSWORD });
    await ctx.user.type(within(dialog).getByLabelText('Phone'), '+91 90000 12345');
    await ctx.user.selectOptions(within(dialog).getByLabelText('Team'), await within(dialog).findByRole('option', { name: w.team.name }));
    await ctx.user.type(within(dialog).getByLabelText('Monthly lead target'), '8');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText(`Field Agent ${name} created.`)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const list = await call(`/users?search=${encodeURIComponent(email)}`, { token: w.adminToken });
    expect(list.data).toHaveLength(1);
    expect(list.data[0]).toMatchObject({ name, role: 'field_agent', teamId: w.team.id, targetLeadsMonthly: 8, phone: '+91 90000 12345', isActive: true });
    expect(list.data[0].employeeCode).toMatch(/^AGT-/);
    // and the new user can really sign in
    expect(await loginApi(email)).toBeTruthy();
    // list refreshed automatically
    await ctx.user.type(screen.getByLabelText('Search staff'), name);
    expect(await cardFor(name)).toBeInTheDocument();
  });

  it('server-side rejection (duplicate email) is shown in the dialog and nothing is created', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.click(await screen.findByRole('button', { name: /add staff member/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Add staff member' });
    await fill(ctx, dialog, { name: 'Duplicate Person', email: w.agent.email, password: PASSWORD });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create account' }));
    expect(await within(dialog).findByText(/already exists/i)).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Add staff member' })).toBeInTheDocument();
  });

  it('the generate button fills a password that satisfies the policy', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.click(await screen.findByRole('button', { name: /add staff member/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Add staff member' });
    await ctx.user.click(within(dialog).getByRole('button', { name: /generate/i }));
    const pw = (within(dialog).getByLabelText('Initial password *') as HTMLInputElement).value;
    expect(pw.length).toBeGreaterThanOrEqual(10);
    expect(pw).toMatch(/[A-Za-z]/);
    expect(pw).toMatch(/[0-9]/);
  });
});

describe('managing staff', () => {
  it('edit changes persist', async () => {
    const victim = await makePerson(w.adminToken, 'field_agent', `Edit Me ${uid()}`);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), victim.name);
    const card = await cardFor(victim.name);
    await ctx.user.click(within(card).getByRole('button', { name: /edit/i }));
    const dialog = await screen.findByRole('dialog', { name: `Edit ${victim.name}` });
    await ctx.user.type(within(dialog).getByLabelText('Phone'), '+91 91111 22222');
    await ctx.user.type(within(dialog).getByLabelText('Monthly lead target'), '15');
    await ctx.user.selectOptions(within(dialog).getByLabelText('Team'), await within(dialog).findByRole('option', { name: w.team.name }));
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    const got = await call(`/users/${victim.id}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ phone: '+91 91111 22222', targetLeadsMonthly: 15, teamId: w.team.id });
  });

  it('REGRESSION: editing an unrelated field never drops the agent from their team', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), w.agent.name);
    const card = await cardFor(w.agent.name);
    await ctx.user.click(within(card).getByRole('button', { name: /edit/i }));
    const dialog = await screen.findByRole('dialog', { name: `Edit ${w.agent.name}` });
    // the saved team must be pre-selected once the teams list has loaded
    await waitFor(() => expect(within(dialog).getByLabelText('Team')).toHaveValue(w.team.id));
    await ctx.user.clear(within(dialog).getByLabelText('Phone'));
    await ctx.user.type(within(dialog).getByLabelText('Phone'), '+91 97777 88888');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Changes saved.')).toBeInTheDocument();
    const got = await call(`/users/${w.agent.id}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ phone: '+91 97777 88888', teamId: w.team.id, targetLeadsMonthly: 12 });
  });

  it('deactivating asks for confirmation, signs the user out server-side, and can be undone', async () => {
    const victim = await makePerson(w.adminToken, 'field_agent', `Toggle Me ${uid()}`);
    const vToken = await loginApi(victim.email);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), victim.name);
    let card = await cardFor(victim.name);
    await ctx.user.click(within(card).getByRole('button', { name: /deactivate/i }));
    const confirm = await screen.findByRole('dialog', { name: 'Deactivate account' });
    await ctx.user.click(within(confirm).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText(`${victim.name} deactivated.`)).toBeInTheDocument();
    await waitFor(async () => expect(within(await cardFor(victim.name)).getByText('Inactive')).toBeInTheDocument());
    expect((await call('/auth/me', { token: vToken })).status).toBe(401);

    card = await cardFor(victim.name);
    await ctx.user.click(within(card).getByRole('button', { name: /^activate$/i }));
    await ctx.user.click(within(await screen.findByRole('dialog', { name: 'Activate account' })).getByRole('button', { name: 'Activate' }));
    expect(await screen.findByText(`${victim.name} activated.`)).toBeInTheDocument();
    expect(await loginApi(victim.email)).toBeTruthy();
  });

  it('reset password works and the new password is what the user must use', async () => {
    const victim = await makePerson(w.adminToken, 'field_agent', `Reset Me ${uid()}`);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), victim.name);
    const card = await cardFor(victim.name);
    await ctx.user.click(within(card).getByRole('button', { name: /reset password/i }));
    const dialog = await screen.findByRole('dialog', { name: `Reset password — ${victim.name}` });
    await ctx.user.type(within(dialog).getByLabelText('New password'), 'Brand-New-Pass-77');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Reset password' }));
    expect(await screen.findByText(/Password reset for/)).toBeInTheDocument();
    expect((await call('/auth/login', { method: 'POST', body: { email: victim.email, password: PASSWORD } })).status).toBe(401);
    expect(await loginApi(victim.email, 'Brand-New-Pass-77')).toBeTruthy();
  });

  it('a sitting team leader cannot be deactivated: the backend rule is surfaced to the user', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), w.leader.name);
    const card = await cardFor(w.leader.name);
    await ctx.user.click(within(card).getByRole('button', { name: /deactivate/i }));
    await ctx.user.click(within(await screen.findByRole('dialog', { name: 'Deactivate account' })).getByRole('button', { name: 'Deactivate' }));
    expect(await screen.findByText(/Remove this user as team leader/)).toBeInTheDocument();
    expect((await call(`/users/${w.leader.id}`, { token: w.adminToken })).data.isActive).toBe(true);
  });
});

describe('team leader view', () => {
  it('is read-only and limited to their own team', async () => {
    await loginAsToken(w.leader.email);
    const ctx = renderApp('/admin/staff');
    await ctx.user.type(await screen.findByLabelText('Search staff'), w.tag);
    await waitFor(async () => expect((await cards()).length).toBe(2));
    const names = (await cards()).map((c) => c.textContent ?? '');
    expect(names.some((n) => n.includes(w.leader.name))).toBe(true);
    expect(names.some((n) => n.includes(w.agent.name))).toBe(true);
    expect(names.some((n) => n.includes(w.otherLeader.name))).toBe(false);
    expect(screen.queryByRole('button', { name: /add staff member/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Filter by team')).not.toBeInTheDocument();
  });
});
