import '@testing-library/jest-dom/vitest';
import './multipartShim';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

configure({ asyncUtilTimeout: 10000 });

if (!import.meta.env.VITE_API_BASE_URL) {
  throw new Error('VITE_API_BASE_URL must point at a TEST backend to run these tests');
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

// happy-dom's Response.clone() drops the body, which makes RTK Query see empty JSON.
// Buffer every response so clone()/text() behave like in a real browser. (Test environment only.)
const realFetch = globalThis.fetch.bind(globalThis);
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  // route FormData bodies through the (shimmed) Request so they are encoded correctly
  const res = init?.body instanceof FormData ? await realFetch(new Request(input as RequestInfo, init)) : await realFetch(input, init);
  const bytes = await res.arrayBuffer(); // bytes, not text: downloads (photos) are binary
  return new Response(bytes, { status: res.status, statusText: res.statusText, headers: res.headers });
}) as typeof fetch;

// happy-dom has no object URLs for Blobs; photos are displayed through them.
let objectUrlCounter = 0;
if (!(URL as unknown as { createObjectURL?: unknown }).createObjectURL) {
  (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = () => `blob:test/${++objectUrlCounter}`;
  (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => undefined;
}
