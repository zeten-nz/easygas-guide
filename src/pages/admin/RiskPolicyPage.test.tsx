import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import type { Permission, User } from '../../types/auth';

vi.mock('../../api/safety.api', () => ({
  listMatrixVersions: vi.fn(),
  getMatrixVersionDetail: vi.fn(),
  previewClassification: vi.fn(),
  activateMatrix: vi.fn(),
  retireMatrix: vi.fn(),
}));
vi.mock('../../features/auth/auth-context', () => ({ useAuth: vi.fn() }));

import { listMatrixVersions, getMatrixVersionDetail, previewClassification } from '../../api/safety.api';
import { useAuth } from '../../features/auth/auth-context';
import { I18nProvider } from '../../i18n/i18n';
import { RiskPolicyPage } from './RiskPolicyPage';

const mockList = listMatrixVersions as unknown as ReturnType<typeof vi.fn>;
const mockDetail = getMatrixVersionDetail as unknown as ReturnType<typeof vi.fn>;
const mockPreview = previewClassification as unknown as ReturnType<typeof vi.fn>;
const mockAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

function userWith(perms: Permission[]): User {
  return { id: 1, firstName: 'T', lastName: 'U', phone: '+998900000000', region: 'x', branchId: null, role: 'SIFAT', status: 'ACTIVE', avatarUrl: null, permissions: perms } as unknown as User;
}

const DEF = { algorithm: 'severity_x_likelihood', allowedSeverity: [1, 2], allowedLikelihood: [1, 2], thresholds: [{ min: 4, level: 'CRITICAL' }, { min: 0, level: 'LOW' }], blockingLevels: ['CRITICAL'] };
const draftV1 = { version: 'v1', status: 'DRAFT' as const, approvedBy: null, approvedByName: null, approvedAt: null, rationale: null, createdAt: '2026-01-01', supersededBy: null, definition: DEF };
const detailV1 = {
  ...draftV1,
  isActive: false,
  cells: [
    { severity: 1, likelihood: 1, score: 1, level: 'LOW', blocking: false },
    { severity: 1, likelihood: 2, score: 2, level: 'LOW', blocking: false },
    { severity: 2, likelihood: 1, score: 2, level: 'LOW', blocking: false },
    { severity: 2, likelihood: 2, score: 4, level: 'CRITICAL', blocking: true },
  ],
  blockedOperations: ['Ishni yakunlash (§22 yakunlash darvozasi)', 'Sifatni tasdiqlash (§26)'],
};

beforeEach(() => { mockList.mockReset(); mockDetail.mockReset(); mockPreview.mockReset(); mockAuth.mockReset(); mockPreview.mockResolvedValue({ version: 'v1', status: 'DRAFT', severity: 2, likelihood: 2, source: 'MANUAL', score: 4, level: 'CRITICAL', blocking: true, example: true }); });

test('warns clearly when there is no ACTIVE approved policy', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockResolvedValue(detailV1);
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  expect(await screen.findByText(/Faol tasdiqlangan xavf siyosati yo'q/i)).toBeInTheDocument();
});

test('explains the policy in plain language', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockResolvedValue(detailV1);
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  expect(await screen.findByText(/Xavf siyosati nima\?/i)).toBeInTheDocument();
  expect(screen.getByText(/Og'irlik \(severity\)/i)).toBeInTheDocument();
});

test('renders the REAL matrix with level labels + blocking text (colour never the sole signal)', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockResolvedValue(detailV1);
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  // Level word labels present (not just colour).
  expect((await screen.findAllByText('Kritik')).length).toBeGreaterThan(0);
  expect(screen.getAllByText('Past').length).toBeGreaterThan(0);
  // Blocking conveyed in words.
  expect(screen.getAllByText(/Bloklovchi/i).length).toBeGreaterThan(0);
});

test('an approver sees the activate control for a DRAFT', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockResolvedValue(detailV1);
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  expect(await screen.findByRole('button', { name: /faollashtirish/i })).toBeInTheDocument();
});

test('a non-approver does NOT see the activate control (UI mirrors server authz)', async () => {
  mockAuth.mockReturnValue({ user: userWith(['jobs.view']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockResolvedValue(detailV1);
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  await screen.findAllByText('Kritik');
  expect(screen.queryByRole('button', { name: /faollashtirish/i })).not.toBeInTheDocument();
});

test('the illustrative preview shows the server-derived result labelled as an example', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockResolvedValue(detailV1);
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  expect(await screen.findByText(/Namuna baholash/i)).toBeInTheDocument();
  expect(screen.getAllByText(/namuna/i).length).toBeGreaterThan(0);
  // The result comes from the mocked evaluator (CRITICAL) — not a hardcoded client matrix.
  expect(await screen.findByText(/Natija \(namuna\)/i)).toBeInTheDocument();
});

test('shows an error (no silent hardcoded fallback) when the version detail fails to load', async () => {
  mockAuth.mockReturnValue({ user: userWith(['risk.matrix.approve']) });
  mockList.mockResolvedValue({ versions: [draftV1] });
  mockDetail.mockRejectedValue(new Error('boom'));
  renderWithProviders(<I18nProvider><RiskPolicyPage /></I18nProvider>);
  expect(await screen.findByText(/Versiya ma'lumotini yuklab bo'lmadi/i)).toBeInTheDocument();
  // No matrix cells were fabricated.
  expect(screen.queryByText('ball 4')).not.toBeInTheDocument();
});
