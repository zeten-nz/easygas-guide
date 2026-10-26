import { uz } from './messages';

/** Supported user-facing locales: Uzbek (Latin) — default — and Russian (Cyrillic). */
export type Locale = 'uz' | 'ru';

export const LOCALES: readonly Locale[] = ['uz', 'ru'] as const;

/** Uzbek is the default when no explicit preference exists. */
export const DEFAULT_LOCALE: Locale = 'uz';

/** Every translation key, derived from the Uzbek source-of-truth catalogue. */
export type MessageKey = keyof typeof uz;

/** A complete catalogue: every key must be present (compile-time parity). */
export type Messages = Record<MessageKey, string>;

export function isLocale(v: unknown): v is Locale {
  return v === 'uz' || v === 'ru';
}
