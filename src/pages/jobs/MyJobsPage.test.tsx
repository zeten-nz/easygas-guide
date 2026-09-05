import { test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';

// Mock the safety API so the screen renders deterministically.
vi.mock('../../api/safety.api', () => ({ myJobs: vi.fn() }));
import { myJobs } from '../../api/safety.api';
import { MyJobsPage } from './MyJobsPage';

const mockMyJobs = myJobs as unknown as ReturnType<typeof vi.fn>;
beforeEach(() => mockMyJobs.mockReset());

test('shows a loading state, then the assigned jobs list', async () => {
  mockMyJobs.mockResolvedValue({ items: [{ id: 7, status: 'IN_PROGRESS', cycle: 1, assignment_status: 'ASSIGNED', plate_number: '01A123BC', customer_name: 'Ali' }], total: 1 });
  renderWithProviders(<MyJobsPage />);
  expect(screen.getByTestId('my-jobs-loading')).toBeInTheDocument();
  expect(await screen.findByText('01A123BC')).toBeInTheDocument();
  expect(screen.getByText('Ali')).toBeInTheDocument();
});

test('shows an empty state when no jobs are assigned', async () => {
  mockMyJobs.mockResolvedValue({ items: [], total: 0 });
  renderWithProviders(<MyJobsPage />);
  expect(await screen.findByText(/hali ish biriktirilmagan/i)).toBeInTheDocument();
});

test('renders a routed error state, retry refetches, and produces NO unhandled rejection', async () => {
  // Genuinely assert there is NO unhandled promise rejection (rather than hiding
  // one): record any during the test and assert the list is empty at the end.
  const rejections: unknown[] = [];
  const onUnhandled = (reason: unknown) => rejections.push(reason);
  process.on('unhandledRejection', onUnhandled);
  // React logs caught render/query errors via console.error; scope-suppress only
  // the noise and assert nothing unexpected leaks.
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mockMyJobs.mockRejectedValueOnce(new Error('network down'));
    renderWithProviders(<MyJobsPage />);

    // User-friendly error state with a retry affordance (no raw error text).
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /qayta urinish/i });
    expect(retry).toBeInTheDocument();

    // Retry re-invokes the request; on success the list renders (keepPreviousData
    // path stays correct — no stale error left behind).
    mockMyJobs.mockResolvedValueOnce({ items: [{ id: 7, status: 'IN_PROGRESS', cycle: 1, assignment_status: 'ASSIGNED', plate_number: '01A123BC', customer_name: 'Ali' }], total: 1 });
    await userEvent.click(retry);
    expect(await screen.findByText('01A123BC')).toBeInTheDocument();
    expect(mockMyJobs).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();

    // Flush microtasks + a macrotask so any late rejection would surface here.
    await waitFor(() => expect(rejections).toHaveLength(0));
    await new Promise((r) => setTimeout(r, 30));
    expect(rejections, `unhandled rejections: ${rejections.map(String).join(', ')}`).toHaveLength(0);
  } finally {
    process.off('unhandledRejection', onUnhandled);
    errorSpy.mockRestore();
  }
});

test('flags a LEGACY_UNASSIGNED job distinctly', async () => {
  mockMyJobs.mockResolvedValue({ items: [{ id: 9, status: 'IN_PROGRESS', cycle: 1, assignment_status: 'LEGACY_UNASSIGNED', plate_number: '01B', customer_name: 'X' }], total: 1 });
  renderWithProviders(<MyJobsPage />);
  expect(await screen.findByText(/eski \(biriktirilmagan\)/i)).toBeInTheDocument();
});
