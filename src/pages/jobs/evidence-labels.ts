import { CheckCircle2, Clock, History, HelpCircle, ShieldQuestion, XCircle, type LucideIcon } from 'lucide-react';
import type { EvidenceRole, JobPhoto } from '../../api/jobs.api';
import type { TFunc } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/types';

/**
 * Truthful, colour-supplemented metadata for photo evidence (Phase 11C). Colour is
 * never the only signal — the badges (in evidence-badges.tsx) always pair the tint
 * with an icon + text. The wording is honest about provenance: a completed-cycle
 * photo is authoritative history; a current one is working evidence of the open
 * cycle; a superseded attempt is neither; unverified/failed rows are NOT evidence.
 *
 * The visible label is stored as an i18n KEY and resolved at render via `roleMeta`
 * (so it re-translates with the active locale); the role CODES, ordering and icon /
 * colour mapping are unchanged.
 */
const ROLE_META: Record<EvidenceRole, { labelKey: MessageKey; Icon: LucideIcon; className: string }> = {
  COMPLETED_CYCLE: { labelKey: 'jb.role.completedCycle', Icon: CheckCircle2, className: 'bg-[var(--success-bg)] text-[var(--success-fg)]' },
  CURRENT: { labelKey: 'jb.role.current', Icon: Clock, className: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  SUPERSEDED_ATTEMPT: { labelKey: 'jb.role.superseded', Icon: History, className: 'bg-[var(--surface-2)] text-[var(--text-2)]' },
  HISTORICAL_UNCLASSIFIED: { labelKey: 'jb.role.historical', Icon: HelpCircle, className: 'bg-[var(--surface-2)] text-[var(--text-2)]' },
  PENDING: { labelKey: 'jb.role.pending', Icon: Clock, className: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  UNVERIFIED: { labelKey: 'jb.role.unverified', Icon: ShieldQuestion, className: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  FAILED: { labelKey: 'jb.role.failed', Icon: XCircle, className: 'bg-[var(--danger-bg)] text-[var(--danger-fg)]' },
};

/** Resolves a role's localized label + icon + colour class for the active locale. */
export function roleMeta(role: EvidenceRole, t: TFunc): { label: string; Icon: LucideIcon; className: string } {
  const m = ROLE_META[role];
  return { label: t(m.labelKey), Icon: m.Icon, className: m.className };
}

/** Whether a photo is real, accessible evidence (only READY qualifies). */
export function isAccessible(photo: JobPhoto): boolean {
  return photo.status === 'READY' && photo.downloadable;
}

/** Compact, honest timestamp — a localized "no data" note for a missing/invalid value. */
export function fmtEvidenceTime(iso: string | null, t: TFunc): string {
  if (!iso) return t('jb.evidence.noData');
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return t('jb.evidence.noData');
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
