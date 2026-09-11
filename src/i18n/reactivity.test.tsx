import { test, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useT, useLocale } from './i18n';
import { LanguageSelector } from '../components/ui/LanguageSelector';
import { localizeApiError } from './api-errors';
import { fieldError } from './form';
import { roleLabel, regionLabel } from './labels';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

/**
 * Exercises the exact render-time mechanisms the pages use, so a visible error /
 * validation / label re-translates the instant the language changes (task §4 #1,
 * #2, #4, #5, #6) — no re-request, no re-validation, no lost state.
 */
function Harness() {
  const t = useT();
  const { locale } = useLocale();
  return (
    <div>
      <LanguageSelector />
      <span data-testid="err-known">{localizeApiError('INVALID_CREDENTIALS', t)}</span>
      <span data-testid="err-unknown">{localizeApiError('TOTALLY_UNKNOWN_CODE', t)}</span>
      <span data-testid="role">{roleLabel('ADMIN', t)}</span>
      <span data-testid="region">{regionLabel('Andijon', locale)}</span>
      <span data-testid="field">{fieldError('valid.phoneRequired', t)}</span>
    </div>
  );
}

test('API errors, validation, role & region labels re-translate on language switch', async () => {
  render(
    <I18nProvider>
      <Harness />
    </I18nProvider>,
  );

  // Uzbek (default)
  expect(screen.getByTestId('err-known').textContent).toBe("Telefon raqam yoki parol noto'g'ri");
  expect(screen.getByTestId('err-unknown').textContent).toBe("Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.");
  expect(screen.getByTestId('role').textContent).toBe('Administrator');
  expect(screen.getByTestId('region').textContent).toBe('Andijon');
  expect(screen.getByTestId('field').textContent).toBe('Telefon raqam kiritilishi shart');

  await act(async () => {
    await userEvent.click(screen.getByRole('button', { name: 'RU' }));
  });

  // Russian — same nodes, re-translated (an unknown code stays a SAFE localized fallback)
  expect(screen.getByTestId('err-known').textContent).toBe('Неверный номер телефона или пароль');
  expect(screen.getByTestId('err-unknown').textContent).toBe('Произошла непредвиденная ошибка. Повторите попытку.');
  expect(screen.getByTestId('role').textContent).toBe('Администратор');
  expect(screen.getByTestId('region').textContent).toBe('Андижан');
  expect(screen.getByTestId('field').textContent).toBe('Введите номер телефона');
});
