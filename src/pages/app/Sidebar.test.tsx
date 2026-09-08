import { test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const user = {
  id: 1,
  firstName: 'A',
  lastName: 'B',
  phone: '+998900000000',
  region: 'Toshkent',
  branchId: null,
  role: 'RAHBAR' as const,
  status: 'ACTIVE' as const,
  avatarUrl: null,
  mustChangePassword: false,
  // RAHBAR-like: can see jobs + users, but NOT branches/templates/risk-policy.
  permissions: ['jobs.view', 'users.view', 'registration.review'] as string[],
};

vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user }) }));

import { Sidebar } from './Sidebar';

test('renders only the nav items the user is authorized for (no dead links)', () => {
  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
  // Always-visible home + authorized items.
  expect(screen.getByRole('link', { name: 'Bosh sahifa' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ishlar' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Xodimlar' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: "So'rovlar" })).toBeInTheDocument();
  // Unauthorized destinations are absent.
  expect(screen.queryByRole('link', { name: 'Filiallar' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Shablonlar' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Xavf siyosati' })).not.toBeInTheDocument();
  // Group headers only show when the group has an item.
  expect(screen.getByText('Xodimlar', { selector: 'p' })).toBeInTheDocument();
  expect(screen.queryByText('Xavfsizlik')).not.toBeInTheDocument();
});
