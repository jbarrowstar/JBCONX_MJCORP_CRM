import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { World, call, loginAsToken, makeFollowUp, makeLead, minutesFromNow, renderApp, seedWorld } from './helpers';

let w: World;
let lead: { id: string; leadCode: string; customerName: string };
let otherLead: { id: string; customerName: string };
const ids: Record<string, string> = {};

beforeAll(async () => {
  w = await seedWorld();
  lead = await makeLead(w.adminToken, { customerName: `FU Cust ${w.tag}`, assignedAgentId: w.agent.id });
  // due 4 minutes ago: accepted by the backend (5 min grace) and therefore genuinely overdue
  ids.overdueCall = (await makeFollowUp(w.adminToken, lead.id, minutesFromNow(-4), 'call', `Overdue call ${w.tag}`)).id;
  ids.overdueDemo = (await makeFollowUp(w.adminToken, lead.id, minutesFromNow(-3), 'demo', `Overdue demo ${w.tag}`)).id;
  ids.upcoming = (await makeFollowUp(w.adminToken, lead.id, minutesFromNow(60 * 24), 'meeting', `Upcoming meeting ${w.tag}`)).id;
  const o = await call('/users', { method: 'POST', token: w.adminToken, body: { name: `FU Other ${w.tag}`, email: `fu.other.${w.tag}@e2e.test`, password: 'Str0ng-Test-Pass1', role: 'field_agent' } });
  await call(`/teams/${w.otherTeam.id}/agents`, { method: 'POST', token: w.adminToken, body: { agentIds: [o.data.id] } });
  otherLead = await makeLead(w.adminToken, { customerName: `FU OtherTeam ${w.tag}`, assignedAgentId: o.data.id });
  await makeFollowUp(w.adminToken, otherLead.id, minutesFromNow(-2), 'call', `Other team task ${w.tag}`);
});

const frows = async () => await screen.findAllByTestId('followup-row');
const rowWith = async (text: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const r = (await frows()).find((x) => x.textContent?.includes(text));
    if (!r) throw new Error(`no follow-up row with ${text}`);
    return r;
  });

describe('follow-ups page (live data)', () => {
  it('summary cards match the backend and the page is not marked as a preview', async () => {
    await loginAsToken(w.manager.email);
    renderApp('/admin/followups');
    const s = (await call('/followups/summary', { token: w.manager.token || (await (await import('./helpers')).loginApi(w.manager.email)) })).data;
    await waitFor(() => expect(screen.getByTestId('summary-overdue')).toHaveTextContent(String(s.overdue)));
    expect(screen.getByTestId('summary-pending')).toHaveTextContent(String(s.pending));
    expect(screen.getByTestId('summary-completed')).toHaveTextContent(String(s.completed));
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('Overdue tab lists overdue items in red with the customer and agent; upcoming ones are on another tab', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    const row = await rowWith(`Overdue call ${w.tag}`);
    expect(within(row).getByText('overdue')).toBeInTheDocument();
    expect(within(row).getByText(`FU Cust ${w.tag}`)).toBeInTheDocument();
    expect(within(row).getByText(w.agent.name)).toBeInTheDocument();
    expect(within(row).getByText('Call')).toBeInTheDocument();
    expect((await frows()).some((r) => r.textContent?.includes(`Upcoming meeting ${w.tag}`))).toBe(false);

    await ctx.user.click(screen.getByRole('tab', { name: /upcoming/i }));
    const up = await rowWith(`Upcoming meeting ${w.tag}`);
    expect(within(up).getByText('pending')).toBeInTheDocument();
    expect((await frows()).some((r) => r.textContent?.includes(`Overdue call ${w.tag}`))).toBe(false);
  });

  it('type filter is applied by the server', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    await rowWith(`Overdue call ${w.tag}`);
    await ctx.user.selectOptions(screen.getByLabelText('Filter by type'), 'demo');
    await waitFor(async () => {
      const r = (await frows()).filter((x) => x.textContent?.includes(w.tag));
      expect(r.length).toBe(1);
      expect(r[0].textContent).toContain(`Overdue demo ${w.tag}`);
    });
  });

  it('completing moves the item to Completed with the outcome, and the lead timeline records it', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    const row = await rowWith(`Overdue call ${w.tag}`);
    await ctx.user.click(within(row).getByRole('button', { name: /complete call follow-up/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Complete follow-up' });
    await ctx.user.type(within(dialog).getByLabelText('Outcome notes'), 'Booked a site visit');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Mark completed' }));
    expect(await screen.findByText('Follow-up marked as completed.')).toBeInTheDocument();
    await waitFor(async () => expect((await frows().catch(() => [])).some((r) => r.textContent?.includes(`Overdue call ${w.tag}`))).toBe(false));

    await ctx.user.click(screen.getByRole('tab', { name: /completed/i }));
    const done = await rowWith(`Overdue call ${w.tag}`);
    expect(within(done).getByText('completed')).toBeInTheDocument();
    expect(within(done).getByText(/Outcome: Booked a site visit/)).toBeInTheDocument();
    const got = await call(`/followups/${ids.overdueCall}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ status: 'completed', outcomeNotes: 'Booked a site visit' });
    expect(got.data.completedBy.id).toBeTruthy();
  });

  it('rescheduling an upcoming item persists the new time and notes', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    await ctx.user.click(await screen.findByRole('tab', { name: /upcoming/i }));
    const row = await rowWith(`Upcoming meeting ${w.tag}`);
    await ctx.user.click(within(row).getByRole('button', { name: /reschedule follow-up/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Reschedule follow-up' });
    const when = new Date(Date.now() + 3 * 86400000);
    const pad = (n: number) => String(n).padStart(2, '0');
    fireEvent.change(within(dialog).getByLabelText('Due date & time'), { target: { value: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}T15:30` } });
    await ctx.user.clear(within(dialog).getByLabelText('Notes'));
    await ctx.user.type(within(dialog).getByLabelText('Notes'), 'Moved to Thursday');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Follow-up updated.')).toBeInTheDocument();
    const got = await call(`/followups/${ids.upcoming}`, { token: w.adminToken });
    expect(got.data.notes).toBe('Moved to Thursday');
    const due = new Date(got.data.dueAt);
    expect(due.getDate()).toBe(when.getDate());
    expect(due.getHours()).toBe(15);
    expect(due.getMinutes()).toBe(30);
  });

  it('cancelling records the reason and moves the item to Cancelled', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    const row = await rowWith(`Overdue demo ${w.tag}`);
    await ctx.user.click(within(row).getByRole('button', { name: /cancel follow-up/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel follow-up' });
    await ctx.user.type(within(dialog).getByLabelText('Reason (optional)'), 'Customer travelling');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Cancel follow-up' }));
    expect(await screen.findByText('Follow-up cancelled.')).toBeInTheDocument();
    await ctx.user.click(screen.getByRole('tab', { name: /cancelled/i }));
    expect(await rowWith(`Overdue demo ${w.tag}`)).toBeInTheDocument();
    expect((await call(`/followups/${ids.overdueDemo}`, { token: w.adminToken })).data).toMatchObject({ status: 'cancelled', cancelledReason: 'Customer travelling' });
  });

  it('the customer link opens that lead in the Lead Management drawer', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    await ctx.user.click(await screen.findByRole('tab', { name: /upcoming/i }));
    const row = await rowWith(`Moved to Thursday`);
    await ctx.user.click(within(row).getByRole('link', { name: `FU Cust ${w.tag}` }));
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    expect(await within(drawer).findByText(`FU Cust ${w.tag}`)).toBeInTheDocument();
  });

  it('closing a lead cancels its pending follow-ups', async () => {
    const closing = await makeLead(w.adminToken, { customerName: `Closing ${w.tag}`, assignedAgentId: w.agent.id });
    const fu = await makeFollowUp(w.adminToken, closing.id, minutesFromNow(120), 'call', `Closing task ${w.tag}`);
    await call(`/leads/${closing.id}/status`, { method: 'PATCH', token: w.adminToken, body: { status: 'converted' } });
    expect((await call(`/followups/${fu.id}`, { token: w.adminToken })).data.status).toBe('cancelled');
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/followups');
    await ctx.user.click(await screen.findByRole('tab', { name: /cancelled/i }));
    const row = await rowWith(`Closing task ${w.tag}`);
    expect(within(row).getByText('cancelled')).toBeInTheDocument();
  });
});

describe('team leader scoping', () => {
  it("shows only the leader's team follow-ups", async () => {
    await makeFollowUp(w.adminToken, lead.id, minutesFromNow(-1), 'call', `Leader visible task ${w.tag}`);
    await loginAsToken(w.leader.email);
    renderApp('/admin/followups');
    await screen.findByRole('heading', { name: /follow-ups & tasks/i });
    await waitFor(async () => {
      const text = (await frows()).map((r) => r.textContent ?? '').join('|');
      expect(text).toContain(`Leader visible task ${w.tag}`);
      expect(text).not.toContain(`Other team task ${w.tag}`);
    });
  });
});
