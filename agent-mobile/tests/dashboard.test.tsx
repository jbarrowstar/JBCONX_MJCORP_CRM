import { screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, TOKEN_KEY, call, loginApi, makeFollowUp, makeLead, makePerson, minutesFromNow, renderApp, uid } from './helpers';

const tag = uid();
let adminToken: string;
let agent: { id: string; name: string; email: string };
let fresh: { id: string; name: string; email: string };

beforeAll(async () => {
  adminToken = await loginApi(ADMIN.email, ADMIN.password);
  agent = await makePerson(adminToken, 'field_agent', `Dash Agent ${tag}`, { targetLeadsMonthly: 12 });
  fresh = await makePerson(adminToken, 'field_agent', `Fresh Agent ${tag}`);
  const team = await call('/teams', { method: 'POST', token: adminToken, body: { name: `Dash Team ${tag}` } });
  await call(`/teams/${team.data.id}/agents`, { method: 'POST', token: adminToken, body: { agentIds: [agent.id] } });

  const a = await makeLead(adminToken, { customerName: `D1 ${tag}`, assignedAgentId: agent.id });
  await makeLead(adminToken, { customerName: `D2 ${tag}`, assignedAgentId: agent.id });
  const v = await makeLead(adminToken, { customerName: `D3 ${tag}`, assignedAgentId: agent.id });
  const c = await makeLead(adminToken, { customerName: `D4 ${tag}`, assignedAgentId: agent.id });
  const l = await makeLead(adminToken, { customerName: `D5 ${tag}`, assignedAgentId: agent.id });
  await call(`/leads/${c.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'converted' } });
  await call(`/leads/${l.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'lost', lostReason: 'No budget' } });
  const done = await makeFollowUp(adminToken, a.id, minutesFromNow(-4), 'call');
  await call(`/followups/${done.id}/complete`, { method: 'POST', token: adminToken, body: {} });
  await makeFollowUp(adminToken, a.id, minutesFromNow(-3), 'demo');
  const agentToken = await loginApi(agent.email);
  const gps = { latitude: 12.97, longitude: 77.59, accuracy: 10 };
  await call('/attendance/check-in', { method: 'POST', token: agentToken, body: gps });
  await call('/visits', { method: 'POST', token: agentToken, body: { leadId: v.id, ...gps, notes: 'Showed brochure', outcome: 'interested' } });
});

const tile = (id: string) => screen.getByTestId(`tile-${id}`);

describe('agent dashboard (live data)', () => {
  it('shows this agent’s own numbers, target progress and 30-day activity', async () => {
    window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
    renderApp('/dashboard');
    await screen.findByTestId('tile-open');
    expect(screen.getByText(`Welcome, ${agent.name}`)).toBeInTheDocument();
    expect(tile('open')).toHaveTextContent('3');          // 5 leads - 1 converted - 1 lost
    expect(tile('converted')).toHaveTextContent('1');
    expect(tile('lost')).toHaveTextContent('1');
    expect(screen.getByText('20% conversion')).toBeInTheDocument();
    expect(tile('overdue')).toHaveTextContent('1');
    expect(tile('visits-today')).toHaveTextContent('1');
    expect(screen.getByTestId('overdue-banner')).toHaveTextContent('1 overdue follow-up');
    expect(screen.getByTestId('attendance-state')).toHaveTextContent('Checked in today');
    expect(screen.getByTestId('target-converted')).toHaveTextContent('1');
    expect(screen.getByTestId('target-progress')).toHaveTextContent('8.3% of target');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '8.3');
    const act = await screen.findByTestId('activity-30d');
    await within(act).findByTestId('act-won');
    expect(within(act).getByTestId('act-won')).toHaveTextContent('1');
    expect(within(act).getByTestId('act-visits')).toHaveTextContent('1');
    expect(within(act).getByTestId('act-followups')).toHaveTextContent('1');
    expect(within(act).getByTestId('act-days')).toHaveTextContent('1');
    expect(screen.queryByText(/Preview screen/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Northern Squad/)).not.toBeInTheDocument();
  });

  it('matches the API exactly', async () => {
    const token = await loginApi(agent.email);
    window.localStorage.setItem(TOKEN_KEY, token);
    renderApp('/dashboard');
    await screen.findByTestId('tile-open');
    const api = (await call('/dashboard', { token })).data;
    expect(tile('open')).toHaveTextContent(String(api.leads.pending));
    expect(tile('due-today')).toHaveTextContent(String(api.followUps.dueToday));
    expect(screen.getByTestId('target-progress')).toHaveTextContent(`${api.personal.targetProgress}% of target`);
  });

  it('the overdue banner opens My leads', async () => {
    window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
    const ctx = renderApp('/dashboard');
    await ctx.user.click(await screen.findByTestId('overdue-banner'));
    expect(await screen.findByRole('heading', { name: 'My leads' })).toBeInTheDocument();
  });

  it('a new agent with no data and no target sees zeros and an honest message, not sample numbers', async () => {
    window.localStorage.setItem(TOKEN_KEY, await loginApi(fresh.email));
    renderApp('/dashboard');
    await screen.findByTestId('tile-open');
    expect(tile('open')).toHaveTextContent('0');
    expect(tile('converted')).toHaveTextContent('0');
    expect(screen.queryByTestId('overdue-banner')).not.toBeInTheDocument();
    expect(screen.getByTestId('attendance-state')).toHaveTextContent('Not checked in yet');
    expect(screen.getByText(/No monthly target has been set for you/)).toBeInTheDocument();
    expect(screen.getAllByText('No team yet').length).toBeGreaterThan(0);
  });
});
