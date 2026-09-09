import { test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { JobPhoto } from '../../api/jobs.api';

vi.mock('../../api/jobs.api', async () => {
  const actual = await vi.importActual<typeof import('../../api/jobs.api')>('../../api/jobs.api');
  return { ...actual, stepPhotoUrl: () => 'blob:fake' };
});

import { PhotoViewer } from './PhotoViewer';

function photo(id: number, name: string): JobPhoto {
  return { id, jobStepId: 10, stepId: 100, stepName: name, stepOrder: 1, isStop: false, requiredPhotos: 1, attempt: 1, status: 'READY', failureReason: null, uploadedById: 5, uploadedByName: 'Ali Usta', createdAt: '2026-01-01T09:00:00Z', readyAt: '2026-01-01T09:00:05Z', sizeBytes: 100, mimeType: 'image/png', cycle: 1, snapshotEvidence: true, role: 'COMPLETED_CYCLE', downloadable: true };
}
const photos = [photo(1, 'Birinchi'), photo(2, 'Ikkinchi')];

test('renders as a dialog, shows the caption, and focuses the close button', () => {
  render(<PhotoViewer jobId={7} photos={photos} index={0} onIndexChange={() => {}} onClose={() => {}} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Birinchi')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Yopish/i })).toHaveFocus();
});

test('Escape and the close button both close', () => {
  const onClose = vi.fn();
  render(<PhotoViewer jobId={7} photos={photos} index={0} onIndexChange={() => {}} onClose={onClose} />);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: /Yopish/i }));
  expect(onClose).toHaveBeenCalledTimes(2);
});

test('arrow keys navigate within the gallery context', () => {
  const onIndexChange = vi.fn();
  render(<PhotoViewer jobId={7} photos={photos} index={0} onIndexChange={onIndexChange} onClose={() => {}} />);
  fireEvent.keyDown(document, { key: 'ArrowRight' });
  expect(onIndexChange).toHaveBeenCalledWith(1);
  // At the first image there is no "previous" — ArrowLeft is a no-op.
  fireEvent.keyDown(document, { key: 'ArrowLeft' });
  expect(onIndexChange).toHaveBeenCalledTimes(1);
});

test('the Next control appears (and only when there is a next photo)', () => {
  const { rerender } = render(<PhotoViewer jobId={7} photos={photos} index={0} onIndexChange={() => {}} onClose={() => {}} />);
  expect(screen.getByRole('button', { name: /Keyingi rasm/i })).toBeInTheDocument();
  rerender(<PhotoViewer jobId={7} photos={photos} index={1} onIndexChange={() => {}} onClose={() => {}} />);
  expect(screen.queryByRole('button', { name: /Keyingi rasm/i })).not.toBeInTheDocument();
});
