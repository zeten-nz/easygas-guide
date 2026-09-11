/* eslint-disable react-refresh/only-export-components --
   The i18n provider and its hooks intentionally live together (one source of
   truth for the context). This module is not a fast-refresh boundary. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { uz } from './messages/uz';
import { ru } from './messages/ru';
import { DEFAULT_LOCALE, isLocale, type Locale, type MessageKey } from './types';

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

const I18nContext = createContext<I18nValue | null>(null);

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

  const t = useMemo<TFunc>(() => {
    const catalog = CATALOGS[locale];
    // Fall back to Uzbek, then the raw key, so a missing string is never blank.
    return (key, vars) => interpolate(catalog[key] ?? uz[key] ?? key, vars);
  }, [locale]);

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

export function useT(): TFunc {
  return useI18n().t;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
