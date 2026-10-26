/* eslint-disable react-refresh/only-export-components --
   The i18n provider and its hooks intentionally live together (one source of
   truth for the context). This module is not a fast-refresh boundary. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { uz, ru } from './messages';
import { DEFAULT_LOCALE, isLocale, type Locale, type MessageKey } from './types';
import { formatDate, formatDateTime, formatNumber } from './format';

const CATALOGS: Record<Locale, Record<MessageKey, string>> = { uz, ru };
const STORAGE_KEY = 'eg.lang';

type Vars = Record<string, string | number>;
export type TFunc = (key: MessageKey, vars?: Vars) => string;

/** Replaces {name} placeholders; unknown placeholders are left intact. */
function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Reads the saved preference; falls back to Uzbek. Storage may throw (private mode). */
function readStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (isLocale(v)) return v;
  } catch {
    /* storage unavailable — use the default */
  }
  return DEFAULT_LOCALE;
}

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFunc;
}

/** Builds a translator for a locale (catalog → Uzbek → raw-key fallback chain). */
function buildT(locale: Locale): TFunc {
  const catalog = CATALOGS[locale];
  return (key, vars) => interpolate(catalog[key] ?? uz[key] ?? key, vars);
}

const I18nContext = createContext<I18nValue | null>(null);

/**
 * Default context used when a component renders OUTSIDE an <I18nProvider> (the
 * real app always wraps in one — see app/providers). Rather than throwing, we
 * fall back to Uzbek (the default locale) with a no-op setter, so a generic leaf
 * like <Spinner> that reads a label can render anywhere (e.g. in a focused unit
 * test) without a provider. Locale switching still requires the provider.
 */
const DEFAULT_CTX: I18nValue = { locale: DEFAULT_LOCALE, setLocale: () => {}, t: buildT(DEFAULT_LOCALE) };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  // Keep <html lang> in sync for a11y / screen readers / browser hyphenation.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore — the choice still applies for this session */
    }
  }, []);

  const t = useMemo<TFunc>(() => buildT(locale), [locale]);

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  return useContext(I18nContext) ?? DEFAULT_CTX;
}

export function useT(): TFunc {
  return useI18n().t;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}

/** Locale-aware date/time formatter bound to the current locale (uz-UZ / ru-RU). */
export function useDateTime(): (value: Date | string | number) => string {
  const { locale } = useI18n();
  return (value) => formatDateTime(value, locale);
}

/** Locale-aware date formatter (optional Intl options) bound to the current locale. */
export function useDate(): (value: Date | string | number, opts?: Intl.DateTimeFormatOptions) => string {
  const { locale } = useI18n();
  return (value, opts) => formatDate(value, locale, opts);
}

/** Locale-aware number formatter bound to the current locale. */
export function useNumber(): (value: number, opts?: Intl.NumberFormatOptions) => string {
  const { locale } = useI18n();
  return (value, opts) => formatNumber(value, locale, opts);
}
