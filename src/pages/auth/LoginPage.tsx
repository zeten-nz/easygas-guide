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

interface FormValues {
  phone: string;
  password: string;
  rememberMe: boolean;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

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
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/app', { replace: true });
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const phone = toE164(values.phone);
    if (!phone) return;
    loginMutation.mutate({ phone, password: values.password, rememberMe: values.rememberMe });
  };

  return (
    <AuthLayout
      footer={
        <>
          Hisobingiz yo'qmi?{' '}
          <Link to="/register" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
            Ro'yxatdan o'tish
          </Link>
        </>
      }
    >
      <h1 className="text-xl font-bold text-[var(--text-1)]">Tizimga kirish</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">Telefon raqamingiz va parolingizni kiriting</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label="Telefon raqam"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="90 123 45 67"
          leftIcon={<Phone className="size-[18px]" />}
          prefix="+998"
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Telefon raqam kiritilishi shart',
            validate: (v) => toE164(v) !== null || "Telefon raqam to'liq emas",
            onChange: (e) => setValue('phone', formatNationalPhone(e.target.value)),
          })}
        />

        <PasswordInput
          label="Parol"
          autoComplete="current-password"
          placeholder="Parolingiz"
          error={errors.password?.message}
          {...register('password', { required: 'Parol kiritilishi shart' })}
        />

        <div className="flex items-center justify-between pt-1">
          <Checkbox label="Meni eslab qol" {...register('rememberMe')} />
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand-400 transition-colors hover:text-brand-300"
          >
            Parolni tiklash
          </Link>
        </div>

        <Button type="submit" size="lg" loading={loginMutation.isPending} className="w-full">
          Kirish
        </Button>
      </form>
    </AuthLayout>
  );
}
