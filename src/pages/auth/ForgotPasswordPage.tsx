import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, KeyRound, Phone } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import * as authApi from '../../api/auth.api';
import { getApiError } from '../../api/client';
import { formatNationalPhone, toE164, displayPhone } from '../../lib/phone';

type Step = 'phone' | 'otp' | 'password' | 'done';

interface PhoneForm {
  phone: string;
}
interface OtpForm {
  otp: string;
}
interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const phoneForm = useForm<PhoneForm>({ defaultValues: { phone: '' } });
  const otpForm = useForm<OtpForm>({ defaultValues: { otp: '' } });
  const passwordForm = useForm<PasswordForm>({ defaultValues: { password: '', confirmPassword: '' } });

  const requestMutation = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data, requestedPhone) => {
      setPhone(requestedPhone);
      setInfoMessage(data.message);
      setStep('otp');
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ otp }: { otp: string }) => authApi.verifyOtp(phone, otp),
    onSuccess: (data) => {
      setResetToken(data.resetToken);
      setServerError(null);
      setStep('password');
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  const resetMutation = useMutation({
    mutationFn: ({ password }: { password: string }) => authApi.resetPassword(resetToken, password),
    onSuccess: () => setStep('done'),
    onError: (err) => setServerError(getApiError(err).message),
  });

  const backToLogin = (
    <Link
      to="/login"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
    >
      <ArrowLeft className="size-4" />
      Kirish sahifasiga qaytish
    </Link>
  );

  if (step === 'done') {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-9 text-emerald-400" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-[var(--text-1)]">Parol o'zgartirildi</h1>
          <p className="mt-2 text-sm text-[var(--text-2)]">Endi yangi parolingiz bilan tizimga kirishingiz mumkin.</p>
          <Link to="/login" className="mt-6 w-full">
            <Button size="lg" className="w-full">
              Kirish
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout footer={backToLogin}>
      <h1 className="text-xl font-bold text-[var(--text-1)]">Parolni tiklash</h1>

      {step === 'phone' && (
        <>
          <p className="mt-1 text-sm text-[var(--text-2)]">Telefon raqamingizga SMS kod yuboramiz</p>
          <form
            onSubmit={phoneForm.handleSubmit((v) => {
              setServerError(null);
              const e164 = toE164(v.phone);
              if (!e164) return;
              requestMutation.mutate(e164);
            })}
            noValidate
            className="mt-6 space-y-4"
          >
            {serverError && <Alert tone="error">{serverError}</Alert>}
            <Input
              label="Telefon raqam"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="90 123 45 67"
              leftIcon={<Phone className="size-[18px]" />}
              prefix="+998"
              error={phoneForm.formState.errors.phone?.message}
              {...phoneForm.register('phone', {
                required: 'Telefon raqam kiritilishi shart',
                validate: (v) => toE164(v) !== null || "Telefon raqam to'liq emas",
                onChange: (e) => phoneForm.setValue('phone', formatNationalPhone(e.target.value)),
              })}
            />
            <Button type="submit" size="lg" loading={requestMutation.isPending} className="w-full">
              Kod yuborish
            </Button>
          </form>
        </>
      )}

      {step === 'otp' && (
        <>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            <span className="font-medium text-[var(--text-1)]">{displayPhone(phone)}</span> raqamiga yuborilgan 6 xonali
            kodni kiriting
          </p>
          <form
            onSubmit={otpForm.handleSubmit((v) => {
              setServerError(null);
              verifyMutation.mutate({ otp: v.otp });
            })}
            noValidate
            className="mt-6 space-y-4"
          >
            {infoMessage && <Alert tone="info">{infoMessage}</Alert>}
            {serverError && <Alert tone="error">{serverError}</Alert>}
            <Input
              label="SMS kod"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              maxLength={6}
              className="text-center text-xl font-bold tracking-[0.5em]"
              leftIcon={<KeyRound className="size-[18px]" />}
              error={otpForm.formState.errors.otp?.message}
              {...otpForm.register('otp', {
                required: 'Kod kiritilishi shart',
                pattern: { value: /^\d{6}$/, message: "Kod 6 ta raqamdan iborat bo'lishi kerak" },
                onChange: (e) => otpForm.setValue('otp', e.target.value.replace(/\D/g, '').slice(0, 6)),
              })}
            />
            <Button type="submit" size="lg" loading={verifyMutation.isPending} className="w-full">
              Tasdiqlash
            </Button>
            <button
              type="button"
              onClick={() => {
                setServerError(null);
                setInfoMessage(null);
                setStep('phone');
              }}
              className="w-full text-center text-sm text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
            >
              Boshqa raqam kiritish
            </button>
          </form>
        </>
      )}

      {step === 'password' && (
        <>
          <p className="mt-1 text-sm text-[var(--text-2)]">Hisobingiz uchun yangi parol o'rnating</p>
          <form
            onSubmit={passwordForm.handleSubmit((v) => {
              setServerError(null);
              resetMutation.mutate({ password: v.password });
            })}
            noValidate
            className="mt-6 space-y-4"
          >
            {serverError && <Alert tone="error">{serverError}</Alert>}
            <PasswordInput
              label="Yangi parol"
              autoComplete="new-password"
              placeholder="Kamida 8 belgi"
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password', {
                required: 'Parol kiritilishi shart',
                minLength: { value: 8, message: 'Kamida 8 ta belgi' },
              })}
            />
            <PasswordInput
              label="Parolni tasdiqlang"
              autoComplete="new-password"
              placeholder="Parolni qayta kiriting"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword', {
                required: 'Parolni qayta kiriting',
                validate: (v) => v === passwordForm.getValues('password') || 'Parollar mos kelmadi',
              })}
            />
            <Button type="submit" size="lg" loading={resetMutation.isPending} className="w-full">
              Parolni o'zgartirish
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
