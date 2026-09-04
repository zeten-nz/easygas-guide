/** Formats the 9 national digits as "90 123 45 67" while typing. */
export function formatNationalPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return parts.join(' ');
}

/** Converts a formatted national input ("90 123 45 67") to +998901234567, or null. */
export function toE164(national: string): string | null {
  const d = national.replace(/\D/g, '');
  if (d.length !== 9) return null;
  return `+998${d}`;
}

/** Pretty-prints +998901234567 as "+998 90 123 45 67". */
export function displayPhone(e164: string): string {
  const m = e164.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  if (!m) return e164;
  return `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}`;
}
