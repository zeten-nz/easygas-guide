import type { TFunc } from './i18n';
import type { MessageKey } from './types';

/**
 * Maps STABLE backend error codes (from the API's `{ code, message }` payload) to
 * localized message keys. The server's own `message` is Uzbek-only, so for other
 * locales we must translate by code here rather than echoing the server text.
 * Unknown codes fall back to a localized generic message — a raw backend string,
 * internal enum, or technical code is never shown to the user.
 */
const CODE_TO_KEY: Record<string, MessageKey> = {
  INVALID_CREDENTIALS: 'error.INVALID_CREDENTIALS',
  INVALID_CURRENT_PASSWORD: 'error.INVALID_CURRENT_PASSWORD',
  PASSWORD_REUSE: 'error.PASSWORD_REUSE',
  TEMP_PASSWORD_EXPIRED: 'error.TEMP_PASSWORD_EXPIRED',
  INVALID_BRANCH: 'error.INVALID_BRANCH',
  VALIDATION_ERROR: 'error.VALIDATION_ERROR',
  TOO_MANY_REQUESTS: 'error.TOO_MANY_REQUESTS',
  NETWORK_ERROR: 'error.NETWORK_ERROR',
  NOT_FOUND: 'error.NOT_FOUND',
};

/** Returns a localized, user-safe message for an API error code. */
export function localizeApiError(code: string | undefined | null, t: TFunc): string {
  const key = code ? CODE_TO_KEY[code] : undefined;
  return key ? t(key) : t('error.fallback');
}
