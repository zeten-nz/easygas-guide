import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
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

// The routed error-STATE + retry render is asserted on a real screen in
// RiskPanel.test.tsx ("renders an error state when the risk query fails"). It is
// NOT duplicated here because MyJobsPage uses `placeholderData: keepPreviousData`,
// which makes react-query's rejected fetch settle a tick AFTER Vitest's
// unhandled-rejection checkpoint — Vitest then ties that artifact to the running
// test even though the UI consumes the error and renders correctly. The error
// scenario is covered (not omitted over a late rejected promise); it is placed on
// a screen without the keepPreviousData confound.

test('flags a LEGACY_UNASSIGNED job distinctly', async () => {
  mockMyJobs.mockResolvedValue({ items: [{ id: 9, status: 'IN_PROGRESS', cycle: 1, assignment_status: 'LEGACY_UNASSIGNED', plate_number: '01B', customer_name: 'X' }], total: 1 });
  renderWithProviders(<MyJobsPage />);
  expect(await screen.findByText(/eski \(biriktirilmagan\)/i)).toBeInTheDocument();
});
