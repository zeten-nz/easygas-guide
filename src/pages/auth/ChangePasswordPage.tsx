import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../features/auth/auth-context';
import * as authApi from '../../api/auth.api';
import { getApiError } from '../../api/client';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password change — serves two modes with the SAME server endpoint:
 *  - FORCED (`user.mustChangePassword`): reached when the session is on an
 *    admin-issued temporary password. The route guard forces the user here and
 *    blocks the rest of the app until the change succeeds (server-enforced too);
 *    the "current" password is the temporary one.
 *  - VOLUNTARY: reached from the profile menu; the "current" password is the
 *    user's real password.
 * Either way the server revokes all sessions and issues this device a fresh one.
 */
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const t = useT();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const forced = !!user?.mustChangePassword;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (updated) => {
      setUser(updated); // mustChangePassword is now false → the guard releases the app
      if (!forced) toast.success(t('changePw.toastSuccess'));
      navigate(forced ? '/app' : '/app/profile', { replace: true });
    },
    onError: (err) => setErrorCode(getApiError(err).code ?? 'UNKNOWN'),
  });

  return (
    <AuthLayout
      footer={
        forced ? (
          <button
            type="button"
            onClick={() => void logout()}
            className="text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
          >
            {t('common.logout')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/app/profile')}
            className="text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
          >
            {t('changePw.cancel')}
          </button>
        )
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-50">
          <KeyRound className="size-8 text-brand-600" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-[var(--text-1)]">
          {forced ? t('changePw.forcedTitle') : t('changePw.voluntaryTitle')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
          {forced ? t('changePw.forcedSubtitle') : t('changePw.voluntarySubtitle')}
        </p>
      </div>

      <form
        onSubmit={handleSubmit((v) => {
          setErrorCode(null);
          mutation.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword });
        })}
        noValidate
        className="mt-6 space-y-4"
      >
        {errorCode && <Alert tone="error">{localizeApiError(errorCode, t)}</Alert>}

        <PasswordInput
          label={forced ? t('changePw.tempLabel') : t('changePw.currentLabel')}
          autoComplete="current-password"
          placeholder={forced ? t('changePw.tempPlaceholder') : t('changePw.currentPlaceholder')}
          error={fieldError(errors.currentPassword?.message, t)}
          {...register('currentPassword', {
            required: forced ? 'valid.tempPasswordRequired' : 'valid.currentPasswordRequired',
          })}
        />
        <PasswordInput
          label={t('changePw.newLabel')}
          autoComplete="new-password"
          placeholder={t('changePw.newPlaceholder')}
          error={fieldError(errors.newPassword?.message, t)}
          {...register('newPassword', {
            required: 'valid.newPasswordRequired',
            minLength: { value: 8, message: 'valid.passwordMin8' },
            validate: (v) => v !== getValues('currentPassword') || 'valid.passwordMustDiffer',
          })}
        />
        <PasswordInput
          label={t('changePw.confirmLabel')}
          autoComplete="new-password"
          placeholder={t('changePw.confirmPlaceholder')}
          error={fieldError(errors.confirmPassword?.message, t)}
          {...register('confirmPassword', {
            required: 'valid.confirmRequired',
            validate: (v) => v === getValues('newPassword') || 'valid.passwordsMismatch',
          })}
        />

        {/* Session security: the server revokes every existing session on a
            password change and issues this device a fresh one. */}
        <p className="text-[13px] leading-relaxed text-[var(--text-2)]">{t('changePw.sessionNote')}</p>

        <Button type="submit" size="lg" loading={mutation.isPending} className="w-full">
          {t('changePw.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
