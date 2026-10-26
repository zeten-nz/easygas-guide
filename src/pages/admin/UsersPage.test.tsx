import { test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import { I18nProvider } from '../../i18n/i18n';

const admin = {
  id: 1,
  firstName: 'Admin',
  lastName: 'A',
  phone: '+998900000000',
  region: 'Toshkent',
  branchId: null,
  role: 'ADMIN' as const,
  status: 'ACTIVE' as const,
  avatarUrl: null,
  mustChangePassword: false,
  permissions: ['users.view', 'users.update', 'users.block', 'users.reset_password', 'users.create', 'users.assign_role'] as string[],
};
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user: admin }) }));
vi.mock('../../api/branches.api', () => ({ fetchBranches: vi.fn().mockResolvedValue([]) }));
vi.mock('../../api/users.api', () => ({
  fetchUsers: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  fetchUser: vi.fn(),
  fetchOwnProfile: vi.fn(),
  resetUserPassword: vi.fn(),
}));
import * as usersApi from '../../api/users.api';
import { UsersPage } from './UsersPage';

const mockFetch = usersApi.fetchUsers as unknown as ReturnType<typeof vi.fn>;

const row = {
  id: 7,
  firstName: 'Dilnoza',
  lastName: 'Yusupova',
  phone: '+998901112233',
  region: 'Toshkent',
  role: 'USTA' as const,
  branchId: 3,
  branchName: 'Chilonzor',
  status: 'ACTIVE' as const,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({ users: [row], total: 30, page: 1, limit: 25 });
});

// The directory renders a desktop table AND mobile cards (CSS-toggled), so each
// row appears twice in jsdom — assert on the first and that the name is a link to
// the profile, with row actions in a SEPARATE menu (not a full-row click).
test('renders the directory with a persistent summary and the name as a profile link', async () => {
  renderWithProviders(
    <I18nProvider>
      <UsersPage />
    </I18nProvider>,
  );
  const names = await screen.findAllByRole('link', { name: 'Dilnoza Yusupova' });
  expect(names[0]).toHaveAttribute('href', '/app/admin/users/7');
  expect(screen.getByText((_c, el) => (el?.textContent ?? '').includes('Jami:') && el?.tagName === 'P')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /Dilnoza Yusupova — amallar/ }).length).toBeGreaterThan(0);
});

test('advancing the page refetches with the next page', async () => {
  renderWithProviders(
    <I18nProvider>
      <UsersPage />
    </I18nProvider>,
  );
  await screen.findAllByRole('link', { name: 'Dilnoza Yusupova' });
  await userEvent.click(screen.getByLabelText('Keyingi sahifa'));
  await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 25 })));
});

test('changing the page size refetches at 50 and resets to page 1', async () => {
  renderWithProviders(
    <I18nProvider>
      <UsersPage />
    </I18nProvider>,
  );
  await screen.findAllByRole('link', { name: 'Dilnoza Yusupova' });
  await userEvent.selectOptions(screen.getByLabelText(/qatorlar soni/i), '50');
  await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 50 })));
});
