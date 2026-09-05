import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { RiskPolicyBanner } from '../../features/safety/RiskPolicyBanner';
import { LogOut, UserRound } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { ROLE_LABELS, type Permission } from '../../types/auth';
import { cn } from '../../lib/utils';

/** Navigation is permission-driven (UX only — the backend enforces access). */
const NAV_ITEMS: { to: string; label: string; permission: Permission; end?: boolean }[] = [
  { to: '/app/my-jobs', label: 'Mening ishlarim', permission: 'checklist.execute' },
  { to: '/app/jobs', label: 'Ishlar', permission: 'jobs.view' },
  { to: '/app/customers', label: 'Mijozlar', permission: 'customers.view' },
  { to: '/app/vehicles', label: 'Avtomobillar', permission: 'vehicles.view' },
  { to: '/app/admin/users', label: 'Foydalanuvchilar', permission: 'users.view' },
  { to: '/app/admin/templates', label: 'Shablonlar', permission: 'templates.manage' },
  { to: '/app/admin/branches', label: 'Filiallar', permission: 'branches.manage' },
  { to: '/app/admin/risk-policy', label: 'Xavf siyosati', permission: 'risk.matrix.approve' },
  { to: '/app/admin/registration-requests', label: "So'rovlar", permission: 'registration.review' },
];

/**
 * Minimal authenticated shell for Phase 1: brand, current user + role, logout.
 * Role-specific dashboards arrive in later phases.
 */
export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border-1)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/app" aria-label="Bosh sahifa">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="flex size-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-2)]">
                <UserRound className="size-5" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[var(--text-1)]">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[var(--text-2)]">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>

            <Button variant="secondary" onClick={handleLogout} loading={loggingOut} aria-label="Chiqish">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </Button>
          </div>
        </div>

        {NAV_ITEMS.some((item) => can(user, item.permission)) && (
          <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
            <ShellNavLink to="/app" end>
              Bosh sahifa
            </ShellNavLink>
            {NAV_ITEMS.filter((item) => can(user, item.permission)).map((item) => (
              <ShellNavLink key={item.to} to={item.to}>
                {item.label}
              </ShellNavLink>
            ))}
          </nav>
        )}
      </header>

      <RiskPolicyBanner />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

function ShellNavLink({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-50 text-brand-700'
            : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]',
        )
      }
    >
      {children}
    </NavLink>
  );
}
