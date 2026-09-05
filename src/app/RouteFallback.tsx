import { Spinner } from '../components/ui/Spinner';

/**
 * Suspense fallback for lazily-loaded routes. Lightweight (it renders inside the
 * already-painted shell), accessible (role=status), and visually stable so a
 * chunk fetch does not cause a layout jump.
 */
export function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Spinner className="size-7 text-brand-500" />
      <p className="text-sm text-[var(--text-2)]">Yuklanmoqda…</p>
    </div>
  );
}
