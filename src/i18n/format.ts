import type { Locale } from './types';

/** Maps our locale to a BCP-47 tag for Intl formatting. */
const INTL_LOCALE: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU' };

export function formatDate(value: Date | string | number, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], opts ?? { dateStyle: 'medium' }).format(d);
}

/**
 * Locale-aware date+time, matching the numeric style the app used before
 * (`toLocaleString('uz-UZ')`) so appearance is unchanged for uz and localized for ru.
 */
export function formatDateTime(value: Date | string | number, locale: Locale): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(INTL_LOCALE[locale]);
}

export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], opts).format(value);
}
