import { test, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useLocale, useT } from './i18n';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { uz, ru } from './messages';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  document.documentElement.lang = '';
});

// ---- Translation coverage / parity ------------------------------------------

test('uz and ru catalogues have identical keys (no missing/extra translations)', () => {
  const uzKeys = Object.keys(uz).sort();
  const ruKeys = Object.keys(ru).sort();
  expect(ruKeys).toEqual(uzKeys);
});

test('no translation value is unexpectedly empty in either locale', () => {
  // A few keys are deliberately blank: the risk activate/retire modals put the
  // exact version in a standalone <b>, so the uz sentence prefix is empty.
  const ALLOW_EMPTY = new Set(['rp.activate.bodyPrefix', 'rp.retire.bodyPrefix']);
  for (const [k, v] of Object.entries(uz)) if (!ALLOW_EMPTY.has(k)) expect(v, `uz.${k}`).not.toBe('');
  for (const [k, v] of Object.entries(ru)) if (!ALLOW_EMPTY.has(k)) expect(v, `ru.${k}`).not.toBe('');
});

// ---- Interpolation ----------------------------------------------------------

function Probe() {
  const t = useT();
  const { locale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="submit">{t('login.submit')}</span>
      <span data-testid="welcome">{t('home.welcome', { name: 'Ali' })}</span>
    </div>
  );
}

test('t() interpolates {name} and leaves no placeholder behind', () => {
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  const welcome = screen.getByTestId('welcome').textContent ?? '';
  expect(welcome).toContain('Ali');
  expect(welcome).not.toContain('{name}');
});

// ---- Default locale + persistence -------------------------------------------

test('defaults to Uzbek when no preference is stored', () => {
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  expect(screen.getByTestId('locale').textContent).toBe('uz');
  expect(screen.getByTestId('submit').textContent).toBe('Kirish');
  expect(document.documentElement.lang).toBe('uz');
});

test('restores a previously saved language preference', () => {
  localStorage.setItem('eg.lang', 'ru');
  render(
    <I18nProvider>
      <Probe />
    </I18nProvider>,
  );
  expect(screen.getByTestId('locale').textContent).toBe('ru');
  expect(screen.getByTestId('submit').textContent).toBe('Войти');
});

test('LanguageSelector switches locale, persists it, and updates <html lang>', async () => {
  render(
    <I18nProvider>
      <LanguageSelector />
      <Probe />
    </I18nProvider>,
  );

  // Starts on Uzbek.
  expect(screen.getByTestId('submit').textContent).toBe('Kirish');
  const ruButton = screen.getByRole('button', { name: 'RU' });
  expect(ruButton).toHaveAttribute('aria-pressed', 'false');

  await act(async () => {
    await userEvent.click(ruButton);
  });

  // Switched to Russian, reflected in the UI, storage and <html lang>.
  expect(screen.getByTestId('submit').textContent).toBe('Войти');
  expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'true');
  expect(localStorage.getItem('eg.lang')).toBe('ru');
  expect(document.documentElement.lang).toBe('ru');
});
