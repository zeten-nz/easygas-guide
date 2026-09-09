import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { EvidenceRole, JobPhoto } from '../../api/jobs.api';
import { ROLE_META, fmtEvidenceTime } from './evidence-labels';

export function RoleBadge({ role, className }: { role: EvidenceRole; className?: string }) {
  const m = ROLE_META[role];
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
  const parts: ReactNode[] = [
    <span key="u">Yuklagan: {photo.uploadedByName}</span>,
    <span key="t">{fmtEvidenceTime(photo.readyAt ?? photo.createdAt)}</span>,
    <span key="a">Urinish {photo.attempt}</span>,
    // A photo's cycle is known ONLY when it was frozen into a completed cycle's
    // snapshot; otherwise we say so rather than inventing one.
    <span key="c">{photo.cycle != null ? `${photo.cycle}-tsikl` : 'Tsikl: joriy/aniqlanmagan'}</span>,
  ];
  if (photo.status === 'FAILED' && photo.failureReason) parts.push(<span key="f">Sabab: {photo.failureReason}</span>);
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
