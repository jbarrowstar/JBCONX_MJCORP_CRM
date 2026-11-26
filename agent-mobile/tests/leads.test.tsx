import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, PASSWORD, TOKEN_KEY, call, loginApi, makeFollowUp, makeLead, makePerson, minutesFromNow, renderApp, uid } from './helpers';

const tag = uid();
let adminToken: string;
let agent: { id: string; name: string; email: string };
let other: { id: string; name: string; email: string };
let team: { id: string; name: string };
const mine: { id: string; leadCode: string; customerName: string; mobileNumber: string }[] = [];
let theirs: { id: string; customerName: string };

beforeAll(async () => {
  adminToken = await loginApi(ADMIN.email, ADMIN.password);
  agent = await makePerson(adminToken, 'field_agent', `Lead Agent ${tag}`);
  other = await makePerson(adminToken, 'field_agent', `Other Agent ${tag}`);
  const t = await call('/teams', { method: 'POST', token: adminToken, body: { name: `Lead Team ${tag}` } });
  team = { id: t.data.id, name: t.data.name };
  await call(`/teams/${team.id}/agents`, { method: 'POST', token: adminToken, body: { agentIds: [agent.id, other.id] } });
  for (let i = 1; i <= 12; i++) mine.push(await makeLead(adminToken, { customerName: `Mine ${tag} ${String(i).padStart(2, '0')}`, assignedAgentId: agent.id }));
  theirs = await makeLead(adminToken, { customerName: `Theirs ${tag}`, assignedAgentId: other.id });
});

const asAgent = async () => window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
const cards = async () => await screen.findAllByTestId('lead-card');
const cardFor = async (text: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const c = (await cards()).find((x) => x.textContent?.includes(text));
    if (!c) throw new Error(`no card for ${text}`);
    return c;
  });
const openSheet = async (ctx: ReturnType<typeof renderApp>, name: string) => {
  await ctx.user.type(await screen.findByLabelText('Search leads'), name);
  await ctx.user.click(await cardFor(name));
  return await screen.findByRole('dialog', { name: new RegExp(name) });
};

describe('my leads (live data)', () => {
  it('shows only leads assigned to this agent, with paging, and no preview banner', async () => {
    await asAgent();
    const ctx = renderApp('/leads');
    await ctx.user.type(await screen.findByLabelText('Search leads'), tag);
    expect(await screen.findByText(/Page 1 of 2 · 12 total/)).toBeInTheDocument();
    expect((await cards()).length).toBe(10);
    expect((await cards()).some((c) => c.textContent?.includes(`Theirs ${tag}`))).toBe(false);
    expect(screen.queryByText(/Preview screen/)).not.toBeInTheDocument();
    await ctx.user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByText(/Page 2 of 2/);
    await waitFor(async () => expect((await cards()).length).toBe(2));
  });

  it('search finds by mobile number; no match shows an empty state', async () => {
    await asAgent();
    const ctx = renderApp('/leads');
    await ctx.user.type(await screen.findByLabelText('Search leads'), mine[3].mobileNumber);
    expect(await cardFor(mine[3].customerName)).toBeInTheDocument();
    await ctx.user.clear(screen.getByLabelText('Search leads'));
    await ctx.user.type(screen.getByLabelText('Search leads'), `nothing-${uid()}`);
    expect(await screen.findByText('No leads match.')).toBeInTheDocument();
  });

  it("another agent's lead can never be opened (not found)", async () => {
    await asAgent();
    renderApp('/leads');
    expect((await call(`/leads/${theirs.id}`, { token: await loginApi(agent.email) })).status).toBe(404);
  });
});

describe('creating a lead', () => {
  it('validates, then creates a lead assigned to the agent and opens it', async () => {
    await asAgent();
    const ctx = renderApp('/leads');
    await ctx.user.click(await screen.findByRole('button', { name: /new lead/i }));
    const sheet = await screen.findByRole('dialog', { name: 'New lead' });
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Create lead' }));
    expect(await within(sheet).findByText('Enter the customer name')).toBeInTheDocument();
    expect(within(sheet).getByText('Enter a valid mobile number')).toBeInTheDocument();
    expect(within(sheet).getByText('Choose a source')).toBeInTheDocument();

    const name = `Field Lead ${uid()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
    await ctx.user.type(within(sheet).getByLabelText('Customer name *'), name);
    await ctx.user.type(within(sheet).getByLabelText('Mobile number *'), mobile);
    await ctx.user.type(within(sheet).getByLabelText('City *'), 'Thane');
    await ctx.user.type(within(sheet).getByLabelText('State *'), 'MH');
    await ctx.user.selectOptions(within(sheet).getByLabelText('Source *'), await within(sheet).findByRole('option', { name: 'Field Visit' }));
    await ctx.user.type(within(sheet).getByLabelText('Product / service of interest *'), 'Water purifier');
    const due = new Date(Date.now() + 86400000);
    const pad = (n: number) => String(n).padStart(2, '0');
    fireEvent.change(within(sheet).getByLabelText('First follow-up (call)'), { target: { value: `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T11:00` } });
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Create lead' }));

    expect(await screen.findByText(/Lead LD-\d{6} created\./)).toBeInTheDocument();
    const found = await call(`/leads?search=${mobile}`, { token: await loginApi(agent.email) });
    expect(found.data[0]).toMatchObject({ customerName: name, status: 'assigned', assignedAgentId: agent.id, teamId: team.id, interestedService: 'Water purifier' });
    expect(found.data[0].nextFollowUpAt).toBeTruthy();
    expect(await screen.findByRole('dialog', { name: new RegExp(name) })).toBeInTheDocument(); // detail sheet opened
  });

  it('a duplicate number warns first and only creates after explicit confirmation', async () => {
    await asAgent();
    const ctx = renderApp('/leads');
    await ctx.user.click(await screen.findByRole('button', { name: /new lead/i }));
    const sheet = await screen.findByRole('dialog', { name: 'New lead' });
    await ctx.user.type(within(sheet).getByLabelText('Customer name *'), 'Twin Person');
    await ctx.user.type(within(sheet).getByLabelText('Mobile number *'), mine[0].mobileNumber);
    await ctx.user.type(within(sheet).getByLabelText('City *'), 'Pune');
    await ctx.user.type(within(sheet).getByLabelText('State *'), 'MH');
    await ctx.user.selectOptions(within(sheet).getByLabelText('Source *'), await within(sheet).findByRole('option', { name: 'Referral' }));
    await ctx.user.type(within(sheet).getByLabelText('Product / service of interest *'), 'Solar');
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Create lead' }));
    expect(await within(sheet).findByRole('alert')).toHaveTextContent(/already exists/i);
    await ctx.user.click(within(sheet).getByRole('button', { name: /create anyway/i }));
    expect(await screen.findByText(/Lead LD-\d{6} created\./)).toBeInTheDocument();
  });

  it('respects the organisation setting that disables lead creation by agents', async () => {
    expect((await call('/settings', { method: 'PATCH', token: adminToken, body: { operational: { agentsCanCreateLeads: false } } })).status).toBe(200);
    try {
      await asAgent();
      renderApp('/leads');
      await screen.findByLabelText('Search leads');
      await waitFor(() => expect(screen.queryByRole('button', { name: /new lead/i })).not.toBeInTheDocument());
    } finally {
      await call('/settings', { method: 'PATCH', token: adminToken, body: { operational: { agentsCanCreateLeads: true } } });
    }
  });
});

describe('working a lead', () => {
  it('shows contact details with a tap-to-call link', async () => {
    const lead = await makeLead(adminToken, { customerName: `Callme ${tag}`, assignedAgentId: agent.id, remarks: 'Evenings only', email: 'callme@example.com' });
    await asAgent();
    const ctx = renderApp('/leads');
    const sheet = await openSheet(ctx, `Callme ${tag}`);
    expect(within(sheet).getByRole('link', { name: lead.mobileNumber })).toHaveAttribute('href', `tel:${lead.mobileNumber}`);
    expect(within(sheet).getByText('callme@example.com')).toBeInTheDocument();
    expect(within(sheet).getByText('Evenings only')).toBeInTheDocument();
  });

  it('updates status (lost needs a reason); the server value changes', async () => {
    const lead = await makeLead(adminToken, { customerName: `Status ${tag}`, assignedAgentId: agent.id });
    await asAgent();
    const ctx = renderApp('/leads');
    const sheet = await openSheet(ctx, `Status ${tag}`);
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Update status' }));
    let sub = await screen.findByRole('dialog', { name: 'Update status' });
    await ctx.user.selectOptions(within(sub).getByLabelText('New status'), 'interested');
    await ctx.user.click(within(sub).getByRole('button', { name: 'Update status' }));
    expect(await screen.findByText('Status changed to Interested.')).toBeInTheDocument();

    await ctx.user.click(within(sheet).getByRole('button', { name: 'Update status' }));
    sub = await screen.findByRole('dialog', { name: 'Update status' });
    await ctx.user.selectOptions(within(sub).getByLabelText('New status'), 'lost');
    await ctx.user.click(within(sub).getByRole('button', { name: 'Update status' }));
    expect(await within(sub).findByRole('alert')).toHaveTextContent(/reason/i);
    await ctx.user.type(within(sub).getByLabelText('Reason lost *'), 'Budget too low');
    await ctx.user.click(within(sub).getByRole('button', { name: 'Update status' }));
    expect(await screen.findByText('Status changed to Lost.')).toBeInTheDocument();
    expect((await call(`/leads/${lead.id}`, { token: adminToken })).data).toMatchObject({ status: 'lost', lostReason: 'Budget too low' });
    // closed lead: no follow-ups from the app, and the app says why
    await waitFor(() => expect(within(sheet).getByRole('button', { name: 'Schedule follow-up' })).toBeDisabled());
    expect(within(sheet).getByText(/Only your team leader can reopen it/)).toBeInTheDocument();
  });

  it('an agent cannot reopen a closed lead: the server refusal is shown', async () => {
    const lead = await makeLead(adminToken, { customerName: `Closed ${tag}`, assignedAgentId: agent.id });
    await call(`/leads/${lead.id}/status`, { method: 'PATCH', token: adminToken, body: { status: 'converted' } });
    await asAgent();
    const ctx = renderApp('/leads');
    const sheet = await openSheet(ctx, `Closed ${tag}`);
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Update status' }));
    const sub = await screen.findByRole('dialog', { name: 'Update status' });
    await ctx.user.selectOptions(within(sub).getByLabelText('New status'), 'interested');
    await ctx.user.click(within(sub).getByRole('button', { name: 'Update status' }));
    expect(await within(sub).findByRole('alert')).toHaveTextContent(/reopened by a team leader or manager/i);
    expect((await call(`/leads/${lead.id}`, { token: adminToken })).data.status).toBe('converted');
  });

  it('edits only the fields an agent may change', async () => {
    const lead = await makeLead(adminToken, { customerName: `EditMe ${tag}`, assignedAgentId: agent.id });
    await asAgent();
    const ctx = renderApp('/leads');
    const sheet = await openSheet(ctx, `EditMe ${tag}`);
    await ctx.user.click(within(sheet).getByRole('button', { name: /edit/i }));
    const form = await screen.findByRole('dialog', { name: `Edit ${lead.leadCode}` });
    expect(within(form).queryByLabelText('Customer name *')).not.toBeInTheDocument(); // not editable by agents
    expect(within(form).queryByLabelText('Mobile number *')).not.toBeInTheDocument();
    await ctx.user.clear(within(form).getByLabelText('City *'));
    await ctx.user.type(within(form).getByLabelText('City *'), 'Satara');
    await ctx.user.type(within(form).getByLabelText('Remarks'), 'Wants a callback');
    await ctx.user.click(within(form).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Lead updated.')).toBeInTheDocument();
    expect((await call(`/leads/${lead.id}`, { token: adminToken })).data).toMatchObject({ city: 'Satara', remarks: 'Wants a callback', customerName: `EditMe ${tag}` });
  });

  it('notes land in the timeline; follow-ups can be scheduled and completed from the lead', async () => {
    const lead = await makeLead(adminToken, { customerName: `Flow ${tag}`, assignedAgentId: agent.id });
    await asAgent();
    const ctx = renderApp('/leads');
    const sheet = await openSheet(ctx, `Flow ${tag}`);
    await ctx.user.type(await within(sheet).findByLabelText('Add a note'), 'Called, no answer');
    await ctx.user.click(within(sheet).getByRole('button', { name: /save note/i }));
    await waitFor(() => expect(within(sheet).getByTestId('activity-timeline')).toHaveTextContent('Called, no answer'));

    await ctx.user.click(within(sheet).getByRole('button', { name: 'Schedule follow-up' }));
    const fu = await screen.findByRole('dialog', { name: 'Schedule follow-up' });
    await ctx.user.selectOptions(within(fu).getByLabelText('Type'), 'meeting');
    await ctx.user.type(within(fu).getByLabelText('Notes'), 'Site meeting');
    await ctx.user.click(within(fu).getByRole('button', { name: 'Schedule' }));
    expect(await screen.findByText('Follow-up scheduled.')).toBeInTheDocument();
    const list = await within(sheet).findByTestId('lead-followups');
    expect(within(list).getByText('Site meeting')).toBeInTheDocument();

    await ctx.user.click(within(list).getByRole('button', { name: /complete meeting follow-up/i }));
    const done = await screen.findByRole('dialog', { name: 'Complete follow-up' });
    await ctx.user.type(within(done).getByLabelText('Outcome notes'), 'Quote requested');
    await ctx.user.click(within(done).getByRole('button', { name: 'Mark completed' }));
    expect(await screen.findByText('Follow-up completed.')).toBeInTheDocument();
    expect(await within(sheet).findByText('Outcome: Quote requested')).toBeInTheDocument();
    expect((await call(`/leads/${lead.id}`, { token: adminToken })).data.nextFollowUpAt).toBeNull();
  });
});

describe('follow-ups tab', () => {
  it('lists overdue items for this agent only; complete and cancel work; the customer opens the lead', async () => {
    const lead = await makeLead(adminToken, { customerName: `FUTab ${tag}`, assignedAgentId: agent.id });
    const a = await makeFollowUp(adminToken, lead.id, minutesFromNow(-4), 'call', `Overdue A ${tag}`);
    const b = await makeFollowUp(adminToken, lead.id, minutesFromNow(-3), 'demo', `Overdue B ${tag}`);
    const otherLead = await makeLead(adminToken, { customerName: `FUOther ${tag}`, assignedAgentId: other.id });
    await makeFollowUp(adminToken, otherLead.id, minutesFromNow(-2), 'call', `Not mine ${tag}`);

    await asAgent();
    const ctx = renderApp('/leads');
    await ctx.user.click(await screen.findByRole('tab', { name: /follow-ups/i }));
    const list = await screen.findByTestId('followup-list');
    await waitFor(() => expect(list.textContent).toContain(`Overdue A ${tag}`));
    expect(list.textContent).not.toContain(`Not mine ${tag}`);
    const cardA = within(list).getAllByTestId('followup-card').find((c) => c.textContent?.includes(`Overdue A ${tag}`))!;
    expect(within(cardA).getByText('overdue')).toBeInTheDocument();

    await ctx.user.click(within(cardA).getByRole('button', { name: /complete call follow-up/i }));
    const done = await screen.findByRole('dialog', { name: 'Complete follow-up' });
    await ctx.user.type(within(done).getByLabelText('Outcome notes'), 'Spoke to customer');
    await ctx.user.click(within(done).getByRole('button', { name: 'Mark completed' }));
    expect(await screen.findByText('Follow-up completed.')).toBeInTheDocument();
    expect((await call(`/followups/${a.id}`, { token: adminToken })).data).toMatchObject({ status: 'completed', outcomeNotes: 'Spoke to customer' });

    const cardB = await waitFor(() => {
      const c = within(screen.getByTestId('followup-list')).getAllByTestId('followup-card').find((x) => x.textContent?.includes(`Overdue B ${tag}`));
      if (!c) throw new Error('B missing');
      return c;
    });
    await ctx.user.click(within(cardB).getByRole('button', { name: 'Cancel follow-up' }));
    const cx = await screen.findByRole('dialog', { name: 'Cancel follow-up' });
    await ctx.user.type(within(cx).getByLabelText('Reason (optional)'), 'Customer away');
    await ctx.user.click(within(cx).getByRole('button', { name: 'Cancel follow-up' }));
    expect(await screen.findByText('Follow-up cancelled.')).toBeInTheDocument();
    expect((await call(`/followups/${b.id}`, { token: adminToken })).data.status).toBe('cancelled');

    await ctx.user.click(screen.getByRole('tab', { name: 'Done' }));
    const doneCard = await waitFor(() => {
      const c = within(screen.getByTestId('followup-list')).getAllByTestId('followup-card').find((x) => x.textContent?.includes(`Overdue A ${tag}`));
      if (!c) throw new Error('A missing in Done');
      return c;
    });
    await ctx.user.click(within(doneCard).getByRole('button', { name: new RegExp(`FUTab ${tag}`) }));
    expect(await screen.findByRole('dialog', { name: new RegExp(`FUTab ${tag}`) })).toBeInTheDocument();
  });
});

void PASSWORD;
