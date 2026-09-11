import type { ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { RoleBadge, StatusBadge } from '../admin/user-badges';
import { displayPhone } from '../../lib/phone';
import { useT, useLocale } from '../../i18n/i18n';
import { roleLabel, regionLabel } from '../../i18n/labels';
import { formatDate } from '../../i18n/format';
import type { Locale } from '../../i18n/types';
import type { UserDetail } from '../../types/auth';

function fmtDate(value: string | null, locale: Locale): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return formatDate(d, locale, { day: '2-digit', month: 'long', year: 'numeric' });
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-[var(--border-1)] py-3.5 last:border-0 sm:flex-row sm:items-center sm:gap-4">
      <dt className="text-sm text-[var(--text-2)] sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-[var(--text-1)]">{children}</dd>
    </div>
  );
}

/**
 * Read-only identity card shared by the own-profile and employee-profile pages.
 * Identity fields (role/branch/status) are never self-editable here — management
 * happens through the existing admin actions, which the employee page adds around
 * this card.
 */
export function ProfileView({ user }: { user: UserDetail }) {
  const t = useT();
  const { locale } = useLocale();
  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
      <div className="flex items-center gap-4 border-b border-[var(--border-1)] p-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <UserRound className="size-7" />
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-[var(--text-1)]">
            {user.firstName} {user.lastName}
          </h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <RoleBadge role={user.role} />
            <StatusBadge status={user.status} />
          </div>
        </div>
      </div>

      <dl className="px-5 py-1">
        <Field label={t('m.profile.phone')}>{displayPhone(user.phone)}</Field>
        <Field label={t('m.field.role')}>{/* text, not just the badge above */}
          {roleLabel(user.role, t)}
        </Field>
        <Field label={t('m.field.branch')}>
          {user.branchName ?? <span className="text-[var(--text-2)]">{t('m.profile.noBranch')}</span>}
        </Field>
        <Field label={t('m.field.region')}>{regionLabel(user.region, locale)}</Field>
        <Field label={t('m.field.status')}>{user.status === 'ACTIVE' ? t('m.status.active') : t('m.status.blocked')}</Field>
        <Field label={t('m.profile.registeredAt')}>{fmtDate(user.createdAt, locale)}</Field>
        <Field label={t('m.profile.lastLogin')}>{fmtDate(user.lastLoginAt, locale)}</Field>
      </dl>
    </div>
  );
}
