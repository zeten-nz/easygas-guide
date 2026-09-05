import { test, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../api/auth.api', () => ({ fetchMe: vi.fn(), logout: vi.fn() }));
import * as authApi from '../../api/auth.api';
import { AuthProvider, useAuth } from './auth-context';

const fetchMe = authApi.fetchMe as unknown as ReturnType<typeof vi.fn>;

function Probe() {
  const { user } = useAuth();
  return <div>{user ? `user:${user.firstName}` : 'no-user'}</div>;
}

function renderAuth() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => fetchMe.mockReset());

test('a definitive 401 (session-expired event) clears the authenticated user — no redirect loop', async () => {
  fetchMe.mockResolvedValue({ id: 1, firstName: 'Ali', lastName: 'V', permissions: [] });
  renderAuth();
  expect(await screen.findByText('user:Ali')).toBeInTheDocument();

  // The API client fires this once on a confirmed 401.
  act(() => {
    window.dispatchEvent(new CustomEvent('easygas:session-expired'));
  });
  await waitFor(() => expect(screen.getByText('no-user')).toBeInTheDocument());
});
