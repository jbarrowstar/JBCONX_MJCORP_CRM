import { fetchBaseQuery } from '@reduxjs/toolkit/query';
import type { BaseQueryApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

export interface CreateBaseQueryOptions {
  baseUrl: string;
  getToken: (api: Pick<BaseQueryApi, 'getState'>) => string | null;
  /** Called when the server says the session is no longer valid (expired / revoked / deactivated). */
  onUnauthorized: (api: BaseQueryApi) => void;
  /**
   * DEVELOPMENT-ONLY: answers requests in the browser instead of calling the API (mock mode).
   * Undefined in production builds; when undefined the real network transport is used.
   */
  mockTransport?: (args: string | FetchArgs, token: string | null) => Promise<{ data: unknown } | { error: { status: number; data: unknown } }>;
}

const SESSION_CODES = new Set(['AUTH_REQUIRED', 'AUTH_INVALID_TOKEN']);

/**
 * fetchBaseQuery + bearer token + automatic sign-out when the session dies.
 * Wrong-password errors from the login call use a different code (AUTH_INVALID_CREDENTIALS) and are NOT treated as a dead session.
 */
export const createBaseQuery = (opts: CreateBaseQueryOptions): BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> => {
  const raw = fetchBaseQuery({
    baseUrl: opts.baseUrl,
    timeout: 30000,
    prepareHeaders: (headers, api) => {
      const token = opts.getToken(api);
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  });

  return async (args, api, extra) => {
    const result = opts.mockTransport
      ? ((await opts.mockTransport(args, opts.getToken(api))) as Awaited<ReturnType<typeof raw>>)
      : await raw(args, api, extra);
    if (result.error && result.error.status === 401) {
      const data = result.error.data as { error?: { code?: string } } | undefined;
      if (data?.error?.code && SESSION_CODES.has(data.error.code)) {
        opts.onUnauthorized(api);
      }
    }
    return result;
  };
};

export const resolveApiBaseUrl = (configured: string | undefined, isDev: boolean): string => {
  const value = (configured ?? '').trim().replace(/\/+$/, '');
  if (value) return value;
  if (isDev) return 'http://localhost:5000/api/v1';
  throw new Error('VITE_API_BASE_URL is not set. Configure it at build time (see .env.example).');
};
