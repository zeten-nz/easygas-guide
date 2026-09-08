import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';

vi.mock('../../api/users.api', () => ({ fetchOwnProfile: vi.fn() }));
import { fetchOwnProfile } from '../../api/users.api';
import { ProfilePage } from './ProfilePage';

const mock = fetchOwnProfile as unknown as ReturnType<typeof vi.fn>;
beforeEach(() => mock.mockReset());

const profile = {
  id: 5,
  firstName: 'Jasur',
  lastName: 'Karimov',
  phone: '+998901234567',
  region: 'Toshkent shahri',
  role: 'ADMIN' as const,
  branchId: null,
  branchName: null,
  status: 'ACTIVE' as const,
  lastLoginAt: null,
  createdAt: '2026-01-15T00:00:00.000Z',
};

test('shows the own-profile identity, a truthful no-branch state, and a password-change path', async () => {
  mock.mockResolvedValue(profile);
  renderWithProviders(<ProfilePage />);
  expect(await screen.findByText('Jasur Karimov')).toBeInTheDocument();
  expect(screen.getByText('+998 90 123 45 67')).toBeInTheDocument();
  expect(screen.getByText('Filial biriktirilmagan')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /parolni o'zgartirish/i })).toBeInTheDocument();
});

test('shows an error state when the profile cannot be loaded', async () => {
  mock.mockRejectedValueOnce(new Error('offline'));
  renderWithProviders(<ProfilePage />);
  expect(await screen.findByText(/Kutilmagan xatolik|offline/i)).toBeInTheDocument();
  expect(screen.queryByText('Jasur Karimov')).not.toBeInTheDocument();
});
