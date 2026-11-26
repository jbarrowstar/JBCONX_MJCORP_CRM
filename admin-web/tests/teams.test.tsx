import { screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { World, call, loginAsToken, makePerson, renderApp, seedWorld, uid } from './helpers';

let w: World;
beforeAll(async () => {
  w = await seedWorld();
});

const teamCard = async (name: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const found = (await screen.findAllByTestId('team-card')).find((c) => c.textContent?.includes(name));
    if (!found) throw new Error(`no team card for ${name}`);
    return found;
  });

describe('team list (live data)', () => {
  it('shows real teams with leader and counts; search filters server-side', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.type(await screen.findByLabelText('Search teams'), w.tag);
    const alpha = await teamCard(w.team.name);
    expect(within(alpha).getByText(w.leader.name)).toBeInTheDocument();
    expect(within(alpha).getByText('Agents').nextElementSibling).toHaveTextContent('1');
    await waitFor(async () => expect((await screen.findAllByTestId('team-card')).length).toBe(2));
    await ctx.user.clear(screen.getByLabelText('Search teams'));
    await ctx.user.type(screen.getByLabelText('Search teams'), `no-such-team-${uid()}`);
    expect(await screen.findByText('No teams match your search')).toBeInTheDocument();
  });
});

describe('creating and editing teams', () => {
  it('creates a team with a free leader (leaders already leading a team are not offered)', async () => {
    const freeLeader = await makePerson(w.adminToken, 'team_leader', `Free Leader ${uid()}`);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.click(await screen.findByRole('button', { name: /create team/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Create team' });
    const select = within(dialog).getByLabelText('Team leader');
    await within(dialog).findByRole('option', { name: new RegExp(freeLeader.name) });
    expect(within(select).queryByRole('option', { name: new RegExp(w.leader.name) })).not.toBeInTheDocument();

    const name = `Charlie ${uid()}`;
    await ctx.user.type(within(dialog).getByLabelText('Team name *'), name);
    await ctx.user.type(within(dialog).getByLabelText('Description'), 'Created from the UI');
    await ctx.user.selectOptions(select, await within(dialog).findByRole('option', { name: new RegExp(freeLeader.name) }));
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create team' }));
    expect(await screen.findByText(`Team "${name}" created.`)).toBeInTheDocument();

    const list = await call(`/teams?search=${encodeURIComponent(name)}`, { token: w.adminToken });
    expect(list.data[0]).toMatchObject({ name, description: 'Created from the UI', leaderId: freeLeader.id });
    // the leader's account now points at the team
    expect((await call(`/users/${freeLeader.id}`, { token: w.adminToken })).data.teamId).toBe(list.data[0].id);
    await ctx.user.type(await screen.findByLabelText('Search teams'), name);
    expect(await teamCard(name)).toBeInTheDocument();
  });

  it('validation and server conflicts are shown to the user', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.click(await screen.findByRole('button', { name: /create team/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Create team' });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create team' }));
    expect(await within(dialog).findByText(/Enter a team name/)).toBeInTheDocument();

    await ctx.user.type(within(dialog).getByLabelText('Team name *'), w.team.name.toUpperCase()); // case-insensitive duplicate
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create team' }));
    expect(await within(dialog).findAllByText(/already exists/i)).not.toHaveLength(0);
    expect(screen.getByRole('dialog', { name: 'Create team' })).toBeInTheDocument();
  });

  it('editing keeps the current leader selected and saves changes', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.type(await screen.findByLabelText('Search teams'), w.otherTeam.name);
    const card = await teamCard(w.otherTeam.name);
    await ctx.user.click(within(card).getByRole('button', { name: `Edit ${w.otherTeam.name}` }));
    const dialog = await screen.findByRole('dialog', { name: `Edit ${w.otherTeam.name}` });
    await waitFor(() => expect(within(dialog).getByLabelText('Team leader')).toHaveValue(w.otherLeader.id)); // async options, still selected
    await ctx.user.type(within(dialog).getByLabelText('Description'), 'Updated description');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Team updated.')).toBeInTheDocument();
    const got = await call(`/teams/${w.otherTeam.id}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ description: 'Updated description', leaderId: w.otherLeader.id });
  });
});

describe('roster', () => {
  it('adds and removes agents; changes persist and counts refresh', async () => {
    const freeAgent = await makePerson(w.adminToken, 'field_agent', `Free Agent ${uid()}`);
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.type(await screen.findByLabelText('Search teams'), w.team.name);
    const card = await teamCard(w.team.name);
    await ctx.user.click(within(card).getByRole('button', { name: /manage roster/i }));
    const dialog = await screen.findByRole('dialog', { name: `${w.team.name} — roster` });
    const list = await within(dialog).findByTestId('roster-list');
    expect(within(list).getByText(w.leader.name)).toBeInTheDocument();
    expect(within(list).getByText(w.agent.name)).toBeInTheDocument();

    await ctx.user.click(within(dialog).getByRole('button', { name: /add agents/i }));
    const box = await within(dialog).findByLabelText(new RegExp(freeAgent.name));
    await ctx.user.click(box);
    await ctx.user.click(within(dialog).getByRole('button', { name: /add 1 selected/i }));
    expect(await screen.findByText(/1 agent\(s\) added/)).toBeInTheDocument();
    await waitFor(() => expect(within(within(dialog).getByTestId('roster-list')).getByText(freeAgent.name)).toBeInTheDocument());
    expect((await call(`/users/${freeAgent.id}`, { token: w.adminToken })).data.teamId).toBe(w.team.id);

    await ctx.user.click(within(dialog).getByRole('button', { name: `Remove ${freeAgent.name} from team` }));
    expect(await screen.findByText(new RegExp(`${freeAgent.name} removed`))).toBeInTheDocument();
    await waitFor(() => expect(within(within(dialog).getByTestId('roster-list')).queryByText(freeAgent.name)).not.toBeInTheDocument());
    expect((await call(`/users/${freeAgent.id}`, { token: w.adminToken })).data.teamId).toBeNull();
  });
});

describe('deleting teams', () => {
  it('a team with agents cannot be deleted: the server message is shown and the team stays', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.type(await screen.findByLabelText('Search teams'), w.team.name);
    const card = await teamCard(w.team.name);
    await ctx.user.click(within(card).getByRole('button', { name: `Delete ${w.team.name}` }));
    await ctx.user.click(within(await screen.findByRole('dialog', { name: 'Delete team' })).getByRole('button', { name: 'Delete team' }));
    expect(await screen.findByText(/Remove the 1 assigned agent/)).toBeInTheDocument();
    expect((await call(`/teams/${w.team.id}`, { token: w.adminToken })).status).toBe(200);
  });

  it('an empty team can be deleted', async () => {
    const name = `Disposable ${uid()}`;
    const made = await call('/teams', { method: 'POST', token: w.adminToken, body: { name } });
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/teams');
    await ctx.user.type(await screen.findByLabelText('Search teams'), name);
    const card = await teamCard(name);
    await ctx.user.click(within(card).getByRole('button', { name: `Delete ${name}` }));
    await ctx.user.click(within(await screen.findByRole('dialog', { name: 'Delete team' })).getByRole('button', { name: 'Delete team' }));
    expect(await screen.findByText(`Team "${name}" deleted.`)).toBeInTheDocument();
    expect((await call(`/teams/${made.data.id}`, { token: w.adminToken })).status).toBe(404);
  });
});

describe('team leader view', () => {
  it('sees only their own team, read-only', async () => {
    await loginAsToken(w.leader.email);
    renderApp('/admin/teams');
    const card = await teamCard(w.team.name);
    expect((await screen.findAllByTestId('team-card')).length).toBe(1);
    expect(screen.queryByText(w.otherTeam.name)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /create team/i })).not.toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /^edit/i })).not.toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: /^delete/i })).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: /view roster/i })).toBeInTheDocument();
    expect(screen.queryByLabelText('Search teams')).not.toBeInTheDocument();
  });

  it('can view the roster but has no add/remove controls', async () => {
    await loginAsToken(w.leader.email);
    const ctx = renderApp('/admin/teams');
    const card = await teamCard(w.team.name);
    await ctx.user.click(within(card).getByRole('button', { name: /view roster/i }));
    const dialog = await screen.findByRole('dialog', { name: `${w.team.name} — roster` });
    expect(await within(dialog).findByText(w.agent.name)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /add agents/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });
});
