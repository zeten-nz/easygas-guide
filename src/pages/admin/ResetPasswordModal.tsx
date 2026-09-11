import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, KeyRound, ShieldAlert } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import * as usersApi from '../../api/users.api';
import { getApiError } from '../../api/client';
import { displayPhone } from '../../lib/phone';
import type { UserDetail } from '../../types/auth';
import { useT, useLocale } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';

interface FormValues {
  currentPassword: string;
  reason: string;
}

/**
 * ADMIN manual recovery (§C). After verifying the employee OUT OF BAND (via
 * @EasygasGarantbot), the admin issues a one-time temporary password. The admin
 * re-confirms their own password and gives a mandatory reason; the generated
 * temporary password is shown ONCE and is never stored, logged, or cached.
 */
export function ResetPasswordModal({ target, onClose }: { target: UserDetail; onClose: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { currentPassword: '', reason: '' } });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => usersApi.resetUserPassword(target.id, v),
    onSuccess: () => {
      // The target's sessions are revoked + flagged must-change; refresh the list.
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const result = mutation.data; // held only in mutation state — gone when the modal unmounts

  async function copyTemp(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked — the admin can still read/copy it manually.
    }
  }

  return (
    <Modal open onClose={onClose} title={t('au.resetPw.title')}>
      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
            <ShieldAlert className="mt-0.5 size-[18px] shrink-0 text-emerald-500" />
            <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
              {t('au.resetPw.createdFor', { name: `${target.firstName} ${target.lastName}` })}{' '}
              <b className="text-[var(--text-1)]">{t('au.resetPw.onlyThisEmployee')}</b>{' '}
              {t('au.resetPw.sendPersonally')}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-[var(--text-2)]">{t('au.users.tempPassword')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 select-all rounded-xl border border-[var(--border-1)] bg-[var(--field-bg)] px-3.5 py-3 font-mono text-lg font-bold tracking-wide text-[var(--text-1)]">
                {result.temporaryPassword}
              </code>
              <Button type="button" variant="secondary" onClick={() => void copyTemp()} aria-label={t('au.resetPw.copyAria')}>
                {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-amber-600">
              <AlertTriangle className="size-4" />
              {t('au.resetPw.shownOnce')}
            </p>
            <p className="mt-1 text-[13px] text-[var(--text-2)]">
              {t('au.resetPw.expiresAt', {
                date: new Date(result.expiresAt).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ'),
              })}
            </p>
          </div>

          <Button type="button" className="w-full" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          noValidate
          className="space-y-4"
        >
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
            <KeyRound className="mt-0.5 size-[18px] shrink-0 text-amber-500" />
            <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
              {t('au.resetPw.warnBefore')}{' '}
              <b className="text-[var(--text-1)]">@EasygasGarantbot</b>
              {t('au.resetPw.warnMid')}{' '}
              <b className="text-[var(--text-1)]">
                {target.firstName} {target.lastName}
              </b>
              {t('au.resetPw.warnAfter', { phone: displayPhone(target.phone) })}
            </p>
          </div>

          {mutation.isError && <Alert tone="error">{localizeApiError(getApiError(mutation.error).code, t)}</Alert>}

          <PasswordInput
            label={t('au.resetPw.currentPwLabel')}
            autoComplete="current-password"
            placeholder={t('au.resetPw.currentPwPlaceholder')}
            error={fieldError(errors.currentPassword?.message, t)}
            {...register('currentPassword', { required: 'au.resetPw.currentPwRequired' })}
          />
          <Input
            label={t('au.resetPw.reasonLabel')}
            placeholder={t('au.resetPw.reasonPlaceholder')}
            error={fieldError(errors.reason?.message, t)}
            {...register('reason', {
              required: 'au.resetPw.reasonRequired',
              minLength: { value: 5, message: 'au.resetPw.reasonMin' },
              maxLength: { value: 500, message: 'au.resetPw.reasonMax' },
            })}
          />

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1" loading={mutation.isPending}>
              {t('au.resetPw.title')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
