import { Archive, CheckCircle2, PencilLine } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useT } from '../../../i18n/i18n';
import type { ChecklistTemplate, VersionStatus } from '../../../types/entities';
import { statusLabel, templateStatus } from './template-lifecycle';

const STATUS_STYLE: Record<VersionStatus, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-700',
  PUBLISHED: 'bg-emerald-500/12 text-emerald-700',
  ARCHIVED: 'bg-ink-500/12 text-ink-600',
};

const STATUS_ICON: Record<VersionStatus, typeof CheckCircle2> = {
  DRAFT: PencilLine,
  PUBLISHED: CheckCircle2,
  ARCHIVED: Archive,
};

export function StatusPill({ status, className }: { status: VersionStatus; className?: string }) {
  const t = useT();
  const Icon = STATUS_ICON[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[status], className)}>
      <Icon className="size-3.5" />
      {statusLabel(status, t)}
    </span>
  );
}

export function TemplateStatusBadge({ template }: { template: ChecklistTemplate }) {
  return <StatusPill status={templateStatus(template)} />;
}

/** The per-version chips (v1 · Faol, v2 · Qoralama, …). */
export function VersionChips({ template }: { template: ChecklistTemplate }) {
  const t = useT();
  return (
    <div className="flex flex-wrap gap-1.5">
      {template.versions.map((v) => (
        <span
          key={v.id}
          className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[v.status])}
        >
          v{v.version} · {statusLabel(v.status, t)}
        </span>
      ))}
    </div>
  );
}
