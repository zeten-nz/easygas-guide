import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, Phone, User } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import * as authApi from '../../api/auth.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { formatNationalPhone, toE164 } from '../../lib/phone';
import { REGIONS } from '../../lib/regions';
import { useT, useLocale } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
import { regionLabel } from '../../i18n/labels';

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  branchId: string;
  comment: string;
  password: string;
  confirmPassword: string;
}

export function RegisterPage() {
  const t = useT();
  const { locale } = useLocale();
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      region: '',
      branchId: '',
      comment: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => setSubmitted(true),
    onError: (err) => setErrorCode(getApiError(err).code ?? 'UNKNOWN'),
  });

  const onSubmit = (values: FormValues) => {
    setErrorCode(null);
    const phone = toE164(values.phone);
    if (!phone) return;
    registerMutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone,
      region: values.region, // stored value is the canonical region name (unchanged)
      branchId: Number(values.branchId),
      comment: values.comment.trim() || undefined,
      password: values.password,
    });
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="size-9 text-emerald-600" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-[var(--text-1)]">{t('register.successTitle')}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{t('register.successBody')}</p>
          <Link to="/login" className="mt-6 w-full">
            <Button variant="secondary" size="lg" className="w-full">
              {t('register.backToLogin')}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-brand-600 transition-colors hover:text-brand-700">
            {t('register.loginLink')}
          </Link>
        </>
      }
    >
      <h1 className="text-xl font-bold text-[var(--text-1)]">{t('register.title')}</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">{t('register.subtitle')}</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {errorCode && <Alert tone="error">{localizeApiError(errorCode, t)}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('register.firstName')}
            autoComplete="given-name"
            placeholder={t('register.firstNamePlaceholder')}
            leftIcon={<User className="size-[18px]" />}
            error={fieldError(errors.firstName?.message, t)}
            {...register('firstName', {
              required: 'valid.firstNameRequired',
              minLength: { value: 2, message: 'valid.min2' },
            })}
          />
          <Input
            label={t('register.lastName')}
            autoComplete="family-name"
            placeholder={t('register.lastNamePlaceholder')}
            error={fieldError(errors.lastName?.message, t)}
            {...register('lastName', {
              required: 'valid.lastNameRequired',
              minLength: { value: 2, message: 'valid.min2' },
            })}
          />
        </div>

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

        <Select
          label={t('register.region')}
          error={fieldError(errors.region?.message, t)}
          defaultValue=""
          {...register('region', { required: 'valid.regionRequired' })}
        >
          <option value="" disabled>
            {t('register.regionPlaceholder')}
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {regionLabel(r, locale)}
            </option>
          ))}
        </Select>

        <Select
          label={t('register.branch')}
          error={
            fieldError(errors.branchId?.message, t) ??
            (branchesQuery.isError ? t('register.branchError') : undefined)
          }
          defaultValue=""
          disabled={branchesQuery.isLoading || branchesQuery.isError}
          {...register('branchId', { required: 'valid.branchRequired' })}
        >
          <option value="" disabled>
            {branchesQuery.isLoading ? t('register.branchLoading') : t('register.branchPlaceholder')}
          </option>
          {(branchesQuery.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {regionLabel(b.region, locale)}
            </option>
          ))}
        </Select>

        <Input
          label={t('register.comment')}
          placeholder={t('register.commentPlaceholder')}
          error={fieldError(errors.comment?.message, t)}
          {...register('comment', { maxLength: { value: 500, message: 'valid.commentTooLong' } })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordInput
            label={t('auth.field.password')}
            autoComplete="new-password"
            placeholder={t('register.passwordPlaceholder')}
            error={fieldError(errors.password?.message, t)}
            {...register('password', {
              required: 'valid.passwordRequired',
              minLength: { value: 8, message: 'valid.passwordMin8' },
            })}
          />
          <PasswordInput
            label={t('register.confirmPassword')}
            autoComplete="new-password"
            placeholder={t('register.confirmPlaceholder')}
            error={fieldError(errors.confirmPassword?.message, t)}
            {...register('confirmPassword', {
              required: 'valid.confirmRequired',
              validate: (v) => v === getValues('password') || 'valid.passwordsMismatch',
            })}
          />
        </div>

        <Alert tone="info">{t('register.infoNote')}</Alert>

        <Button type="submit" size="lg" loading={registerMutation.isPending} className="w-full">
          {t('register.submit')}
        </Button>
      </form>
    </AuthLayout>
  );
}
