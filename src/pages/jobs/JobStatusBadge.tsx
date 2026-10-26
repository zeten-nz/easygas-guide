import { type JobStatus } from '../../types/entities';
import { useT } from '../../i18n/i18n';
import type { TFunc } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/types';
import { cn } from '../../lib/utils';

const STATUS_CLASSES: Record<JobStatus, string> = {
  DRAFT: 'bg-sky-500/15 text-sky-700',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-700',
  WAITING_STOP_APPROVAL: 'bg-violet-500/15 text-violet-700',
  REJECTED: 'bg-brand-500/15 text-brand-700',
  QUALITY_REVIEW: 'bg-teal-500/15 text-teal-700',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700',
  REOPENED: 'bg-orange-500/15 text-orange-700',
  CANCELLED: 'bg-ink-500/15 text-ink-500',
};

/** Localized DISPLAY label for a stable job status code (code itself never changes).
 *  Small helper colocated with the badge; not a fast-refresh boundary. */
// eslint-disable-next-line react-refresh/only-export-components
export function jobStatusLabel(status: JobStatus, t: TFunc): string {
  return t(`ja.status.${status}` as MessageKey);
}

export function JobStatusBadge({ status, className }: { status: JobStatus; className?: string }) {
  const t = useT();
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', STATUS_CLASSES[status], className)}>
      {jobStatusLabel(status, t)}
    </span>
  );
}
