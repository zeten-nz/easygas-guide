import { test, expect, vi, beforeEach, beforeAll } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { renderWithProviders } from '../../test/utils';
import type { Job } from '../../types/entities';

let mockUser: { permissions: string[] } | null = null;
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user: mockUser }) }));

vi.mock('../../api/jobs.api', () => ({
  fetchCompletion: vi.fn(),
  uploadSignature: vi.fn(),
  completeJob: vi.fn(),
  reopenJob: vi.fn(),
  confirmQuality: vi.fn(),
  signatureUrl: (id: number) => `/api/v1/jobs/${id}/signature/file`,
}));
vi.mock('../../api/safety.api', () => ({ getSignableSummary: vi.fn(), getCompletionSnapshot: vi.fn() }));
import * as jobsApi from '../../api/jobs.api';
import * as safety from '../../api/safety.api';
import { CompletionSection } from './CompletionSection';

const fetchCompletion = jobsApi.fetchCompletion as unknown as ReturnType<typeof vi.fn>;
const uploadSignature = jobsApi.uploadSignature as unknown as ReturnType<typeof vi.fn>;
const getSignableSummary = safety.getSignableSummary as unknown as ReturnType<typeof vi.fn>;
const getCompletionSnapshot = safety.getCompletionSnapshot as unknown as ReturnType<typeof vi.fn>;

const conditions = { checklist: true, stops: true, photos: true, measurements: true, risks: true, signature: false };
const summary = {
  schemaVersion: '1',
  cycle: 1,
  digest: 'DIGEST_ABC_123',
  summary: {
    schemaVersion: '1', jobId: 5, cycle: 1, branchId: 1, assignedTechnicianId: 3,
    checklistTemplateId: 1, checklistVersion: 2,
    installation: { gasType: 'LPG', kit: null, ecu: null, cylinder: null, note: null },
    customer: { id: 1, name: 'Ali', phoneMasked: '+998 90 *** ** 67' },
    vehicle: { id: 1, plate: '01A', vin: null, make: 'X', model: 'Y', year: 2020 },
    steps: [], stops: [], openBlockingRiskIds: [],
  },
};

const inProgress = { id: 5, status: 'IN_PROGRESS', plateNumber: '01A', cycle: 1 } as unknown as Job;

beforeAll(() => {
  // jsdom has no canvas backend — stub just enough for the signature pad.
  const stubCtx = {
    lineWidth: 0, lineCap: '', strokeStyle: '', fillStyle: '',
    beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fillRect() {},
  };
  HTMLCanvasElement.prototype.getContext = (() => stubCtx) as never;
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback) { cb(new Blob(['x'], { type: 'image/png' })); };
  HTMLElement.prototype.setPointerCapture = (() => {}) as never;
});

beforeEach(() => {
  fetchCompletion.mockReset();
  uploadSignature.mockReset();
  getSignableSummary.mockReset();
  getCompletionSnapshot.mockReset();
  mockUser = { permissions: ['checklist.execute', 'jobs.close'] };
});

test('shows the blocking-risk completion condition row (all blockers incl. risk)', async () => {
  fetchCompletion.mockResolvedValue({
    readiness: { canComplete: false, reasons: [{ code: 'CRITICAL_RISK_UNRESOLVED', message: 'Hal qilinmagan kritik xavf' }], conditions: { ...conditions, checklist: false, risks: false } },
    signature: null,
    jobStatus: 'IN_PROGRESS',
  });
  renderWithProviders(<CompletionSection job={inProgress} />);
  expect(await screen.findByText(/Hal qilinmagan bloklaydigan xavf yo'q/i)).toBeInTheDocument();
  expect(screen.getByText('Hal qilinmagan kritik xavf')).toBeInTheDocument();
});

test('shows the signable summary + signing digest before capturing the signature', async () => {
  fetchCompletion.mockResolvedValue({ readiness: { canComplete: false, reasons: [], conditions }, signature: null, jobStatus: 'IN_PROGRESS' });
  getSignableSummary.mockResolvedValue(summary);
  renderWithProviders(<CompletionSection job={inProgress} />);
  expect(await screen.findByText('DIGEST_ABC_123')).toBeInTheDocument();
  expect(screen.getByText(/Mijoz tasdig'i va imzosi/i)).toBeInTheDocument();
});

test('submits the signature BOUND to the server digest', async () => {
  fetchCompletion.mockResolvedValue({ readiness: { canComplete: false, reasons: [], conditions }, signature: null, jobStatus: 'IN_PROGRESS' });
  getSignableSummary.mockResolvedValue(summary);
  uploadSignature.mockResolvedValue({ id: 1, createdAt: '2026-09-05T00:00:00Z' });
  renderWithProviders(<CompletionSection job={inProgress} />);

  await screen.findByText('DIGEST_ABC_123'); // summary + digest loaded
  const canvas = document.querySelector('canvas')!;
  fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
  fireEvent.click(screen.getByRole('button', { name: /imzoni saqlash/i }));

  await waitFor(() => expect(uploadSignature).toHaveBeenCalledWith(5, expect.any(Blob), 'DIGEST_ABC_123'));
});

test('a stale summary (SIGNATURE_STALE) forces a re-sign by refetching the summary', async () => {
  fetchCompletion.mockResolvedValue({ readiness: { canComplete: false, reasons: [], conditions }, signature: null, jobStatus: 'IN_PROGRESS' });
  getSignableSummary.mockResolvedValue(summary);
  const stale = new AxiosError('stale');
  stale.response = { data: { error: { code: 'SIGNATURE_STALE', message: 'stale' } } } as never;
  uploadSignature.mockRejectedValue(stale);
  renderWithProviders(<CompletionSection job={inProgress} />);

  await screen.findByText('DIGEST_ABC_123');
  const canvas = document.querySelector('canvas')!;
  fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(canvas, { pointerId: 1 });
  expect(getSignableSummary).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: /imzoni saqlash/i }));

  // The stale response triggers a fresh summary fetch (new digest) — never a silent accept.
  await waitFor(() => expect(getSignableSummary).toHaveBeenCalledTimes(2));
});

test('a COMPLETED job shows the immutable, digest-sealed snapshot', async () => {
  mockUser = { permissions: ['jobs.view'] };
  fetchCompletion.mockResolvedValue({ readiness: { canComplete: true, reasons: [], conditions: { ...conditions, signature: true } }, signature: null, jobStatus: 'COMPLETED' });
  getCompletionSnapshot.mockResolvedValue({
    cycle: 1, digest: 'SNAP_DIGEST_XYZ', schemaVersion: '1', provenance: 'FINALIZED',
    content: { schemaVersion: '1', provenance: 'FINALIZED', summary: summary.summary, summaryDigest: 'DIGEST_ABC_123', assignment: { technicianId: 3, status: 'ASSIGNED' }, signature: null, risks: [] },
  });
  const completed = { ...inProgress, status: 'COMPLETED', closedByName: 'Master' } as unknown as Job;
  renderWithProviders(<CompletionSection job={completed} />);
  expect(await screen.findByText('SNAP_DIGEST_XYZ')).toBeInTheDocument();
});

test('a legacy COMPLETED job with no snapshot says so honestly', async () => {
  mockUser = { permissions: ['jobs.view'] };
  fetchCompletion.mockResolvedValue({ readiness: { canComplete: true, reasons: [], conditions: { ...conditions, signature: true } }, signature: null, jobStatus: 'COMPLETED' });
  getCompletionSnapshot.mockResolvedValue(null);
  const completed = { ...inProgress, status: 'COMPLETED', closedByName: 'Master' } as unknown as Job;
  renderWithProviders(<CompletionSection job={completed} />);
  expect(await screen.findByText(/muhrlangan snapshot yo'q/i)).toBeInTheDocument();
});
