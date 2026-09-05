import { Spinner } from './Spinner';
import { Brand } from './Brand';

/** Branded full-screen loading / app fallback. */
export function FullScreenLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-[var(--bg)]" role="status" aria-live="polite">
      <Brand variant="stacked" height={72} priority />
      <Spinner className="size-7 text-brand-500" />
      <span className="text-sm text-[var(--text-2)]">{label ?? 'Yuklanmoqda…'}</span>
    </div>
  );
}
