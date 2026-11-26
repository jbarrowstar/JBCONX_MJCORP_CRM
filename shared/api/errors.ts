import type { ApiErrorDetail, AppApiError } from './types';

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Turn anything thrown by RTK Query (`.unwrap()` rejection or `error` field) into one predictable shape. */
export const normalizeError = (err: unknown): AppApiError => {
  if (isObject(err) && 'status' in err) {
    const status = err.status;
    const data = err.data;

    if (isObject(data) && isObject(data.error)) {
      const e = data.error;
      return {
        status: typeof status === 'number' ? status : 'UNKNOWN',
        code: typeof e.code === 'string' ? e.code : 'UNKNOWN',
        message: typeof e.message === 'string' ? e.message : 'Something went wrong',
        details: Array.isArray(e.details) ? (e.details as ApiErrorDetail[]) : [],
      };
    }
    if (status === 'FETCH_ERROR') {
      return { status: 'NETWORK', code: 'NETWORK', message: 'Cannot reach the server. Check your connection and try again.', details: [] };
    }
    if (status === 'PARSING_ERROR') {
      return { status: 'PARSE', code: 'PARSE', message: 'The server sent an unexpected response.', details: [] };
    }
    if (status === 'TIMEOUT_ERROR') {
      return { status: 'TIMEOUT', code: 'TIMEOUT', message: 'The request timed out. Please try again.', details: [] };
    }
    if (typeof status === 'number') {
      return { status, code: 'HTTP_' + status, message: `Request failed (${status})`, details: [] };
    }
  }
  return { status: 'UNKNOWN', code: 'UNKNOWN', message: err instanceof Error ? err.message : 'Something went wrong', details: [] };
};

export const errorMessage = (err: unknown): string => normalizeError(err).message;

/** Map backend validation details ({path, message}) to form field errors. */
export const fieldErrors = (err: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const d of normalizeError(err).details) {
    if (d.path && !out[d.path]) out[d.path] = d.message;
  }
  return out;
};
