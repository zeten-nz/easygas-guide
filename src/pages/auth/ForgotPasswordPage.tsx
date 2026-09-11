import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Send, Info } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n/i18n';

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL ?? 'https://t.me/EasygasGarantbot';

/**
 * Manual employee password recovery (product decision: EasyGas is employee-only;
 * SMS/OTP self-service recovery was removed). This page does NOT reset anything
 * itself — it directs the employee to contact an administrator via Telegram. The
 * admin verifies the employee out of band and issues a one-time temporary
 * password, which the employee changes on first login.
 *
 * It NEVER asks for the current password.
 */
export function ForgotPasswordPage() {
  const t = useT();
  const backToLogin = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
    >
      <ArrowLeft className="size-4" />
      {t('forgot.backToLogin')}
    </Link>
  );

  return (
    <AuthLayout footer={backToLogin}>
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-500/15">
          <ShieldCheck className="size-8 text-brand-400" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-[var(--text-1)]">{t('forgot.title')}</h1>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[var(--text-2)]">
        {t('forgot.intro')}{' '}
        <span className="font-medium text-[var(--text-1)]">{t('forgot.introStrong')}</span>
      </p>

      {/* Explicit safety instruction — the employee must never send their password. */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-left">
        <Info className="mt-0.5 size-[18px] shrink-0 text-amber-400" />
        <p className="text-[13px] font-medium leading-relaxed text-amber-200">{t('forgot.warning')}</p>
      </div>

      <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="mt-6 block">
        <Button size="lg" className="w-full">
          <Send className="size-4" />
          {t('forgot.button')}
        </Button>
      </a>

      <p className="mt-4 text-center text-[13px] text-[var(--text-2)]">{t('forgot.note')}</p>
    </AuthLayout>
  );
}
