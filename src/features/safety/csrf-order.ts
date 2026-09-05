/**
 * Phase 10C/10D CSRF rotation ordering (extracted, pure, testable).
 *
 * The session token rotates server-side; each authenticated response carries the
 * current CSRF token and a monotonic `x-session-rotation` sequence. A slower,
 * OUT-OF-ORDER (older) parallel response must NEVER overwrite a newer token — so
 * a rotated token is adopted only when its sequence is strictly newer than the
 * one we already hold.
 */
export interface CsrfUpdate {
  token: string;
  seq: number;
}

/**
 * Decides whether to adopt a rotated CSRF token from response headers, given the
 * currently held sequence. Returns the new {token, seq} to adopt, or null to
 * keep the current one (missing/older/invalid).
 */
export function decideCsrfAdoption(
  headers: Record<string, string | undefined> | undefined,
  currentSeq: number,
): CsrfUpdate | null {
  const token = headers?.['x-csrf-token'];
  const seqRaw = headers?.['x-session-rotation'];
  if (typeof token !== 'string' || token.length === 0 || seqRaw === undefined) return null;
  const seq = Number(seqRaw);
  if (!Number.isFinite(seq) || seq <= currentSeq) return null;
  return { token, seq };
}
