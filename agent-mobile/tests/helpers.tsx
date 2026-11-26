import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { store } from '../src/redux/store';
import { baseApi } from '../src/redux/services/baseApi';
import { resetAuth } from '../src/redux/slices/authSlice';
import { dismissToast } from '../src/redux/slices/toastSlice';
import { AuthGate } from '../src/features/auth/AuthGate';
import { AppRoutes } from '../src/routes';

export const API = import.meta.env.VITE_API_BASE_URL as string;
export const PASSWORD = 'Str0ng-Test-Pass1';
export const TOKEN_KEY = 'jbconx.crm.token';
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL ?? '', password: process.env.E2E_ADMIN_PASSWORD ?? '' };
export const uid = () => Math.random().toString(36).slice(2, 8);

export const call = async (path: string, opts: { method?: string; token?: string; body?: unknown } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? 'GET',
    headers: { 'content-type': 'application/json', ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json()) as { success: boolean; data: any; error?: { code: string; message: string } };
  return { status: res.status, ...json };
};

export const loginApi = async (email: string, password = PASSWORD): Promise<string> => {
  const r = await call('/auth/login', { method: 'POST', body: { email, password } });
  if (r.status !== 200) throw new Error(`login failed for ${email}: ${JSON.stringify(r)}`);
  return r.data.token as string;
};

export const makePerson = async (adminToken: string, role: string, name: string, extra: Record<string, unknown> = {}) => {
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@e2e.test`;
  const r = await call('/users', { method: 'POST', token: adminToken, body: { name, email, password: PASSWORD, role, ...extra } });
  if (r.status !== 201) throw new Error(`create ${role} failed: ${JSON.stringify(r)}`);
  return { id: r.data.id as string, name, email };
};

export const resetStore = () => {
  store.dispatch(baseApi.util.resetApiState());
  store.dispatch(resetAuth());
  store.getState().toast.items.forEach((t) => store.dispatch(dismissToast(t.id)));
};

export const renderApp = (route = '/') => {
  resetStore();
  const user = userEvent.setup();
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <AuthGate>
          <AppRoutes />
        </AuthGate>
      </MemoryRouter>
    </Provider>
  );
  return { store, user, ...utils };
};

export const makeLead = async (token: string, over: Record<string, unknown> = {}) => {
  const body = {
    customerName: `Cust ${uid()}`,
    mobileNumber: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
    city: 'Pune', state: 'MH', leadSource: 'Referral', interestedService: 'Solar install', ...over,
  };
  const r = await call('/leads', { method: 'POST', token, body });
  if (r.status !== 201) throw new Error(`create lead failed: ${JSON.stringify(r)}`);
  return r.data as { id: string; leadCode: string; customerName: string; mobileNumber: string };
};

export const makeFollowUp = async (token: string, leadId: string, dueAt: Date, type = 'call', notes?: string) => {
  const r = await call('/followups', { method: 'POST', token, body: { leadId, type, dueAt: dueAt.toISOString(), ...(notes && { notes }) } });
  if (r.status !== 201) throw new Error(`create follow-up failed: ${JSON.stringify(r)}`);
  return r.data as { id: string };
};

export const minutesFromNow = (m: number) => new Date(Date.now() + m * 60000);

export const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4, 5, 6, 7, 8]);
export const pngFile = (name = 'photo.png') => new File([PNG_BYTES], name, { type: 'image/png' });

export const setSettings = (adminToken: string, body: unknown) => call('/settings', { method: 'PATCH', token: adminToken, body });

type GeoMode = 'ok' | 'denied' | 'timeout' | 'unavailable' | 'unsupported';
export const GEO = { latitude: 12.9716, longitude: 77.5946, accuracy: 18 };

/** Replace the browser geolocation API with a deterministic fake (the test never pretends a real device is present). */
export const mockGeolocation = (mode: GeoMode, coords = GEO) => {
  const value =
    mode === 'unsupported'
      ? undefined
      : {
          getCurrentPosition: (ok: (p: unknown) => void, err: (e: unknown) => void) => {
            if (mode === 'ok') ok({ coords });
            else err({ code: mode === 'denied' ? 1 : mode === 'timeout' ? 3 : 2, message: mode });
          },
        };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value });
};

export const uploadPhotosApi = async (token: string, visitId: string, count = 1) => {
  const fd = new FormData();
  for (let i = 0; i < count; i++) fd.append('photos', new Blob([PNG_BYTES], { type: 'image/png' }), `shot-${i + 1}.png`);
  const res = await fetch(`${API}/visits/${visitId}/photos`, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: fd });
  const json = await res.json();
  if (res.status !== 201) throw new Error(`photo upload failed: ${res.status} ${JSON.stringify(json)}`);
  return json.data as { id: string; downloadPath: string }[];
};

export const dayKey = (offset = 0) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
