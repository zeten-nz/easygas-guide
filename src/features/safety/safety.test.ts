/**
 * Phase 10D client safety-logic unit tests.
 *
 *   npm run test            (tsx --test — no vitest/vite dev-toolchain deps)
 *
 * Covers the safety-critical CLIENT logic: GPS capture states (denied /
 * unavailable / timeout / unsupported / low-accuracy), risk-form validation,
 * completion-blocker mapping, stale-signature re-sign handling, and the 10C CSRF
 * rotation out-of-order guard. (The backend remains the source of truth; these
 * are UX helpers only.)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captureLocation, GpsError, isLowAccuracy, gpsErrorMessage } from './gps';
import { validateRiskInput } from './risk-form';
import { readinessRows, blockingReasons, isReSignRequired, type CompletionReadiness } from './completion-blockers';
import { decideCsrfAdoption } from './csrf-order';

type PosCb = (p: GeolocationPosition) => void;
type ErrCb = (e: GeolocationPositionError) => void;
const geoOk = { getCurrentPosition: (ok: PosCb) => ok({ coords: { latitude: 41.3, longitude: 69.2, accuracy: 8 }, timestamp: Date.now() } as GeolocationPosition) } as unknown as Geolocation;
const geoErr = (code: number) => ({ getCurrentPosition: (_ok: PosCb, err: ErrCb) => err({ code } as GeolocationPositionError) }) as unknown as Geolocation;

test('GPS: a successful reading resolves with coords + accuracy + client timestamp', async () => {
  const r = await captureLocation(geoOk);
  assert.equal(r.latitude, 41.3);
  assert.equal(r.accuracy, 8);
  assert.match(r.clientTimestamp, /\dT\d/);
});

test('GPS: permission denied / unavailable / timeout / unsupported are classified', async () => {
  await assert.rejects(() => captureLocation(geoErr(1)), (e: unknown) => e instanceof GpsError && e.kind === 'PERMISSION_DENIED');
  await assert.rejects(() => captureLocation(geoErr(2)), (e: unknown) => e instanceof GpsError && e.kind === 'UNAVAILABLE');
  await assert.rejects(() => captureLocation(geoErr(3)), (e: unknown) => e instanceof GpsError && e.kind === 'TIMEOUT');
  await assert.rejects(() => captureLocation(undefined), (e: unknown) => e instanceof GpsError && e.kind === 'UNSUPPORTED');
  assert.match(gpsErrorMessage('PERMISSION_DENIED'), /ruxsat/i);
});

test('GPS: low accuracy is flagged against the policy', () => {
  assert.equal(isLowAccuracy({ latitude: 41, longitude: 69, accuracy: 12, clientTimestamp: '' }, 100), false);
  assert.equal(isLowAccuracy({ latitude: 41, longitude: 69, accuracy: 500, clientTimestamp: '' }, 100), true);
});

test('risk form: required fields and 1–4 ranges are validated (no level derived)', () => {
  assert.equal(validateRiskInput({ hazard: 'Gaz', description: 'sizish', severity: 4, likelihood: 4 }).ok, true);
  const bad = validateRiskInput({ hazard: 'x', description: '', severity: 9, likelihood: 0 });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.hazard && bad.errors.description && bad.errors.severity && bad.errors.likelihood);
});

test('completion blockers: rows reflect conditions; reasons empty when ready', () => {
  const notReady: CompletionReadiness = {
    canComplete: false,
    reasons: [{ code: 'CRITICAL_RISK_UNRESOLVED', message: 'x' }],
    conditions: { checklist: true, stops: true, photos: true, measurements: true, risks: false, signature: false },
  };
  const rows = readinessRows(notReady);
  assert.equal(rows.find((r) => r.key === 'risks')!.ok, false);
  assert.equal(rows.length, 6);
  assert.equal(blockingReasons(notReady)[0].code, 'CRITICAL_RISK_UNRESOLVED');
  const ready = { ...notReady, canComplete: true };
  assert.deepEqual(blockingReasons(ready as CompletionReadiness), []);
});

test('stale signature: SIGNATURE_STALE / SUMMARY_STALE require re-sign', () => {
  assert.equal(isReSignRequired('SIGNATURE_STALE'), true);
  assert.equal(isReSignRequired('SUMMARY_STALE'), true);
  assert.equal(isReSignRequired('COMPLETION_BLOCKED'), false);
  assert.equal(isReSignRequired(undefined), false);
});

test('CSRF ordering: a newer sequence is adopted; older/equal/missing are ignored', () => {
  // From seq 3: a newer (5) is adopted.
  assert.deepEqual(decideCsrfAdoption({ 'x-csrf-token': 'new', 'x-session-rotation': '5' }, 3), { token: 'new', seq: 5 });
  // An out-of-order OLDER (2) response does not overwrite.
  assert.equal(decideCsrfAdoption({ 'x-csrf-token': 'old', 'x-session-rotation': '2' }, 3), null);
  // Equal sequence: no change.
  assert.equal(decideCsrfAdoption({ 'x-csrf-token': 'same', 'x-session-rotation': '3' }, 3), null);
  // Missing token or seq: ignored.
  assert.equal(decideCsrfAdoption({ 'x-session-rotation': '9' }, 3), null);
  assert.equal(decideCsrfAdoption({ 'x-csrf-token': 't' }, 3), null);
});
