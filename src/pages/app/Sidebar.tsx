import { Link, NavLink } from 'react-router-dom';
import { Brand } from '../../components/ui/Brand';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { cn } from '../../lib/utils';
import { NAV_GROUPS } from './nav-config';

/**
 * Grouped workspace navigation. Rendered as a fixed rail on desktop and inside
 * the mobile drawer (same markup, so there is one source of truth). Active route
 * uses NavLink's automatic aria-current; the active style is brand blue. Only
 * authorized items/groups appear — no dead links to unbuilt modules.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex h-full flex-col bg-[var(--surface)]">
      <div className="flex h-16 shrink-0 items-center border-b border-[var(--border-1)] px-5">
        <Link
          to="/app"
          onClick={onNavigate}
          aria-label="EASY GAS — bosh sahifa"
          className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          <Brand variant="wordmark" height={28} priority decorative />
        </Link>
      </div>

      <nav aria-label="Asosiy navigatsiya" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group, gi) => {
          const items = group.items.filter((it) => it.permission === null || can(user, it.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label ?? `group-${gi}`}>
              {group.label && (
                <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={cn('size-[18px] shrink-0', isActive ? 'text-blue-600' : 'text-[var(--text-3)]')} />
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <p className="shrink-0 border-t border-[var(--border-1)] px-5 py-3 text-xs text-[var(--text-3)]">
        EASY GAS · Safety Technology
      </p>
    </div>
  );
}
