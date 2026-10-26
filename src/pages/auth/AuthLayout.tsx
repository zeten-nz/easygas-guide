import type { ReactNode } from 'react';
import { Send } from 'lucide-react';
import { Brand } from '../../components/ui/Brand';
import { LanguageSelector } from '../../components/ui/LanguageSelector';
import { useT } from '../../i18n/i18n';

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL ?? 'https://t.me/EasygasGarantbot';

/**
 * Shared authentication shell. Uses the SAME light design language as the
 * main/admin app (cream page, white bordered card, real logo on a light surface,
 * shared tokens/controls) — no auth-only dark/glow/glass identity. A language
 * selector sits in the top bar so the visitor can switch uz/ru before signing in.
 */
export function AuthLayout({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const t = useT();
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)]">
      {/* Public top bar — mirrors the authenticated shell's bar (brand left, language right). */}
      <header className="flex items-center justify-between border-b border-[var(--border-1)] bg-[var(--surface)] px-4 py-3 sm:px-6">
        <Brand variant="wordmark" height={26} priority decorative />
        <LanguageSelector />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Brand variant="stacked" height={76} priority />
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-3)]">
              {t('common.brandTagline')}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(20,22,26,0.04),0_12px_32px_-16px_rgba(20,22,26,0.18)] sm:p-8">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-[var(--text-2)]">{footer}</div>}

          <div className="mt-8 flex justify-center">
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-1)] bg-[var(--surface)] px-4 py-2 text-[13px] text-[var(--text-2)] transition-colors hover:border-blue-500/50 hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <Send className="size-4" />
              {t('auth.support')} @EasygasGarantbot
            </a>
          </div>
        </div>
      </main>

      <p className="pb-8 text-center text-xs text-[var(--text-3)]">{t('auth.tagline')}</p>
    </div>
  );
}
