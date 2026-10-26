import type { TFunc } from './i18n';
import type { MessageKey } from './types';

/**
 * Translates a react-hook-form validation message that was stored as an i18n KEY
 * (not a pre-translated string). Because it resolves at render time, a visible
 * validation error re-translates when the language changes — without touching the
 * form values or re-validating. Unknown strings fall back to themselves via t().
 */
export function fieldError(message: string | undefined, t: TFunc): string | undefined {
  return message ? t(message as MessageKey) : undefined;
}
