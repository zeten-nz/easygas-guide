import { CheckCircle2, CircleSlash } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ROLE_LABELS, type RoleCode, type UserStatus } from '../../types/auth';

const ROLE_COLORS: Record<RoleCode, string> = {
  USTA: 'bg-sky-500/12 text-sky-700',
  MASTER: 'bg-violet-500/12 text-violet-700',
  RAHBAR: 'bg-amber-500/15 text-amber-700',
  SIFAT: 'bg-emerald-500/12 text-emerald-700',
  ADMIN: 'bg-blue-500/12 text-blue-700',
};

export function RoleBadge({ role }: { role: RoleCode }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', ROLE_COLORS[role])}>
      {ROLE_LABELS[role]}
    </span>
  );
}

/** Status as icon + text (never colour alone). */
export function StatusBadge({ status }: { status: UserStatus }) {
  return status === 'ACTIVE' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="size-3.5" />
      Faol
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-ink-500/12 px-2.5 py-0.5 text-xs font-semibold text-ink-600">
      <CircleSlash className="size-3.5" />
      Bloklangan
    </span>
  );
}
