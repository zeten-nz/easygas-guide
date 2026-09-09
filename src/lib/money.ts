/**
 * Client-side money formatting for the catalogue. Prices travel over the API as
 * integer minor units (scale 2: 1 UZS = 100 minor) — never floats — so the exact
 * value is preserved end to end. These helpers only format for display and
 * convert the human "so'm" input to minor units; they never do price arithmetic.
 *
 *   null  → "Belgilanmagan" (price UNKNOWN — distinct from a real 0)
 *   0     → "0 so'm"        (free)
 */
const CURRENCY_SUFFIX = "so'm";

/** Group a whole number with thin spaces: 1500000 → "1 500 000". */
function group(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatUZS(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return 'Belgilanmagan';
  const neg = minor < 0;
  const abs = Math.abs(minor);
  const major = Math.trunc(abs / 100);
  const tiyin = abs % 100;
  const body = tiyin === 0 ? group(major) : `${group(major)},${String(tiyin).padStart(2, '0')}`;
  return `${neg ? '−' : ''}${body} ${CURRENCY_SUFFIX}`;
}

/** minor → the "so'm" value to prefill an input (major units). null passes through. */
export function minorToSom(minor: number | null | undefined): number | null {
  return minor === null || minor === undefined ? null : minor / 100;
}

/** Human "so'm" input → integer minor units (exact for whole/2-dp values). */
export function somToMinor(som: number): number {
  return Math.round(som * 100);
}
