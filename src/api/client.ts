import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  timeout: 20_000,
});

/**
 * Session-bound CSRF token (Phase 10A). Issued by the login and /auth/me
 * responses, kept ONLY in memory (never localStorage/cookies) and attached to
 * every state-changing request as x-csrf-token. On page reload the /auth/me
 * bootstrap re-issues it before any mutation can happen.
 */
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase();
  if (csrfToken && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    config.headers.set('x-csrf-token', csrfToken);
  }
  return config;
});

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

/** Extracts the server's structured error, falling back to a generic Uzbek message. */
export function getApiError(err: unknown): ApiErrorPayload {
  if (err instanceof AxiosError) {
    const payload = err.response?.data?.error;
    if (payload && typeof payload.message === 'string') {
      return payload as ApiErrorPayload;
    }
    if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      return { code: 'NETWORK_ERROR', message: "Server bilan aloqa yo'q. Internetni tekshiring." };
    }
  }
  return { code: 'UNKNOWN', message: "Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring." };
}
