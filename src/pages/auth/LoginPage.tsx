import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Checkbox } from '../../components/ui/Checkbox';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../features/auth/auth-context';
import * as authApi from '../../api/auth.api';
import { getApiError } from '../../api/client';
import { formatNationalPhone, toE164 } from '../../lib/phone';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';

interface FormValues {
  phone: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const t = useT();
  // Store the STABLE error code (not a translated string) so a visible error
  // re-translates when the language changes.
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { phone: '', password: '', rememberMe: false },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setUser(user);
      // §D — a temporary-password login goes straight to the forced change screen.
      if (user.mustChangePassword) {
        navigate('/change-password', { replace: true });
        return;
      }
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/app', { replace: true });
    },
    onError: (err) => setErrorCode(getApiError(err).code ?? 'UNKNOWN'),
  });

  const onSubmit = (values: FormValues) => {
    setErrorCode(null);
    const phone = toE164(values.phone);
    if (!phone) return;
    loginMutation.mutate({ phone, password: values.password, rememberMe: values.rememberMe });
  };

  return (
    <AuthLayout
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            {t('login.registerLink')}
          </Link>
        </>
      }
    >
      <h1 className="text-xl font-bold text-[var(--text-1)]">{t('login.title')}</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">{t('login.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {errorCode && <Alert tone="error">{localizeApiError(errorCode, t)}</Alert>}

        <Input
          label={t('auth.field.phone')}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder={t('auth.field.phonePlaceholder')}
          leftIcon={<Phone className="size-[18px]" />}
          prefix="+998"
          error={fieldError(errors.phone?.message, t)}
          {...register('phone', {
            required: 'valid.phoneRequired',
            validate: (v) => toE164(v) !== null || 'valid.phoneInvalid',
            onChange: (e) => setValue('phone', formatNationalPhone(e.target.value)),
          })}
        />

        <PasswordInput
          label={t('auth.field.password')}
          autoComplete="current-password"
          placeholder={t('auth.field.passwordPlaceholder')}
          error={fieldError(errors.password?.message, t)}
          {...register('password', { required: 'valid.passwordRequired' })}
        />

        <div className="flex items-center justify-between pt-1">
          <Checkbox label={t('login.rememberMe')} {...register('rememberMe')} />
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            {t('login.forgot')}
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loginMutation.isPending} className="w-full">
          {t('login.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
