import { test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';

let mockUser: { permissions: string[] } | null = null;
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user: mockUser }) }));

vi.mock('../../api/safety.api', () => ({ captureGps: vi.fn(), overrideGps: vi.fn() }));
vi.mock('../../api/jobs.api', () => ({ startJob: vi.fn() }));
import * as safety from '../../api/safety.api';
import * as jobsApi from '../../api/jobs.api';
import { StartJobModal } from './StartJobModal';

const overrideGps = safety.overrideGps as unknown as ReturnType<typeof vi.fn>;
const startJob = jobsApi.startJob as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  overrideGps.mockReset();
  startJob.mockReset();
});

test('embeds an explicit-click GPS capture in the start action (no auto-request)', () => {
  mockUser = { permissions: ['checklist.execute'] };
  renderWithProviders(<StartJobModal jobId={5} plateNumber="01A" open onClose={() => {}} onStarted={() => {}} />);
  // The capture is a button the user must press — not requested on mount.
  expect(screen.getByRole('button', { name: /joylashuvni olish/i })).toBeInTheDocument();
});

test('hides the GPS override option from a user without gps.override', () => {
  mockUser = { permissions: ['checklist.execute'] };
  renderWithProviders(<StartJobModal jobId={5} plateNumber="01A" open onClose={() => {}} onStarted={() => {}} />);
  expect(screen.queryByText(/override qayd etish/i)).toBeNull();
});

test('an authorized user records a GPS override WITH a reason', async () => {
  mockUser = { permissions: ['checklist.execute', 'gps.override'] };
  overrideGps.mockResolvedValue({ id: 1 });
  renderWithProviders(<StartJobModal jobId={5} plateNumber="01A" open onClose={() => {}} onStarted={() => {}} />);

  await userEvent.click(screen.getByText(/gps mavjud emas — override/i));
  const reason = screen.getByPlaceholderText(/override sababi/i);
  // Reason is required — the save button is disabled until it is filled.
  const save = screen.getByRole('button', { name: /override saqlash/i });
  expect(save).toBeDisabled();
  await userEvent.type(reason, 'Yer osti signal yoq');
  expect(save).toBeEnabled();
  await userEvent.click(save);

  await waitFor(() => expect(overrideGps).toHaveBeenCalledWith(5, 'Yer osti signal yoq', 'JOB_START'));
  expect(await screen.findByText(/override qayd etildi/i)).toBeInTheDocument();
});

test('starting the job calls the start endpoint', async () => {
  mockUser = { permissions: ['checklist.execute'] };
  startJob.mockResolvedValue({ id: 5 });
  const onStarted = vi.fn();
  renderWithProviders(<StartJobModal jobId={5} plateNumber="01A" open onClose={() => {}} onStarted={onStarted} />);
  await userEvent.click(screen.getByRole('button', { name: /^ishni boshlash$/i }));
  await waitFor(() => expect(startJob).toHaveBeenCalledWith(5));
  await waitFor(() => expect(onStarted).toHaveBeenCalled());
});
