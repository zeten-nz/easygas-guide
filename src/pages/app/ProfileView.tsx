import type { ReactNode } from 'react';
import { UserRound } from 'lucide-react';
import { RoleBadge, StatusBadge } from '../admin/user-badges';
import { displayPhone } from '../../lib/phone';
import type { UserDetail } from '../../types/auth';

function fmtDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
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
        <Field label="Telefon">{displayPhone(user.phone)}</Field>
        <Field label="Rol">{/* text, not just the badge above */}
          {user.role === 'ADMIN'
            ? 'Administrator'
            : user.role === 'RAHBAR'
              ? 'Service rahbari'
              : user.role === 'MASTER'
                ? 'Service masteri'
                : user.role === 'SIFAT'
                  ? 'Sifat nazorati'
                  : 'Service ustasi'}
        </Field>
        <Field label="Filial">
          {user.branchName ?? <span className="text-[var(--text-2)]">Filial biriktirilmagan</span>}
        </Field>
        <Field label="Viloyat">{user.region}</Field>
        <Field label="Holat">{user.status === 'ACTIVE' ? 'Faol' : 'Bloklangan'}</Field>
        <Field label="Ro'yxatdan o'tgan">{fmtDate(user.createdAt)}</Field>
        <Field label="Oxirgi kirish">{fmtDate(user.lastLoginAt)}</Field>
      </dl>
    </div>
  );
}
