import type { Locale } from './types';

/** Maps our locale to a BCP-47 tag for Intl formatting. */
const INTL_LOCALE: Record<Locale, string> = { uz: 'uz-UZ', ru: 'ru-RU' };

export function formatDate(value: Date | string | number, locale: Locale, opts?: Intl.DateTimeFormatOptions): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], opts ?? { dateStyle: 'medium' }).format(d);
}

export function formatDateTime(value: Date | string | number, locale: Locale): string {
  return formatDate(value, locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatNumber(value: number, locale: Locale, opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], opts).format(value);
}
