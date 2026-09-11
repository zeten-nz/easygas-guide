import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { RiskPolicyBanner } from '../../features/safety/RiskPolicyBanner';
import { RouteFallback } from '../../app/RouteFallback';
import { RouteErrorBoundary } from '../../app/RouteErrorBoundary';
import { Brand } from '../../components/ui/Brand';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { useAuth } from '../../features/auth/auth-context';
import { useT } from '../../i18n/i18n';
import { Sidebar } from './Sidebar';
import { ProfileMenu } from './ProfileMenu';
import { activeSectionLabel } from './nav-config';

/**
 * Phase 11A workspace shell: a grouped left sidebar (desktop) / drawer (mobile),
 * a compact top bar with page context + the account menu, and a wide content area
 * suited to tables. Existing routes are unchanged — every page renders inside this
 * shell. The risk-policy banner, route error boundary and lazy-route Suspense are
 * preserved from the previous shell.
 */
export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const t = useT();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Drawer accessibility (it is role="dialog" aria-modal): body scroll locks, focus
  // moves into the panel on open and is RESTORED to the trigger (hamburger) on close,
  // Escape closes, and Tab is trapped inside. (Tapping a nav item closes it via the
  // Sidebar's onNavigate; the backdrop/✕ also close it.)
  useEffect(() => {
    if (!drawerOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = drawerRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href],button:not([disabled])') ?? []);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    focusables()[0]?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.(); // restore focus to the hamburger
    };
  }, [drawerOpen]);

  if (!user) return null;

  const sectionKey = activeSectionLabel(location.pathname);

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--border-1)] lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 motion-safe:transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('nav.drawerAria')}
            className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-[var(--border-1)] shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t('nav.menuClose')}
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column (offset by the fixed rail on desktop) */}
      <div className="flex min-h-dvh flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[var(--border-1)] bg-[var(--surface)]/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('nav.menu')}
              className="inline-flex size-10 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            {/* Brand on mobile (the rail carries it on desktop); page context on desktop.
                Eager so the (CSS-hidden at desktop widths) img still decodes — no broken logo. */}
            <span className="lg:hidden">
              <Brand variant="wordmark" height={26} priority decorative />
            </span>
            {sectionKey && (
              <p className="hidden truncate text-sm font-medium text-[var(--text-2)] lg:block">{t(sectionKey)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ProfileMenu />
          </div>
        </header>

        <RiskPolicyBanner />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <RouteErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
