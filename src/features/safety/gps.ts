/**
 * Phase 10D GPS capture wrapper (loyiha.md §20).
 *
 * Requests the browser location ONLY when called (from a user action — never on
 * page load), classifies the outcomes the UI must show (denied / unavailable /
 * timeout / unsupported), and reports accuracy. It never fabricates a coordinate
 * and never falls back to (0,0) — the server re-validates everything. Pure over
 * an injected geolocation object so it is unit-testable.
 */

export type GpsErrorKind = 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'TIMEOUT';

export class GpsError extends Error {
  readonly kind: GpsErrorKind;
  constructor(kind: GpsErrorKind, message?: string) {
    super(message ?? kind);
    this.name = 'GpsError';
    this.kind = kind;
  }
}

export interface GpsReading {
  latitude: number;
  longitude: number;
  accuracy: number;
  clientTimestamp: string; // ISO
}

export interface CaptureOptions {
  timeoutMs?: number;
}

/** Human-readable (Uzbek) message for each GPS failure the UI shows. */
export function gpsErrorMessage(kind: GpsErrorKind): string {
  switch (kind) {
    case 'UNSUPPORTED':
      return "Bu qurilma joylashuvni qo'llab-quvvatlamaydi.";
    case 'PERMISSION_DENIED':
      return "Joylashuvga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering va qayta urinib ko'ring.";
    case 'TIMEOUT':
      return "Joylashuvni aniqlash vaqti tugadi. Ochiq joyda qayta urinib ko'ring.";
    case 'UNAVAILABLE':
    default:
      return "Joylashuvni aniqlab bo'lmadi. Qayta urinib ko'ring.";
  }
}

/** True when the reading is worse than the acceptable accuracy (client pre-check). */
export function isLowAccuracy(reading: GpsReading, maxAccuracyMeters = 100): boolean {
  return !Number.isFinite(reading.accuracy) || reading.accuracy > maxAccuracyMeters;
}

/**
 * Resolves with a GpsReading or rejects with a classified GpsError. Inject `geo`
 * in tests; defaults to the browser's navigator.geolocation.
 */
export function captureLocation(
  geo: Geolocation | undefined = typeof navigator !== 'undefined' ? navigator.geolocation : undefined,
  opts: CaptureOptions = {},
): Promise<GpsReading> {
  return new Promise((resolve, reject) => {
    if (!geo || typeof geo.getCurrentPosition !== 'function') {
      reject(new GpsError('UNSUPPORTED'));
      return;
    }
    geo.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          clientTimestamp: new Date(pos.timestamp || Date.now()).toISOString(),
        });
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        const kind: GpsErrorKind = err.code === 1 ? 'PERMISSION_DENIED' : err.code === 3 ? 'TIMEOUT' : 'UNAVAILABLE';
        reject(new GpsError(kind));
      },
      { enableHighAccuracy: true, timeout: opts.timeoutMs ?? 15_000, maximumAge: 0 },
    );
  });
}
