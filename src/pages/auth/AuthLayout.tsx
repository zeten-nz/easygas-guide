import type { ReactNode } from 'react';
import { Send } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL ?? 'https://t.me/EasygasGarantbot';

/**
 * Shared premium dark shell for all authentication screens:
 * graphite backdrop, restrained red glow, centered glass card.
 */
export function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="theme-dark auth-backdrop flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <main className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size="lg" />
          <p className="text-center text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--text-2)]">
            Safety Technology
          </p>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8">{children}</div>

        {footer && <div className="mt-6 text-center text-sm text-[var(--text-2)]">{footer}</div>}

        <div className="mt-8 flex justify-center">
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-1)] bg-[var(--surface)] px-4 py-2 text-[13px] text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
          >
            <Send className="size-4" />
            Yordam kerakmi? @EasygasGarantbot
          </a>
        </div>
      </main>

      <p className="mt-8 text-center text-xs text-[var(--text-2)]/70">
        Safe installation. Verified work. Trusted service.
      </p>
    </div>
  );
}
