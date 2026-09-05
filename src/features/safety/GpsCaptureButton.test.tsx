import { test, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import { GpsCaptureButton } from './GpsCaptureButton';

function geoOk(accuracy = 8): Geolocation {
  return { getCurrentPosition: vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 41.3, longitude: 69.2, accuracy }, timestamp: Date.now() } as GeolocationPosition)) } as unknown as Geolocation;
}
function geoErr(code: number): Geolocation {
  return { getCurrentPosition: vi.fn((_ok: PositionCallback, err: PositionErrorCallback) => err({ code } as GeolocationPositionError)) } as unknown as Geolocation;
}

test('does NOT request geolocation on mount — only after an explicit click', () => {
  const geo = geoOk();
  const onCaptured = vi.fn();
  renderWithProviders(<GpsCaptureButton geo={geo} onCaptured={onCaptured} />);
  expect((geo.getCurrentPosition as unknown as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button'));
  expect((geo.getCurrentPosition as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
});

test('a successful capture shows accuracy and reports the reading', async () => {
  const geo = geoOk(9);
  const onCaptured = vi.fn();
  renderWithProviders(<GpsCaptureButton geo={geo} onCaptured={onCaptured} />);
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText(/aniqlik ≈ 9 m/)).toBeInTheDocument();
  expect(onCaptured).toHaveBeenCalledTimes(1);
});

test('permission denied shows a clear message and does not report a reading', async () => {
  const geo = geoErr(1);
  const onCaptured = vi.fn();
  renderWithProviders(<GpsCaptureButton geo={geo} onCaptured={onCaptured} />);
  fireEvent.click(screen.getByRole('button'));
  const alert = await screen.findByRole('alert');
  expect(alert.textContent).toMatch(/ruxsat/i);
  expect(onCaptured).not.toHaveBeenCalled();
});

test('low accuracy is flagged and the reading is NOT auto-reported', async () => {
  const geo = geoOk(500); // worse than the 100m policy
  const onCaptured = vi.fn();
  renderWithProviders(<GpsCaptureButton geo={geo} onCaptured={onCaptured} maxAccuracyMeters={100} />);
  fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByText(/aniqlik past/i)).toBeInTheDocument();
  expect(onCaptured).not.toHaveBeenCalled();
});
