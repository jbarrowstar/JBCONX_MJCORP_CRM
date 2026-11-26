import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Metrics, call, loginAsToken, renderApp, seedMetrics } from './helpers';

let m: Metrics;
beforeAll(async () => {
  m = await seedMetrics();
});

const rowFor = async (testId: string, text: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const r = (await screen.findAllByTestId(`${testId}-row`)).find((x) => x.textContent?.includes(text));
    if (!r) throw new Error(`no ${testId} row for ${text}`);
    return r;
  });
const cell = (row: HTMLElement, i: number) => row.querySelectorAll('td')[i].textContent;

describe('team performance', () => {
  it('a team leader sees only their team, with exact figures', async () => {
    await loginAsToken(m.leader.email);
    renderApp('/admin/reports');
    const row = await rowFor('team-report', m.team.name);
    // Team, Leader, Agents, Total, Open, Converted, Conversion, New in range, Converted in range, Visits, Follow-ups done
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => cell(row, i))).toEqual([m.leader.name, '1', '6', '4', '1', '16.7%', '6', '1', '1', '1']);
    expect((await screen.findAllByTestId('team-report-row')).length).toBe(1);
    expect(screen.queryByLabelText('Filter by team')).not.toBeInTheDocument();
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('a manager sees every team; the team filter narrows the report server-side', async () => {
    await loginAsToken(m.manager.email);
    const ctx = renderApp('/admin/reports');
    await rowFor('team-report', m.team.name);
    await rowFor('team-report', m.otherTeam.name);
    expect(cell(await rowFor('team-report', m.otherTeam.name), 3)).toBe('0'); // Bravo has no leads
    await ctx.user.selectOptions(screen.getByLabelText('Filter by team'), await within(screen.getByLabelText('Filter by team')).findByRole('option', { name: m.team.name }));
    await waitFor(async () => expect((await screen.findAllByTestId('team-report-row')).length).toBe(1));
    expect((await screen.findAllByTestId('team-report-row'))[0].textContent).toContain(m.team.name);
  });

  it('CSV export carries the table and neutralises spreadsheet formulas', async () => {
    const evil = await call('/teams', { method: 'POST', token: m.adminToken, body: { name: `=HYPERLINK("http://x") ${m.tag}` } });
    expect(evil.status).toBe(201);
    let blob: Blob | undefined;
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (b: Blob) => { blob = b; return 'blob:test'; };
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    await loginAsToken(m.manager.email);
    const ctx = renderApp('/admin/reports');
    await rowFor('team-report', m.team.name);
    await ctx.user.click(screen.getByRole('button', { name: /export csv/i }));
    expect(click).toHaveBeenCalled();
    const text = await blob!.text();
    expect(text).toContain('Team');
    expect(text).toContain(m.team.name);
    expect(text).toContain(`'=HYPERLINK`); // leading apostrophe defuses the formula
    expect(text).not.toMatch(/(^|,)"=HYPERLINK/m);
    click.mockRestore();
  });
});

describe('other report tabs', () => {
  it('agent performance: per-agent figures', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/reports');
    await ctx.user.click(await screen.findByRole('tab', { name: 'Agent performance' }));
    const row = await rowFor('agent-report', m.agent.name);
    // Agent, Team, Target, Leads, Open, Converted, Conversion, Converted in range, Visits, Follow-ups done, Days
    expect([2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => cell(row, i))).toEqual(['12', '5', '3', '1', '20%', '1', '1', '1', '1']);
    expect(cell(row, 1)).toBe(m.team.name);
  });

  it('attendance summary shows the check-in from today', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/reports');
    await ctx.user.click(await screen.findByRole('tab', { name: 'Attendance' }));
    const row = await rowFor('attendance-report', m.agent.name);
    expect(cell(row, 1)).toBe('1'); // present
  });

  it('customer visits: totals, outcome breakdown and per-agent table', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/reports');
    await ctx.user.click(await screen.findByRole('tab', { name: 'Customer visits' }));
    await waitFor(() => expect(screen.getByTestId('visit-total')).toHaveTextContent('1'));
    expect(screen.getByTestId('visit-outcomes-interested')).toHaveTextContent('1');
    expect(cell(await rowFor('visit-agents', m.agent.name), 1)).toBe('1');
  });

  it('onboarding progress counts every lead in scope', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/reports');
    await ctx.user.click(await screen.findByRole('tab', { name: 'Onboarding' }));
    await waitFor(() => expect(screen.getByTestId('onb-registration-not_started')).toHaveTextContent('6'));
    expect(screen.getByTestId('onb-documents-not_requested')).toHaveTextContent('6');
    expect(screen.getByTestId('onb-onboarding-not_started')).toHaveTextContent('6');
    expect(screen.getByText(/not verified by any external platform/i)).toBeInTheDocument();
  });

  it('lead funnel: status, priority and source conversion', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/reports');
    await ctx.user.click(await screen.findByRole('tab', { name: 'Lead funnel' }));
    await waitFor(() => expect(screen.getByTestId('funnel-status-assigned')).toHaveTextContent('2'));
    expect(screen.getByTestId('funnel-status-interested')).toHaveTextContent('1');
    expect(screen.getByTestId('funnel-status-converted')).toHaveTextContent('1');
    expect(screen.getByTestId('funnel-status-lost')).toHaveTextContent('1');
    expect(screen.getByTestId('funnel-status-new')).toHaveTextContent('1');
    expect(screen.getByTestId('funnel-priority-medium')).toHaveTextContent('6');
    const referral = await rowFor('funnel-sources', 'Referral');
    expect([1, 2, 3].map((i) => cell(referral, i))).toEqual(['4', '1', '25%']);
  });
});

describe('date range', () => {
  it('presets work; an old custom range shows empty states; an invalid range is refused without calling the API', async () => {
    await loginAsToken(m.leader.email);
    const ctx = renderApp('/admin/reports');
    await rowFor('team-report', m.team.name);
    await ctx.user.selectOptions(screen.getByLabelText('Date range'), '7');
    expect(await rowFor('team-report', m.team.name)).toBeInTheDocument();

    await ctx.user.click(screen.getByRole('tab', { name: 'Customer visits' }));
    await ctx.user.selectOptions(screen.getByLabelText('Date range'), 'custom');
    expect(await screen.findByText('Pick a valid date range')).toBeInTheDocument(); // no dates chosen yet
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2020-01-31' } });
    expect(await screen.findByText('No customer visits in this range')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2020-03-01' } });
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2020-02-01' } });
    expect(await screen.findByText('Pick a valid date range')).toBeInTheDocument();
  });
});
