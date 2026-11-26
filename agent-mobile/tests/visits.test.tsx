import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ADMIN, API, GEO, TOKEN_KEY, call, loginApi, makeLead, makePerson, mockGeolocation, pngFile, renderApp, setSettings, uid, uploadPhotosApi } from './helpers';

const tag = uid();
let adminToken: string;
let agent: { id: string; name: string; email: string };
let other: { id: string; name: string; email: string };
const leads: { id: string; leadCode: string; customerName: string }[] = [];
let theirs: { id: string; customerName: string };

beforeAll(async () => {
  adminToken = await loginApi(ADMIN.email, ADMIN.password);
  agent = await makePerson(adminToken, 'field_agent', `Visit Agent ${tag}`);
  other = await makePerson(adminToken, 'field_agent', `Visit Other ${tag}`);
  for (let i = 1; i <= 6; i++) leads.push(await makeLead(adminToken, { customerName: `VCust ${tag} ${i}`, assignedAgentId: agent.id }));
  theirs = await makeLead(adminToken, { customerName: `VTheirs ${tag}`, assignedAgentId: other.id });
});
afterEach(() => mockGeolocation('ok'));

const asAgent = async () => window.localStorage.setItem(TOKEN_KEY, await loginApi(agent.email));
const openRecorder = async (ctx: ReturnType<typeof renderApp>) => {
  await ctx.user.click(await screen.findByRole('button', { name: /record visit/i }));
  return await screen.findByRole('dialog', { name: 'Record visit' });
};
const fill = async (ctx: ReturnType<typeof renderApp>, sheet: HTMLElement, lead: { customerName: string }, notes: string, outcome = 'Interested') => {
  const sel = within(sheet).getByLabelText('Customer *');
  await ctx.user.selectOptions(sel, await within(sel).findByRole('option', { name: new RegExp(lead.customerName) }));
  await ctx.user.selectOptions(within(sheet).getByLabelText('Outcome *'), await within(sheet).findByRole('option', { name: outcome }));
  await ctx.user.type(within(sheet).getByLabelText('Visit notes *'), notes);
};

describe('recording a visit (live data, deterministic GPS)', () => {
  it('records the real GPS fix, notes, outcome, a follow-up and a photo; everything persists and the photo is private', async () => {
    await asAgent();
    mockGeolocation('ok');
    const ctx = renderApp('/visits');
    const sheet = await openRecorder(ctx);
    await waitFor(() => expect(within(sheet).getByTestId('location-ok')).toHaveTextContent('12.97160, 77.59460 (±18 m)'));
    await fill(ctx, sheet, leads[0], `Customer wants a quote ${tag}`);
    const due = new Date(Date.now() + 2 * 86400000);
    const pad = (x: number) => String(x).padStart(2, '0');
    const fu = within(sheet).getByLabelText('Next follow-up (optional)');
    await ctx.user.clear(fu);
    await ctx.user.type(fu, `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T10:00`);
    await ctx.user.upload(within(sheet).getByTestId('photo-input'), pngFile('shopfront.png'));
    expect(await within(sheet).findByTestId('photo-previews')).toBeInTheDocument();
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Save visit' }));

    expect(await screen.findByText('Visit recorded.')).toBeInTheDocument();
    const token = await loginApi(agent.email);
    const list = (await call(`/visits?leadId=${leads[0].id}`, { token })).data;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ outcome: 'interested', notes: `Customer wants a quote ${tag}`, photoCount: 1, agentId: agent.id });
    expect(list[0].location).toMatchObject({ latitude: GEO.latitude, longitude: GEO.longitude, accuracy: GEO.accuracy });
    expect(list[0].followUpId).toBeTruthy();
    expect((await call(`/leads/${leads[0].id}`, { token })).data.status).toBe('interested');

    // the stored photo has the exact bytes we sent, and is not public
    const docs = (await call(`/leads/${leads[0].id}/documents`, { token })).data;
    const url = `${API.replace('/api/v1', '')}${docs[0].downloadPath}`;
    expect((await fetch(url)).status).toBe(401);
    const bytes = new Uint8Array(await (await fetch(url, { headers: { authorization: `Bearer ${token}` } })).arrayBuffer());
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);
    // and it shows in the visit list
    const card = await screen.findByTestId('visit-card');
    expect(card).toHaveTextContent(`VCust ${tag} 1`);
    expect(card).toHaveTextContent('1 photo');
  });

  it('refuses to save without a GPS fix; Try again after allowing location then saves', async () => {
    await asAgent();
    mockGeolocation('denied');
    const ctx = renderApp('/visits');
    const sheet = await openRecorder(ctx);
    expect(await within(sheet).findByTestId('location-error')).toHaveTextContent(/permission was denied/i);
    await fill(ctx, sheet, leads[1], `Needs GPS ${tag}`);
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Save visit' }));
    expect(await within(sheet).findByText('A GPS location is required to record a visit')).toBeInTheDocument();
    expect((await call(`/visits?leadId=${leads[1].id}`, { token: await loginApi(agent.email) })).data).toHaveLength(0);

    mockGeolocation('ok');
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(within(sheet).getByTestId('location-ok')).toBeInTheDocument());
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Save visit' }));
    expect(await screen.findByText('Visit recorded.')).toBeInTheDocument();
    expect((await call(`/visits?leadId=${leads[1].id}`, { token: await loginApi(agent.email) })).data).toHaveLength(1);
  });

  it('validates the form and only offers this agent’s own leads', async () => {
    await asAgent();
    const ctx = renderApp('/visits');
    const sheet = await openRecorder(ctx);
    await waitFor(() => expect(within(sheet).getByTestId('location-ok')).toBeInTheDocument());
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Save visit' }));
    expect(await within(sheet).findByText('Choose the customer you visited')).toBeInTheDocument();
    expect(within(sheet).getByText('Add visit notes')).toBeInTheDocument();
    const sel = within(sheet).getByLabelText('Customer *');
    await within(sel).findByRole('option', { name: new RegExp(`VCust ${tag} 3`) });
    expect(within(sel).queryByRole('option', { name: new RegExp(theirs.customerName) })).not.toBeInTheDocument();
  });

  it('photo rules: only JPEG/PNG/WebP, at most five, up to 5 MB; checked before anything is uploaded', async () => {
    await asAgent();
    const ctx = renderApp('/visits');
    const sheet = await openRecorder(ctx);
    const loose = userEvent.setup({ applyAccept: false }); // simulate a picker that ignores the accept filter
    await loose.upload(within(sheet).getByTestId('photo-input'), new File(['hello'], 'notes.txt', { type: 'text/plain' }));
    expect(await within(sheet).findByText(/notes\.txt is not a JPEG, PNG or WebP image/)).toBeInTheDocument();
    expect(within(sheet).queryByTestId('photo-previews')).not.toBeInTheDocument();
    await loose.upload(within(sheet).getByTestId('photo-input'), Array.from({ length: 6 }, (_, i) => pngFile(`p${i}.png`)));
    expect(await within(sheet).findByText(/at most 5 photos/)).toBeInTheDocument();
    await loose.upload(within(sheet).getByTestId('photo-input'), new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'huge.png', { type: 'image/png' }));
    expect(await within(sheet).findByText(/huge\.png is larger than 5 MB/)).toBeInTheDocument();
  });

  it('a "photo" whose content is not an image is rejected by the server: the visit is kept and the agent is told', async () => {
    await asAgent();
    const ctx = renderApp('/visits');
    const sheet = await openRecorder(ctx);
    await waitFor(() => expect(within(sheet).getByTestId('location-ok')).toBeInTheDocument());
    await fill(ctx, sheet, leads[2], `Fake photo ${tag}`);
    await ctx.user.upload(within(sheet).getByTestId('photo-input'), new File(['<script>alert(1)</script>'], 'evil.png', { type: 'image/png' }));
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Save visit' }));
    expect(await within(sheet).findByRole('alert')).toHaveTextContent(/visit was saved, but the photos could not be uploaded.*unsupported file type/i);
    const token = await loginApi(agent.email);
    const v = (await call(`/visits?leadId=${leads[2].id}`, { token })).data;
    expect(v).toHaveLength(1);
    expect(v[0].photoCount).toBe(0);
    // no duplicate visit on retry: "Retry photo upload" only re-sends the photos
    expect(within(sheet).getByRole('button', { name: 'Retry photo upload' })).toBeInTheDocument();
    await ctx.user.click(within(sheet).getByRole('button', { name: 'Skip photos and finish' }));
    expect(await screen.findByText('Visit recorded.')).toBeInTheDocument();
    expect((await call(`/visits?leadId=${leads[2].id}`, { token })).data).toHaveLength(1);
  });

  it('the server’s check-in requirement is surfaced when enabled', async () => {
    expect((await setSettings(adminToken, { operational: { requireCheckInForVisits: true } })).status).toBe(200);
    try {
      await asAgent();
      const ctx = renderApp('/visits');
      const sheet = await openRecorder(ctx);
      await waitFor(() => expect(within(sheet).getByTestId('location-ok')).toBeInTheDocument());
      await fill(ctx, sheet, leads[3], `Needs check-in ${tag}`);
      await ctx.user.click(within(sheet).getByRole('button', { name: 'Save visit' }));
      expect(await within(sheet).findByRole('alert')).toHaveTextContent(/Check in for the day before recording a visit/);
      expect((await call(`/visits?leadId=${leads[3].id}`, { token: await loginApi(agent.email) })).data).toHaveLength(0);
    } finally {
      await setSettings(adminToken, { operational: { requireCheckInForVisits: false } });
    }
  });
});

describe('my visits', () => {
  it('lists only this agent’s visits; the detail sheet shows notes, map link and photos fetched with the token', async () => {
    const t = await loginApi(agent.email);
    const lead = await makeLead(adminToken, { customerName: `VList ${tag}`, assignedAgentId: agent.id });
    const v = await call('/visits', { method: 'POST', token: t, body: { leadId: lead.id, ...GEO, notes: `Detail notes ${tag}`, outcome: 'follow_up_required' } });
    expect(v.status).toBe(201);
    await uploadPhotosApi(t, v.data.id, 2);
    const ot = await loginApi(other.email);
    await call('/visits', { method: 'POST', token: ot, body: { leadId: theirs.id, ...GEO, notes: `Not mine ${tag}`, outcome: 'other' } });

    await asAgent();
    const ctx = renderApp('/visits');
    const cards = await screen.findAllByTestId('visit-card');
    expect(cards.some((c) => c.textContent?.includes(`Not mine ${tag}`))).toBe(false);
    const mineCard = await waitFor(async () => {
      const c = (await screen.findAllByTestId('visit-card')).find((x) => x.textContent?.includes(`VList ${tag}`));
      if (!c) throw new Error('missing');
      return c;
    });
    expect(mineCard).toHaveTextContent('2 photos');
    await ctx.user.click(mineCard);
    const sheet = await screen.findByRole('dialog', { name: `VList ${tag}` });
    expect(within(sheet).getByText(`Detail notes ${tag}`)).toBeInTheDocument();
    expect(within(sheet).getByRole('link')).toHaveAttribute('href', expect.stringContaining('openstreetmap.org'));
    const grid = await within(sheet).findByTestId('visit-photos');
    await waitFor(() => expect(within(grid).getAllByRole('img')).toHaveLength(2));
  });
});
