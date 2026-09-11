import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { EvidenceRole, JobPhoto } from '../../api/jobs.api';
import { useT } from '../../i18n/i18n';
import { roleMeta, fmtEvidenceTime } from './evidence-labels';

export function RoleBadge({ role, className }: { role: EvidenceRole; className?: string }) {
  const t = useT();
  const m = roleMeta(role, t);
  const Icon = m.Icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', m.className, className)}>
      <Icon className="size-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

/** Compact truthful metadata line for a photo (uploader / time / attempt / cycle). */
export function EvidenceMeta({ photo, className }: { photo: JobPhoto; className?: string }) {
  const t = useT();
  const parts: ReactNode[] = [
    <span key="u">{t('jb.evidence.uploadedBy', { name: photo.uploadedByName })}</span>,
    <span key="t">{fmtEvidenceTime(photo.readyAt ?? photo.createdAt, t)}</span>,
    <span key="a">{t('jb.evidence.attempt', { n: photo.attempt })}</span>,
    // A photo's cycle is known ONLY when it was frozen into a completed cycle's
    // snapshot; a photo can span several cycles; otherwise we say so honestly.
    <span key="c">{photo.cycles.length > 1 ? t('jb.evidence.cyclesMulti', { list: photo.cycles.join(', ') }) : photo.cycle != null ? t('jb.evidence.cycleOne', { n: photo.cycle }) : t('jb.evidence.cycleUnknown')}</span>,
  ];
  if (photo.status === 'FAILED' && photo.failureReason) parts.push(<span key="f">{t('jb.reasonLine', { reason: photo.failureReason })}</span>);
  return (
    <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs', className ?? 'text-[var(--text-3)]')}>
      {parts.map((p, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-[var(--text-3)]/50">·</span>}
          {p}
        </span>
      ))}
    </p>
  );
}
