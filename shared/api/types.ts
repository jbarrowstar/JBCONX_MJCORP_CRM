/** Wire format shared with the backend (see backend docs/API_CONTRACT.md). */

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  meta: Partial<PageMeta> & Record<string, unknown>;
}

export interface ApiErrorDetail {
  path?: string;
  message: string;
  [key: string]: unknown;
}

export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details: ApiErrorDetail[] };
}

export interface Paged<T> {
  items: T[];
  meta: PageMeta;
}

/** Normalised error every screen can show. */
export interface AppApiError {
  status: number | 'NETWORK' | 'PARSE' | 'TIMEOUT' | 'UNKNOWN';
  code: string;
  message: string;
  details: ApiErrorDetail[];
}

export const unwrap = <T,>(r: ApiSuccess<T>): T => r.data;

export const unwrapPaged = <T,>(r: ApiSuccess<T[]>): Paged<T> => ({
  items: r.data,
  meta: {
    total: Number(r.meta.total ?? r.data.length),
    page: Number(r.meta.page ?? 1),
    limit: Number(r.meta.limit ?? r.data.length),
    totalPages: Number(r.meta.totalPages ?? 1),
  },
});
