import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The login page only needs setUser from auth for this flow.
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ setUser: vi.fn() }) }));

import { LoginPage } from './LoginPage';
import { I18nProvider } from '../../i18n/i18n';

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <I18nProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>,
  );
}

test('validation error switches language immediately and keeps typed values (§6 #2)', async () => {
  renderLogin();
  const user = userEvent.setup();

  // The only ARIA textbox is the phone (password input has no textbox role).
  const phone = screen.getByRole('textbox');
  await user.type(phone, '901234567');
  expect((phone as HTMLInputElement).value).toBe('90 123 45 67');

  // Submit with an empty password → Uzbek validation for the password field.
  await user.click(screen.getByRole('button', { name: 'Kirish' }));
  expect(await screen.findByText('Parol kiritilishi shart')).toBeTruthy();

  // Switch to Russian: the ALREADY-VISIBLE validation re-translates in place, and
  // the typed phone value is preserved (no re-submit / no re-validation).
  await user.click(screen.getByRole('button', { name: 'RU' }));
  expect(await screen.findByText('Введите пароль')).toBeTruthy();
  expect(screen.queryByText('Parol kiritilishi shart')).toBeNull();
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('90 123 45 67');
});
