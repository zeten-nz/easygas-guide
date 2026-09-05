import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import type { Permission, User } from '../../types/auth';

vi.mock('../../api/safety.api', () => ({ listMatrixVersions: vi.fn(), activateMatrix: vi.fn() }));
vi.mock('../../features/auth/auth-context', () => ({ useAuth: vi.fn() }));

import { listMatrixVersions } from '../../api/safety.api';
import { useAuth } from '../../features/auth/auth-context';
import { RiskPolicyPage } from './RiskPolicyPage';

const mockList = listMatrixVersions as unknown as ReturnType<typeof vi.fn>;
const mockAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

function userWith(perms: Permission[]): User {
  return { id: 1, firstName: 'T', lastName: 'U', phone: '+998900000000', region: 'x', branchId: null, role: 'SIFAT', status: 'ACTIVE', avatarUrl: null, permissions: perms } as unknown as User;
}
const draftV1 = { version: 'v1', status: 'DRAFT' as const, approvedBy: null, approvedAt: null, rationale: null, createdAt: '2026-01-01', definition: { thresholds: [{ min: 0, level: 'LOW' }], blockingLevels: ['CRITICAL'] } };

beforeEach(() => { mockList.mockReset(); mockAuth.mockReset(); });

test('warns clearly when there is no ACTIVE approved policy', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  renderWithProviders(<RiskPolicyPage />);
  expect(await screen.findByText(/Faol tasdiqlangan xavf siyosati yo'q/i)).toBeInTheDocument();
});

test('an approver sees the activate control for a DRAFT', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  renderWithProviders(<RiskPolicyPage />);
  expect(await screen.findByRole('button', { name: /tasdiqlash/i })).toBeInTheDocument();
});

test('a non-approver does NOT see the activate control (UI mirrors server authz)', async () => {
  mockAuth.mockReturnValue({ user: userWith(['jobs.view']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  renderWithProviders(<RiskPolicyPage />);
  await screen.findByText('v1');
  expect(screen.queryByRole('button', { name: /tasdiqlash/i })).not.toBeInTheDocument();
});
