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
/**
 * Phase 10C: the session token rotates server-side, and the CSRF token is
 * HMAC(cookie), so it changes on rotation. Each authenticated response carries
 * the current token and a monotonic rotation sequence; we only adopt a token
 * whose sequence is NEWER than the one we hold, so an out-of-order (slower,
 * older) parallel response can never overwrite a newer CSRF token.
 */
let csrfRotationSeq = -1;

export function setCsrfToken(token: string | null, seq?: number): void {
  csrfToken = token;
  if (token === null) {
    csrfRotationSeq = -1; // logout / definitive expiry resets the baseline
  } else if (typeof seq === 'number' && Number.isFinite(seq)) {
    csrfRotationSeq = seq; // login / /auth/me set the baseline sequence
  }
}

/** Adopts a rotated CSRF token from a response, guarding against older ones. */
function adoptRotatedCsrf(headers: unknown): void {
  const h = headers as Record<string, string | undefined> | undefined;
  const token = h?.['x-csrf-token'];
  const seqRaw = h?.['x-session-rotation'];
  if (typeof token === 'string' && token.length > 0 && seqRaw !== undefined) {
    const seq = Number(seqRaw);
    if (Number.isFinite(seq) && seq > csrfRotationSeq) {
      csrfToken = token;
      csrfRotationSeq = seq;
    }
  }
}

api.interceptors.request.use((config) => {
  const method = (config.method ?? 'get').toUpperCase();
  if (csrfToken && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    config.headers.set('x-csrf-token', csrfToken);
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    adoptRotatedCsrf(res.headers);
    return res;
  },
  (err: unknown) => {
    if (err instanceof AxiosError && err.response) {
      // A response arrived (not a network/offline error) — adopt any rotated CSRF.
      adoptRotatedCsrf(err.response.headers);
      if (err.response.status === 401) {
        // Definitive auth failure (distinct from a transient/offline error, which
        // has no response). Drop CSRF state and notify the app once; the route
        // guards perform the single redirect to login — no redirect loop.
        csrfToken = null;
        csrfRotationSeq = -1;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('easygas:session-expired'));
        }
      }
    }
    return Promise.reject(err);
  },
);

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: { field: string; message: string }[];
}

/**
 * Phase 10B: classifies an evidence-upload failure for the UI. Storage/network
 * failures are retryable (the file was never accepted, safe to resend); a
 * validation rejection (wrong type, too large) is permanent until the user
 * picks a different file.
 */
export function getUploadError(err: unknown): { message: string; retryable: boolean } {
  const e = getApiError(err);
  const permanentCodes = ['INVALID_FILE_TYPE', 'IMAGE_TOO_LARGE', 'FILE_TOO_LARGE', 'NO_FILE'];
  const retryableCodes = ['STORAGE_UNAVAILABLE', 'NETWORK_ERROR', 'STEP_STATE_CHANGED', 'JOB_STATE_CHANGED', 'UNKNOWN'];
  const retryable = retryableCodes.includes(e.code) || !permanentCodes.includes(e.code);
  return {
    message: retryable ? `${e.message}${/qayta urin/i.test(e.message) ? '' : " — qayta urinib ko'ring"}` : e.message,
    retryable,
  };
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
