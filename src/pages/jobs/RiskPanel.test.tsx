import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import type { Job } from '../../types/entities';
import type { RiskListItem } from '../../api/safety.api';

let mockUser: { permissions: string[] } | null = null;
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user: mockUser }) }));

vi.mock('../../api/safety.api', () => ({
  listRisks: vi.fn(),
  createRisk: vi.fn(),
  resolveRisk: vi.fn(),
  overrideRisk: vi.fn(),
}));
import * as safety from '../../api/safety.api';
import { RiskPanel } from './RiskPanel';

const listRisks = safety.listRisks as unknown as ReturnType<typeof vi.fn>;

const job = { id: 5, status: 'IN_PROGRESS', cycle: 2 } as unknown as Job;

const criticalBlocking: RiskListItem = {
  id: 10,
  cycle: 2,
  hazard: 'Gaz sizishi',
  description: 'Ballon ulanishida sizish aniqlandi',
  level: 'CRITICAL',
  blocking: true,
  status: 'OPEN',
  matrixVersion: 'v3',
  source: 'MANUAL',
  jobStepId: 4,
  createdAt: '2026-09-02T09:00:00Z',
};

beforeEach(() => {
  listRisks.mockReset();
});

test('renders the SERVER-computed level and blocking status as TEXT (not colour alone)', async () => {
  mockUser = { permissions: ['jobs.view'] };
  listRisks.mockResolvedValue({ items: [criticalBlocking], total: 1, page: 1, pageSize: 50 });
  renderWithProviders(<RiskPanel job={job} />);

  // Level shown as its own label (server value), and blocking shown as the word
  // "Bloklaydi" — a screen-reader user never has to infer it from colour.
  expect(await screen.findByText('KRITIK')).toBeInTheDocument();
  expect(screen.getByText('Bloklaydi')).toBeInTheDocument();
  expect(screen.getByText('Gaz sizishi')).toBeInTheDocument();
  expect(screen.getByText(/Matritsa: v3/)).toBeInTheDocument();
});

test('surfaces the count of unresolved blocking risks that stop completion', async () => {
  mockUser = { permissions: ['jobs.view'] };
  listRisks.mockResolvedValue({ items: [criticalBlocking], total: 1, page: 1, pageSize: 50 });
  renderWithProviders(<RiskPanel job={job} />);
  const banner = await screen.findByRole('alert');
  expect(banner).toHaveTextContent(/1 ta hal qilinmagan bloklaydigan xavf/i);
});

test('separates current-cycle risks from prior cycles', async () => {
  mockUser = { permissions: ['jobs.view'] };
  listRisks.mockResolvedValue({
    items: [criticalBlocking, { ...criticalBlocking, id: 11, cycle: 1, blocking: false, level: 'LOW', status: 'RESOLVED' }],
    total: 2,
    page: 1,
    pageSize: 50,
  });
  renderWithProviders(<RiskPanel job={job} />);
  expect(await screen.findByText(/Joriy sikl \(#2\)/i)).toBeInTheDocument();
  expect(screen.getByText(/Oldingi sikllar \(1\)/i)).toBeInTheDocument();
});

test('renders an error state when the risk query fails', async () => {
  mockUser = { permissions: ['jobs.view'] };
  listRisks.mockRejectedValue(new Error('boom'));
  renderWithProviders(<RiskPanel job={job} />);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
});

test('shows the create control only to a risks.create holder', async () => {
  listRisks.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 50 });

  mockUser = { permissions: ['jobs.view'] };
  const { unmount } = renderWithProviders(<RiskPanel job={job} />);
  expect(screen.queryByRole('button', { name: /xavf qo'shish/i })).toBeNull();
  unmount();

  mockUser = { permissions: ['jobs.view', 'risks.create'] };
  renderWithProviders(<RiskPanel job={job} />);
  expect(screen.getByRole('button', { name: /xavf qo'shish/i })).toBeInTheDocument();
});
