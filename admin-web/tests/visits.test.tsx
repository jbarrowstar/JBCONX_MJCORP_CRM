import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { World, call, loginApi, loginAsToken, makeLead, makePerson, renderApp, seedWorld, uploadPhotos, API } from './helpers';

const GPS = { latitude: 12.9716, longitude: 77.5946, accuracy: 14 };
let w: World;
let lead1: { id: string; leadCode: string; customerName: string };
let lead2: { id: string; leadCode: string; customerName: string };
let v1: { id: string }; let v2: { id: string };
let photos: { id: string; downloadPath: string }[] = [];
let otherAgent: { id: string; name: string; email: string };
let otherVisit: { id: string };
let otherPhotos: { id: string; downloadPath: string }[] = [];

beforeAll(async () => {
  w = await seedWorld();
  const t = w.adminToken;
  lead1 = await makeLead(t, { customerName: `Visit Cust A ${w.tag}`, assignedAgentId: w.agent.id, city: 'Mysuru' });
  lead2 = await makeLead(t, { customerName: `Visit Cust B ${w.tag}`, assignedAgentId: w.agent.id });
  const at = await loginApi(w.agent.email);
  const r1 = await call('/visits', { method: 'POST', token: at, body: { leadId: lead1.id, ...GPS, notes: `Showed the brochure ${w.tag}`, outcome: 'interested', nextFollowUpAt: new Date(Date.now() + 2 * 86400000).toISOString() } });
  expect(r1.status).toBe(201);
  v1 = r1.data;
  photos = await uploadPhotos(at, v1.id, 2);
  const r2 = await call('/visits', { method: 'POST', token: at, body: { leadId: lead2.id, ...GPS, notes: `Nobody home ${w.tag}`, outcome: 'not_available' } });
  expect(r2.status).toBe(201);
  v2 = r2.data;
  otherAgent = await makePerson(t, 'field_agent', `Bravo Visitor ${w.tag}`);
  await call(`/teams/${w.otherTeam.id}/agents`, { method: 'POST', token: t, body: { agentIds: [otherAgent.id] } });
  const ol = await makeLead(t, { customerName: `Bravo Customer ${w.tag}`, assignedAgentId: otherAgent.id });
  const ot = await loginApi(otherAgent.email);
  const ro = await call('/visits', { method: 'POST', token: ot, body: { leadId: ol.id, ...GPS, notes: `Other team visit ${w.tag}`, outcome: 'converted' } });
  expect(ro.status).toBe(201);
  otherVisit = ro.data;
  otherPhotos = await uploadPhotos(ot, otherVisit.id, 1);
});

const vrows = async () => await screen.findAllByTestId('visit-row');
const rowFor = async (text: string): Promise<HTMLElement> =>
  await waitFor(async () => {
    const r = (await vrows()).find((x) => x.textContent?.includes(text));
    if (!r) throw new Error(`no visit row for ${text}`);
    return r;
  });

describe('customer visits (live data)', () => {
  it('lists visits with customer, agent, outcome, GPS link, notes and photo count; no preview banner', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/visits');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: w.agent.name }));
    const row = await rowFor(`Visit Cust A ${w.tag}`);
    expect(within(row).getByText(w.agent.name)).toBeInTheDocument();
    expect(within(row).getByText('Interested')).toBeInTheDocument();
    expect(within(row).getByText(`Showed the brochure ${w.tag}`)).toBeInTheDocument();
    expect(within(row).getByText(/^LD-\d{6} · Mysuru$/)).toBeInTheDocument();
    expect(within(row).getByRole('link')).toHaveAttribute('href', expect.stringContaining('12.9716'));
    expect(within(row).getByText('2')).toBeInTheDocument(); // photo count
    expect(screen.queryByText(/Preview screen\./)).not.toBeInTheDocument();
  });

  it('filters by outcome; an empty range shows an empty state; an invalid range is refused', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/visits');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: w.agent.name }));
    await rowFor(`Visit Cust B ${w.tag}`);
    await ctx.user.selectOptions(screen.getByLabelText('Filter by outcome'), 'not_available');
    await waitFor(async () => {
      const r = await vrows();
      expect(r.length).toBe(1);
      expect(r[0].textContent).toContain(`Visit Cust B ${w.tag}`);
    });
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2020-01-01' } });
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2020-02-01' } });
    expect(await screen.findByText('No customer visits in this range')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2019-01-01' } });
    expect(await screen.findByText('Pick a valid date range')).toBeInTheDocument();
  });

  it('the drawer shows notes, outcome, location, lead link and the photos (fetched with the user’s token)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch');
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/visits');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: w.agent.name }));
    await ctx.user.click(within(await rowFor(`Visit Cust A ${w.tag}`)).getByText(`Visit Cust A ${w.tag}`));
    const drawer = await screen.findByRole('dialog', { name: 'Visit details' });
    expect(within(drawer).getByText(`Showed the brochure ${w.tag}`)).toBeInTheDocument();
    expect(within(drawer).getByText('Interested')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: lead1.leadCode })).toHaveAttribute('href', `/admin/leads?lead=${lead1.id}`);
    expect(within(drawer).getByText(/Next follow-up:/)).toBeInTheDocument();
    const grid = await within(drawer).findByTestId('visit-photos');
    await waitFor(() => expect(within(grid).getAllByRole('img').length).toBe(2));
    expect(within(grid).getAllByRole('img')[0].getAttribute('src')).toMatch(/^blob:/);
    // each photo request carried the bearer token and went to the authenticated download endpoint
    const photoCalls = spy.mock.calls.filter(([u]) => String(u).includes('/documents/') && String(u).endsWith('/download'));
    expect(photoCalls.length).toBeGreaterThanOrEqual(2);
    for (const [, init] of photoCalls) expect((init?.headers as Record<string, string>).authorization).toMatch(/^Bearer /);
    spy.mockRestore();
    await ctx.user.click(within(grid).getAllByRole('button')[0]);
    expect(await screen.findByRole('dialog', { name: 'Visit photo' })).toBeInTheDocument();
  });

  it('photos are private: no token → 401; a leader of another team → 404; the owner’s manager → 200', async () => {
    const url = (p: string) => `${API.replace('/api/v1', '')}${p}`;
    expect((await fetch(url(photos[0].downloadPath))).status).toBe(401);
    const otherLeaderToken = await loginApi(w.otherLeader.email);
    expect((await fetch(url(photos[0].downloadPath), { headers: { authorization: `Bearer ${otherLeaderToken}` } })).status).toBe(404);
    const mgr = await loginApi(w.manager.email);
    const ok = await fetch(url(photos[0].downloadPath), { headers: { authorization: `Bearer ${mgr}` } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('cache-control')).toContain('no-store');
  });

  it('a manager can correct notes and outcome; the change persists', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/visits');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: w.agent.name }));
    await ctx.user.click(within(await rowFor(`Visit Cust B ${w.tag}`)).getByText(`Visit Cust B ${w.tag}`));
    const drawer = await screen.findByRole('dialog', { name: 'Visit details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /edit visit/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit visit' });
    await ctx.user.selectOptions(within(dialog).getByLabelText('Outcome'), 'follow_up_required');
    await ctx.user.selectOptions(within(dialog).getByLabelText('Status'), 'rescheduled');
    await ctx.user.clear(within(dialog).getByLabelText('Notes'));
    await ctx.user.type(within(dialog).getByLabelText('Notes'), `Rescheduled to Friday ${w.tag}`);
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Visit updated.')).toBeInTheDocument();
    expect((await call(`/visits/${v2.id}`, { token: w.adminToken })).data).toMatchObject({ outcome: 'follow_up_required', status: 'rescheduled', notes: `Rescheduled to Friday ${w.tag}` });
  });

  it('refuses empty notes in the edit form', async () => {
    await loginAsToken(w.manager.email);
    const ctx = renderApp('/admin/visits');
    await ctx.user.selectOptions(await screen.findByLabelText('Filter by agent'), await within(screen.getByLabelText('Filter by agent')).findByRole('option', { name: w.agent.name }));
    await ctx.user.click(within(await rowFor(`Visit Cust A ${w.tag}`)).getByText(`Visit Cust A ${w.tag}`));
    const drawer = await screen.findByRole('dialog', { name: 'Visit details' });
    await ctx.user.click(await within(drawer).findByRole('button', { name: /edit visit/i }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit visit' });
    await ctx.user.clear(within(dialog).getByLabelText('Notes'));
    await ctx.user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText('Visit notes are required.')).toBeInTheDocument();
  });
});

describe('team leader scoping', () => {
  it('sees only their team’s visits and cannot edit', async () => {
    await loginAsToken(w.leader.email);
    const ctx = renderApp('/admin/visits');
    await rowFor(`Visit Cust A ${w.tag}`);
    expect((await vrows()).some((r) => r.textContent?.includes(`Other team visit ${w.tag}`))).toBe(false);
    expect(screen.queryByLabelText('Filter by team')).not.toBeInTheDocument();
    await ctx.user.click(within(await rowFor(`Visit Cust A ${w.tag}`)).getByText(`Visit Cust A ${w.tag}`));
    const drawer = await screen.findByRole('dialog', { name: 'Visit details' });
    expect(within(drawer).queryByRole('button', { name: /edit visit/i })).not.toBeInTheDocument();
    expect((await call(`/visits/${otherVisit.id}`, { token: await loginApi(w.leader.email) })).status).toBe(404);
    expect(otherPhotos.length).toBe(1);
  });
});
