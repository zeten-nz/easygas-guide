import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import type { JobPhoto, JobPhotosResult } from '../../api/jobs.api';

vi.mock('../../api/jobs.api', () => ({ fetchJobPhotos: vi.fn(), stepPhotoUrl: () => 'blob:fake' }));

import { fetchJobPhotos } from '../../api/jobs.api';
import { JobEvidenceGallery } from './JobEvidenceGallery';

const mockFetch = fetchJobPhotos as unknown as ReturnType<typeof vi.fn>;

function photo(over: Partial<JobPhoto>): JobPhoto {
  return {
    id: 1, jobStepId: 10, stepId: 100, stepName: 'Foto bosqich', stepOrder: 1, isStop: false, requiredPhotos: 1,
    attempt: 1, status: 'READY', failureReason: null, uploadedById: 5, uploadedByName: 'Ali Usta',
    createdAt: '2026-01-01T09:00:00Z', readyAt: '2026-01-01T09:00:05Z', sizeBytes: 1234, mimeType: 'image/png',
    cycle: 1, snapshotEvidence: true, role: 'COMPLETED_CYCLE', downloadable: true, ...over,
  };
}
function result(photos: JobPhoto[]): JobPhotosResult {
  return { job: { id: 7, status: 'COMPLETED', cycle: 1, assignedTechnicianId: 5, assignmentStatus: 'ASSIGNED' }, cycles: [{ cycle: 1, provenance: 'FINALIZED', createdAt: '2026-01-01T10:00:00Z' }], photos, total: photos.length, page: 1, limit: 60 };
}

beforeEach(() => mockFetch.mockReset());

test('shows a loading state, then resolves', async () => {
  // Controllable deferred — resolved before the test ends (never dangling).
  let resolve!: (v: JobPhotosResult) => void;
  mockFetch.mockReturnValue(new Promise<JobPhotosResult>((r) => { resolve = r; }));
  renderWithProviders(<JobEvidenceGallery jobId={7} />);
  expect(screen.getByText(/Yuklanmoqda…/i)).toBeInTheDocument();
  resolve(result([]));
  expect(await screen.findByText(/foto dalillar mavjud emas/i)).toBeInTheDocument();
});

// (The error/retry state is covered by the browser E2E, which 404s the listing
// endpoint for a real failure — a sole-query component rejecting on mount trips
// vitest's unhandled-rejection guard in jsdom, so it is not unit-tested here.)

test('labels roles truthfully and only makes READY evidence clickable', async () => {
  mockFetch.mockResolvedValue(result([
    photo({ id: 1, role: 'COMPLETED_CYCLE', status: 'READY', downloadable: true }),
    photo({ id: 2, role: 'UNVERIFIED', status: 'UNVERIFIED', downloadable: false, cycle: null, snapshotEvidence: false }),
  ]));
  renderWithProviders(<JobEvidenceGallery jobId={7} />);
  // Truthful role labels (words, not colour alone).
  expect(await screen.findByText('Yakunlangan tsikl')).toBeInTheDocument();
  expect(screen.getByText('Tekshirilmagan (eski)')).toBeInTheDocument();
  // Exactly one openable (READY) tile.
  expect(screen.getAllByRole('button', { name: /Rasmni ochish/i })).toHaveLength(1);
});
