import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { World, call, loginAsToken, makeLead, minutesFromNow, makeFollowUp, renderApp, seedWorld, uid } from './helpers';

let w: World;
let agentLeads: { id: string; leadCode: string; customerName: string; mobileNumber: string }[] = [];
let unassigned: { id: string; leadCode: string; customerName: string; mobileNumber: string };
let otherTeamLead: { id: string; leadCode: string; customerName: string };

beforeAll(async () => {
  w = await seedWorld();
  for (let i = 1; i <= 17; i++) {
    agentLeads.push(await makeLead(w.adminToken, { customerName: `Bulk ${w.tag} ${String(i).padStart(2, '0')}`, assignedAgentId: w.agent.id, priority: i % 2 ? 'high' : 'low' }));
  }
  unassigned = await makeLead(w.adminToken, { customerName: `Loose ${w.tag}`, city: 'Surat' });
  const otherAgent = await call('/users', { method: 'POST', token: w.adminToken, body: { name: `Oth Agent ${w.tag}`, email: `oth.agent.${w.tag}@e2e.test`, password: 'Str0ng-Test-Pass1', role: 'field_agent' } });
  await call(`/teams/${w.otherTeam.id}/agents`, { method: 'POST', token: w.adminToken, body: { agentIds: [otherAgent.data.id] } });
  otherTeamLead = await makeLead(w.adminToken, { customerName: `OtherTeam ${w.tag}`, assignedAgentId: otherAgent.data.id });
});

const rows = async () => await screen.findAllByTestId('lead-row');
const rowFor = async (text: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const r = (await rows()).find((x) => x.textContent?.includes(text));
    if (!r) throw new Error(`no row for ${text}`);
    return r;
  });
const search = async (ctx: ReturnType<typeof renderApp>, text: string) => {
  await ctx.user.clear(await screen.findByLabelText('Search leads'));
  await ctx.user.type(screen.getByLabelText('Search leads'), text);
};

describe('lead list (live data)', () => {
  it('shows real leads with status, priority, assignee and team; no preview banner', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await search(ctx, `Bulk ${w.tag} 01`);
    const row = await rowFor(`Bulk ${w.tag} 01`);
    expect(within(row).getByText('Assigned')).toBeInTheDocument();
    expect(within(row).getByText('High')).toBeInTheDocument();
    expect(within(row).getByText(w.agent.name)).toBeInTheDocument();
    expect(within(row).getByText(w.team.name)).toBeInTheDocument();
    expect(within(row).getByText(/^LD-\d{6}/)).toBeInTheDocument();
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('server-side pagination (15 per page)', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await search(ctx, `Bulk ${w.tag}`);
    expect(await screen.findByText(/Page 1 of 2 · 17 total/)).toBeInTheDocument();
    expect((await rows()).length).toBe(15);
    await ctx.user.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByText(/Page 2 of 2/);
    await waitFor(async () => expect((await rows()).length).toBe(2));
  });

  it('filters: priority, unassigned, status, search by mobile; empty state', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await search(ctx, `Bulk ${w.tag}`);
    await ctx.user.selectOptions(screen.getByLabelText('Filter by priority'), 'low');
    await screen.findByText(/8 total/); // 8 low-priority among 17
    await ctx.user.selectOptions(screen.getByLabelText('Filter by priority'), '');

    await search(ctx, w.tag);
    await ctx.user.click(screen.getByLabelText('Unassigned only'));
    await waitFor(async () => {
      const r = await rows();
      expect(r.length).toBe(1);
      expect(r[0].textContent).toContain(`Loose ${w.tag}`);
      expect(r[0].textContent).toContain('Unassigned');
    });
    await ctx.user.click(screen.getByLabelText('Unassigned only'));

    await search(ctx, unassigned.mobileNumber);
    expect(await rowFor(`Loose ${w.tag}`)).toBeInTheDocument();
    await ctx.user.selectOptions(screen.getByLabelText('Filter by status'), 'lost');
    expect(await screen.findByText('No leads match these filters')).toBeInTheDocument();
  });

  it('sorting by name is applied by the server', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await search(ctx, `Bulk ${w.tag}`);
    await screen.findByText(/17 total/);
    await ctx.user.selectOptions(screen.getByLabelText('Sort leads'), 'name');
    await waitFor(async () => expect((await rows())[0].textContent).toContain(`Bulk ${w.tag} 01`));
    await ctx.user.selectOptions(screen.getByLabelText('Sort leads'), 'old');
    await waitFor(async () => expect((await rows())[0].textContent).toContain(`Bulk ${w.tag} 01`));
  });
});

describe('creating and editing leads', () => {
  const choose = async (ctx: ReturnType<typeof renderApp>, dialog: HTMLElement, label: string, option: string | RegExp) => {
    const select = within(dialog).getByLabelText(label);
    await ctx.user.selectOptions(select, await within(select).findByRole('option', { name: option }));
  };

  it('validation blocks bad input', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await ctx.user.click(await screen.findByRole('button', { name: 'New lead' }));
    const dialog = await screen.findByRole('dialog', { name: 'New lead' });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create lead' }));
    expect(await within(dialog).findByText('Enter the customer name')).toBeInTheDocument();
    expect(within(dialog).getByText('Enter a valid mobile number')).toBeInTheDocument();
    expect(within(dialog).getByText('Choose a source')).toBeInTheDocument();
    await ctx.user.type(within(dialog).getByLabelText('Email'), 'nope');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create lead' }));
    expect(await within(dialog).findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('creates and assigns a lead with a first follow-up; it persists and its drawer opens', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await ctx.user.click(await screen.findByRole('button', { name: 'New lead' }));
    const dialog = await screen.findByRole('dialog', { name: 'New lead' });
    const name = `UI Lead ${uid()}`;
    const mobile = `9${Math.floor(100000000 + Math.random() * 899999999)}`;
    await ctx.user.type(within(dialog).getByLabelText('Customer name *'), name);
    await ctx.user.type(within(dialog).getByLabelText('Mobile number *'), mobile);
    await ctx.user.type(within(dialog).getByLabelText('Email'), 'ui.lead@example.com');
    await ctx.user.type(within(dialog).getByLabelText('City *'), 'Nagpur');
    await ctx.user.type(within(dialog).getByLabelText('State *'), 'MH');
    await choose(ctx, dialog, 'Lead source *', 'Referral');
    await ctx.user.type(within(dialog).getByLabelText('Product / service of interest *'), 'Rooftop solar');
    await choose(ctx, dialog, 'Priority', 'Urgent');
    await choose(ctx, dialog, 'Team', w.team.name);
    await choose(ctx, dialog, 'Assign to agent', new RegExp(w.agent.name));
    const due = new Date(Date.now() + 86400000);
    const pad = (n: number) => String(n).padStart(2, '0');
    fireEvent.change(within(dialog).getByLabelText('First follow-up (call)'), { target: { value: `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T10:00` } });
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create lead' }));

    expect(await screen.findByText(/Lead LD-\d{6} created\./)).toBeInTheDocument();
    const found = await call(`/leads?search=${mobile}`, { token: w.adminToken });
    expect(found.data).toHaveLength(1);
    expect(found.data[0]).toMatchObject({ customerName: name, priority: 'urgent', status: 'assigned', assignedAgentId: w.agent.id, teamId: w.team.id, city: 'Nagpur' });
    expect(found.data[0].nextFollowUpAt).toBeTruthy();
    // the drawer for the new lead opens automatically
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    expect(await within(drawer).findByText(name)).toBeInTheDocument();
  });

  it('a duplicate mobile number warns and only creates a second lead after explicit confirmation', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await ctx.user.click(await screen.findByRole('button', { name: 'New lead' }));
    const dialog = await screen.findByRole('dialog', { name: 'New lead' });
    await ctx.user.type(within(dialog).getByLabelText('Customer name *'), 'Twin Customer');
    await ctx.user.type(within(dialog).getByLabelText('Mobile number *'), unassigned.mobileNumber);
    await ctx.user.type(within(dialog).getByLabelText('City *'), 'Surat');
    await ctx.user.type(within(dialog).getByLabelText('State *'), 'GJ');
    await choose(ctx, dialog, 'Lead source *', 'Referral');
    await ctx.user.type(within(dialog).getByLabelText('Product / service of interest *'), 'Solar');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create lead' }));
    expect(await within(dialog).findByText(/already on another lead/)).toBeInTheDocument();
    expect((await call(`/leads?search=${unassigned.mobileNumber}`, { token: w.adminToken })).data).toHaveLength(1);
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Create anyway' }));
    expect(await screen.findByText(/Lead LD-\d{6} created\./)).toBeInTheDocument();
    expect((await call(`/leads?search=${unassigned.mobileNumber}`, { token: w.adminToken })).data).toHaveLength(2);
  });

  it('editing saves only what changed', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `Edit Lead ${w.tag}`, assignedAgentId: w.agent.id });
    await loginAsToken(w.manager.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /edit/i }));
    const dialog = await screen.findByRole('dialog', { name: `Edit ${lead.leadCode}` });
    await ctx.user.clear(within(dialog).getByLabelText('City *'));
    await ctx.user.type(within(dialog).getByLabelText('City *'), 'Nashik');
    await choose(ctx, dialog, 'Priority', 'High');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Lead updated.')).toBeInTheDocument();
    const got = await call(`/leads/${lead.id}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ city: 'Nashik', priority: 'high', customerName: `Edit Lead ${w.tag}`, assignedAgentId: w.agent.id });
  });
});

describe('lead drawer: status, timeline, follow-ups', () => {
  it('deep link opens the drawer with details and tabs', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `Detail ${w.tag}`, assignedAgentId: w.agent.id, remarks: 'Prefers weekend calls' });
    await loginAsToken(w.manager.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    expect(await within(drawer).findByText(`Detail ${w.tag}`)).toBeInTheDocument();
    expect(within(drawer).getByText('Prefers weekend calls')).toBeInTheDocument();
    expect(within(drawer).getByText(w.agent.name)).toBeInTheDocument();
    await ctx.user.click(within(drawer).getByRole('tab', { name: 'Timeline' }));
    expect(await within(drawer).findByText('Lead created')).toBeInTheDocument();
    await ctx.user.click(within(drawer).getByRole('button', { name: /close lead details/i }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Lead details' })).not.toBeInTheDocument());
  });

  it('notes appear in the timeline', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `Notes ${w.tag}`, assignedAgentId: w.agent.id });
    await loginAsToken(w.manager.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    await ctx.user.click(await within(drawer).findByRole('tab', { name: 'Timeline' }));
    await ctx.user.type(await within(drawer).findByLabelText('Add a note'), 'Customer asked for a quote');
    await ctx.user.click(within(drawer).getByRole('button', { name: /add note/i }));
    await waitFor(() => expect(within(drawer).getByTestId('activity-timeline')).toHaveTextContent('Customer asked for a quote'));
    expect(within(drawer).getByTestId('activity-timeline')).toHaveTextContent('Note');
    expect(within(drawer).getByLabelText('Add a note')).toHaveValue(''); // cleared after saving
  });

  it('status changes: lost needs a reason; history and list badge update', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `Status ${w.tag}`, assignedAgentId: w.agent.id });
    await loginAsToken(w.manager.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /change status/i }));
    let dialog = await screen.findByRole('dialog', { name: `Change status — ${lead.leadCode}` });
    await ctx.user.selectOptions(within(dialog).getByLabelText('New status'), 'contacted');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Update status' }));
    expect(await screen.findByText('Status changed to Contacted.')).toBeInTheDocument();
    await waitFor(() => expect(within(drawer).getAllByText('Contacted').length).toBeGreaterThan(0));

    await ctx.user.click(within(drawer).getByRole('button', { name: /change status/i }));
    dialog = await screen.findByRole('dialog', { name: `Change status — ${lead.leadCode}` });
    await ctx.user.selectOptions(within(dialog).getByLabelText('New status'), 'lost');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Update status' }));
    expect(await within(dialog).findByText(/Give a reason for losing/)).toBeInTheDocument();
    await ctx.user.type(within(dialog).getByLabelText('Reason lost *'), 'Chose a competitor');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Update status' }));
    expect(await screen.findByText('Status changed to Lost.')).toBeInTheDocument();
    const got = await call(`/leads/${lead.id}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ status: 'lost', lostReason: 'Chose a competitor' });
    // closed leads cannot take new follow-ups or assignments from the UI
    await waitFor(() => expect(within(drawer).getByRole('button', { name: /schedule follow-up/i })).toBeDisabled());
    expect(within(drawer).getByRole('button', { name: /^assign$/i })).toBeDisabled();
  });

  it('schedule, complete and cancel follow-ups from the lead', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `FU ${w.tag}`, assignedAgentId: w.agent.id });
    await loginAsToken(w.manager.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /schedule follow-up/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Schedule follow-up' });
    await ctx.user.selectOptions(within(dialog).getByLabelText('Type'), 'meeting');
    await ctx.user.type(within(dialog).getByLabelText('Notes'), 'Bring the brochure');
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Schedule' }));
    expect(await screen.findByText('Follow-up scheduled.')).toBeInTheDocument();

    await ctx.user.click(within(drawer).getByRole('tab', { name: /follow-ups/i }));
    const list = await within(drawer).findByTestId('followup-list');
    expect(within(list).getByText('Meeting')).toBeInTheDocument();
    expect(within(list).getByText('Bring the brochure')).toBeInTheDocument();
    expect((await call(`/leads/${lead.id}`, { token: w.adminToken })).data.nextFollowUpAt).toBeTruthy();

    await ctx.user.click(within(list).getByRole('button', { name: /complete meeting follow-up/i }));
    const done = await screen.findByRole('dialog', { name: 'Complete follow-up' });
    await ctx.user.type(within(done).getByLabelText('Outcome notes'), 'Signed the quote');
    await ctx.user.click(within(done).getByRole('button', { name: 'Mark completed' }));
    expect(await screen.findByText('Follow-up marked as completed.')).toBeInTheDocument();
    expect(await within(drawer).findByText('Outcome: Signed the quote')).toBeInTheDocument();
    expect((await call(`/leads/${lead.id}`, { token: w.adminToken })).data.nextFollowUpAt).toBeNull();
  });
});

describe('assignment', () => {
  it('assigns an unassigned lead to an agent', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `ToAssign ${w.tag} ${uid()}` });
    await loginAsToken(w.manager.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /^assign$/i }));
    const dialog = await screen.findByRole('dialog', { name: `Assign ${lead.leadCode}` });
    await ctx.user.selectOptions(within(dialog).getByLabelText('Team'), await within(dialog).findByRole('option', { name: w.team.name }));
    const agentSel = within(dialog).getByLabelText('Agent');
    await ctx.user.selectOptions(agentSel, await within(agentSel).findByRole('option', { name: new RegExp(w.agent.name) }));
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Assign' }));
    expect(await screen.findByText('Lead assigned.')).toBeInTheDocument();
    const got = await call(`/leads/${lead.id}`, { token: w.adminToken });
    expect(got.data).toMatchObject({ assignedAgentId: w.agent.id, teamId: w.team.id, status: 'assigned' });
  });

  it('bulk assign: selected leads are assigned and per-lead failures are listed', async () => {
    const tag = uid();
    const a = await makeLead(w.adminToken, { customerName: `BulkA ${tag}` });
    const b = await makeLead(w.adminToken, { customerName: `BulkB ${tag}` });
    const closed = await makeLead(w.adminToken, { customerName: `BulkC ${tag}`, assignedAgentId: w.agent.id });
    await call(`/leads/${closed.id}/status`, { method: 'PATCH', token: w.adminToken, body: { status: 'lost', lostReason: 'No budget' } });

    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/leads');
    await search(ctx, `Bulk`);
    await ctx.user.clear(screen.getByLabelText('Search leads'));
    await ctx.user.type(screen.getByLabelText('Search leads'), tag);
    await waitFor(async () => expect((await rows()).length).toBe(3));
    await ctx.user.click(screen.getByLabelText('Select all leads on this page'));
    expect(await screen.findByText('3 selected')).toBeInTheDocument();
    await ctx.user.click(screen.getByRole('button', { name: /assign selected/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Assign 3 leads' });
    await ctx.user.selectOptions(within(dialog).getByLabelText('Team'), await within(dialog).findByRole('option', { name: w.team.name }));
    const agentSel = within(dialog).getByLabelText('Agent');
    await ctx.user.selectOptions(agentSel, await within(agentSel).findByRole('option', { name: new RegExp(w.agent.name) }));
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Assign' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(`${closed.leadCode}`);
    expect(within(dialog).getByRole('alert')).toHaveTextContent(/Closed leads cannot be reassigned|already has this assignment/);
    for (const l of [a, b]) expect((await call(`/leads/${l.id}`, { token: w.adminToken })).data.assignedAgentId).toBe(w.agent.id);
  });
});

describe('team leader scoping', () => {
  it('sees only their team leads and cannot pick another team', async () => {
    await loginAsToken(w.leader.email);
    const ctx = renderApp('/admin/leads');
    await search(ctx, w.tag);
    await rowFor(`Bulk ${w.tag}`);
    await waitFor(async () => {
      const names = (await rows()).map((r) => r.textContent ?? '');
      expect(names.some((n) => n.includes(`OtherTeam ${w.tag}`))).toBe(false);
      expect(names.some((n) => n.includes(`Loose ${w.tag}`))).toBe(false); // unassigned, no team
    });
    expect(screen.queryByLabelText('Filter by team')).not.toBeInTheDocument();
    // deep link to another team's lead is not found, not leaked
    ctx.unmount();
    renderApp(`/admin/leads?lead=${otherTeamLead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    expect(await within(drawer).findByText(/Lead not found/i)).toBeInTheDocument();
  });

  it('assignment dialog has no team picker for leaders and only offers their agents', async () => {
    const lead = await makeLead(w.adminToken, { customerName: `LeaderAssign ${w.tag}`, assignedAgentId: w.agent.id });
    await loginAsToken(w.leader.email);
    const ctx = renderApp(`/admin/leads?lead=${lead.id}`);
    const drawer = await screen.findByRole('dialog', { name: 'Lead details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /^assign$/i }));
    const dialog = await screen.findByRole('dialog', { name: `Assign ${lead.leadCode}` });
    expect(within(dialog).queryByLabelText('Team')).not.toBeInTheDocument();
    const agentSel = within(dialog).getByLabelText('Agent');
    await within(agentSel).findByRole('option', { name: new RegExp(w.agent.name) });
    expect(within(agentSel).queryByRole('option', { name: /Oth Agent/ })).not.toBeInTheDocument();
  });
});

void makeFollowUp; void minutesFromNow;
