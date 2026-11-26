import { screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { Metrics, call, loginApi, loginAsToken, makeLead, renderApp, seedMetrics } from './helpers';

let m: Metrics;
beforeAll(async () => {
  m = await seedMetrics();
});

const kpi = (id: string) => screen.getByTestId(`kpi-${id}`);

describe('dashboard (live aggregates)', () => {
  it('a team leader sees exactly their team’s numbers; nothing is hardcoded or marked as preview', async () => {
    await loginAsToken(m.leader.email);
    renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads');
    expect(screen.getByTestId('dashboard-scope')).toHaveTextContent(`Your team: ${m.team.name}`);
    expect(kpi('total-leads')).toHaveTextContent('6');
    expect(kpi('converted')).toHaveTextContent('1');
    expect(kpi('conversion-rate')).toHaveTextContent('16.7%');
    expect(kpi('unassigned')).toHaveTextContent('1');
    expect(kpi('overdue')).toHaveTextContent('1');
    expect(kpi('visits-today')).toHaveTextContent('1');
    expect(kpi('attendance')).toHaveTextContent('1 / 1');
    expect(screen.getByText('4 still open')).toBeInTheDocument();
    expect(screen.getByText('1 lost')).toBeInTheDocument();
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live Tracking Active/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/1,428|Play Store/)).not.toBeInTheDocument();
  });

  it('every figure matches what the API returns for the same user', async () => {
    await loginAsToken(m.manager.email);
    renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads');
    const api = (await call('/dashboard', { token: await loginApi(m.manager.email) })).data;
    await waitFor(() => expect(kpi('total-leads')).toHaveTextContent(String(api.leads.total)));
    expect(kpi('converted')).toHaveTextContent(String(api.leads.converted));
    expect(kpi('conversion-rate')).toHaveTextContent(`${api.leads.conversionRate}%`);
    expect(kpi('unassigned')).toHaveTextContent(String(api.leads.unassigned));
    expect(kpi('overdue')).toHaveTextContent(String(api.followUps.overdue));
    expect(kpi('due-today')).toHaveTextContent(String(api.followUps.dueToday));
    expect(kpi('visits-today')).toHaveTextContent(String(api.visits.today));
    expect(kpi('attendance')).toHaveTextContent(`${api.attendanceToday.present + api.attendanceToday.halfDay} / ${api.attendanceToday.totalAgents}`);
    expect(screen.getByTestId('dashboard-scope')).toHaveTextContent('Whole organisation');
  });

  it('the manager sees at least the leader’s team data (org-wide scope is a superset)', async () => {
    await loginAsToken(m.manager.email);
    renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads');
    const total = Number(kpi('total-leads').textContent);
    expect(total).toBeGreaterThanOrEqual(6);
  });

  it('shows sources with counts and the attendance breakdown', async () => {
    await loginAsToken(m.leader.email);
    renderApp('/admin/dashboard');
    const list = await screen.findByTestId('source-list');
    expect(within(list).getByText('Referral')).toBeInTheDocument();
    expect(list.textContent).toContain('4 leads · 1 converted'); // M-A1, M-A2, M-C, M-U
    expect(list.textContent).toContain('1 leads · 0 converted'); // Field Visit and Cold Call, one each
    const att = screen.getByTestId('attendance-breakdown');
    expect(within(att).getByText('Present').nextElementSibling).toHaveTextContent('1');
    expect(within(att).getByText('Not marked yet').nextElementSibling).toHaveTextContent('0');
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
  });

  it('KPI cards link to the screens where the user can act on them', async () => {
    await loginAsToken(m.leader.email);
    renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads');
    expect(kpi('total-leads').closest('a')).toHaveAttribute('href', '/admin/leads');
    expect(kpi('overdue').closest('a')).toHaveAttribute('href', '/admin/followups');
  });

  it('Refresh pulls new data without reloading the page', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads');
    expect(kpi('total-leads')).toHaveTextContent('6');
    await makeLead(m.adminToken, { customerName: `M-extra ${m.tag}`, assignedAgentId: m.agent.id });
    await ctx.user.click(screen.getByRole('button', { name: /refresh/i }));
    await waitFor(() => expect(kpi('total-leads')).toHaveTextContent('7'));
  });

  it('a team with no data shows zeros and clear empty states instead of invented numbers', async () => {
    await loginAsToken(m.otherLeader.email);
    renderApp('/admin/dashboard');
    await screen.findByTestId('kpi-total-leads');
    expect(kpi('total-leads')).toHaveTextContent('0');
    expect(kpi('conversion-rate')).toHaveTextContent('0%');
    expect(kpi('attendance')).toHaveTextContent('0 / 0');
    expect(screen.getByText('No leads created in this period')).toBeInTheDocument();
    expect(screen.getByText('No leads yet')).toBeInTheDocument();
  });
});
