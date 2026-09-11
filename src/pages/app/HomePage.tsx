import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { useT } from '../../i18n/i18n';
import { roleLabel } from '../../i18n/labels';
import type { MessageKey } from '../../i18n/types';
import { NAV_GROUPS } from './nav-config';

/** One honest line per destination — describes the task, never invented metrics. */
const DESCRIPTION_KEYS: Record<string, MessageKey> = {
  '/app/my-jobs': 'home.desc.myJobs',
  '/app/jobs': 'home.desc.jobs',
  '/app/admin/users': 'home.desc.users',
  '/app/admin/registration-requests': 'home.desc.requests',
  '/app/customers': 'home.desc.customers',
  '/app/vehicles': 'home.desc.vehicles',
  '/app/admin/branches': 'home.desc.branches',
  '/app/admin/templates': 'home.desc.templates',
  '/app/admin/risk-policy': 'home.desc.riskPolicy',
};

export function HomePage() {
  const { user } = useAuth();
  const t = useT();
  if (!user) return null;

  const cards = NAV_GROUPS.flatMap((g) => g.items).filter(
    (it) => it.permission !== null && can(user, it.permission),
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('home.welcome', { name: user.firstName })}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">{roleLabel(user.role, t)}</p>
      </div>

      {cards.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-start gap-3.5 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 transition-colors hover:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[var(--text-1)]">{t(item.labelKey)}</span>
                <span className="mt-0.5 block text-sm text-[var(--text-2)]">
                  {DESCRIPTION_KEYS[item.to] ? t(DESCRIPTION_KEYS[item.to]) : ''}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--text-2)]">{t('home.empty')}</p>
      )}
    </div>
  );
}
