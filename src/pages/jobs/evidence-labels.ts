import { CheckCircle2, Clock, History, HelpCircle, ShieldQuestion, XCircle, type LucideIcon } from 'lucide-react';
import type { EvidenceRole, JobPhoto } from '../../api/jobs.api';

/**
 * Truthful, colour-supplemented metadata for photo evidence (Phase 11C). Colour is
 * never the only signal — the badges (in evidence-badges.tsx) always pair the tint
 * with an icon + text. The wording is honest about provenance: a completed-cycle
 * photo is authoritative history; a current one is working evidence of the open
 * cycle; a superseded attempt is neither; unverified/failed rows are NOT evidence.
 */
export const ROLE_META: Record<EvidenceRole, { label: string; Icon: LucideIcon; className: string }> = {
  COMPLETED_CYCLE: { label: 'Yakunlangan tsikl', Icon: CheckCircle2, className: 'bg-[var(--success-bg)] text-[var(--success-fg)]' },
  CURRENT: { label: 'Joriy', Icon: Clock, className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  SUPERSEDED_ATTEMPT: { label: 'Eskirgan urinish', Icon: History, className: 'bg-[var(--surface-2)] text-[var(--text-2)]' },
  HISTORICAL_UNCLASSIFIED: { label: 'Tarixiy (aniqlanmagan)', Icon: HelpCircle, className: 'bg-[var(--surface-2)] text-[var(--text-2)]' },
  PENDING: { label: 'Yuklanmoqda', Icon: Clock, className: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  UNVERIFIED: { label: 'Tekshirilmagan (eski)', Icon: ShieldQuestion, className: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  FAILED: { label: 'Muvaffaqiyatsiz', Icon: XCircle, className: 'bg-[var(--danger-bg)] text-[var(--danger-fg)]' },
};

/** Whether a photo is real, accessible evidence (only READY qualifies). */
export function isAccessible(photo: JobPhoto): boolean {
  return photo.status === 'READY' && photo.downloadable;
}

/** Compact, honest timestamp — "Ma'lumot mavjud emas" for a missing/invalid value. */
export function fmtEvidenceTime(iso: string | null): string {
  if (!iso) return "Ma'lumot mavjud emas";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Ma'lumot mavjud emas";
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
