import { test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import { I18nProvider } from '../../i18n/i18n';
import type { Job } from '../../types/entities';

let mockUser: { permissions: string[] } | null = null;
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user: mockUser }) }));

vi.mock('../../api/safety.api', () => ({
  assignmentHistory: vi.fn(),
  assignmentCandidates: vi.fn(),
  assignJob: vi.fn(),
}));
import * as safety from '../../api/safety.api';
import { AssignmentPanel } from './AssignmentPanel';

const historyFn = safety.assignmentHistory as unknown as ReturnType<typeof vi.fn>;
const candidatesFn = safety.assignmentCandidates as unknown as ReturnType<typeof vi.fn>;

const job = {
  id: 5,
  status: 'IN_PROGRESS',
  cycle: 1,
  assignedTechnicianId: 3,
  assignedTechnicianName: 'Ali Valiyev',
  assignmentStatus: 'ASSIGNED',
} as unknown as Job;

beforeEach(() => {
  historyFn.mockReset();
  candidatesFn.mockReset();
  historyFn.mockResolvedValue({ history: [] });
});

test('shows the responsible technician and notes step performers are separate', async () => {
  mockUser = { permissions: ['jobs.view'] };
  renderWithProviders(<I18nProvider><AssignmentPanel job={job} onChanged={() => {}} /></I18nProvider>);
  expect(await screen.findByText('Ali Valiyev')).toBeInTheDocument();
  expect(screen.getByText(/checklistda alohida/i)).toBeInTheDocument();
});

test('hides the reassign control from a user without jobs.assign', () => {
  mockUser = { permissions: ['jobs.view'] };
  renderWithProviders(<I18nProvider><AssignmentPanel job={job} onChanged={() => {}} /></I18nProvider>);
  expect(screen.queryByRole('button', { name: /biriktirish/i })).toBeNull();
});

test('a jobs.assign holder can open the dialog and load branch-scoped candidates', async () => {
  mockUser = { permissions: ['jobs.view', 'jobs.assign'] };
  candidatesFn.mockResolvedValue({ candidates: [{ id: 8, name: 'Bek Toshev', role: 'USTA' }] });
  renderWithProviders(<I18nProvider><AssignmentPanel job={job} onChanged={() => {}} /></I18nProvider>);

  await userEvent.click(screen.getByRole('button', { name: /qayta biriktirish/i }));
  // Candidates are fetched only when the dialog opens (not on mount).
  await waitFor(() => expect(candidatesFn).toHaveBeenCalledWith(5));
  expect(await screen.findByRole('option', { name: /Bek Toshev \(USTA\)/i })).toBeInTheDocument();
});

test('renders immutable assignment history when present', async () => {
  mockUser = { permissions: ['jobs.view'] };
  historyFn.mockResolvedValue({
    history: [{ id: 1, technicianId: 3, assignedBy: 2, provenance: 'REASSIGNED', reason: 'almashtirish', createdAt: '2026-09-01T10:00:00Z' }],
  });
  renderWithProviders(<I18nProvider><AssignmentPanel job={job} onChanged={() => {}} /></I18nProvider>);
  expect(await screen.findByText(/Biriktiruv tarixi \(1\)/i)).toBeInTheDocument();
});
