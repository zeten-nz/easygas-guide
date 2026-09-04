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
  const [serverError, setServerError] = useState<string | null>(null);
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
    onError: (err) => setServerError(getApiError(err).message),
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    const phone = toE164(values.phone);
    if (!phone) return;
    registerMutation.mutate({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone,
      region: values.region,
      branchId: Number(values.branchId),
      comment: values.comment.trim() || undefined,
      password: values.password,
    });
  };

  if (submitted) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-9 text-emerald-400" />
          </span>
          <h1 className="mt-5 text-xl font-bold text-[var(--text-1)]">So'rovingiz qabul qilindi</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
            So'rovingiz administrator tomonidan ko'rib chiqiladi. Tasdiqlangandan so'ng ushbu telefon raqam va parol
            bilan tizimga kirishingiz mumkin bo'ladi.
          </p>
          <Link to="/login" className="mt-6 w-full">
            <Button variant="secondary" size="lg" className="w-full">
              Kirish sahifasiga qaytish
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
          Hisobingiz bormi?{' '}
          <Link to="/login" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
            Kirish
          </Link>
        </>
      }
    >
      <h1 className="text-xl font-bold text-[var(--text-1)]">Ro'yxatdan o'tish</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">
        So'rovingiz administrator tomonidan ko'rib chiqiladi va tasdiqlanadi
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Ism"
            autoComplete="given-name"
            placeholder="Ismingiz"
            leftIcon={<User className="size-[18px]" />}
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'Ism kiritilishi shart',
              minLength: { value: 2, message: 'Kamida 2 ta harf' },
            })}
          />
          <Input
            label="Familiya"
            autoComplete="family-name"
            placeholder="Familiyangiz"
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'Familiya kiritilishi shart',
              minLength: { value: 2, message: 'Kamida 2 ta harf' },
            })}
          />
        </div>

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

        <Select
          label="Viloyat"
          error={errors.region?.message}
          defaultValue=""
          {...register('region', { required: 'Viloyat tanlanishi shart' })}
        >
          <option value="" disabled>
            Viloyatni tanlang
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <Select
          label="Servis filiali"
          error={
            errors.branchId?.message ??
            (branchesQuery.isError ? "Filiallar ro'yxatini yuklab bo'lmadi. Sahifani yangilang." : undefined)
          }
          defaultValue=""
          disabled={branchesQuery.isLoading || branchesQuery.isError}
          {...register('branchId', { required: 'Servis filiali tanlanishi shart' })}
        >
          <option value="" disabled>
            {branchesQuery.isLoading ? 'Yuklanmoqda…' : 'Filialni tanlang'}
          </option>
          {(branchesQuery.data ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} — {b.region}
            </option>
          ))}
        </Select>

        <Input
          label="Izoh (ixtiyoriy)"
          placeholder="Masalan: 5 yillik tajribaga ega ustaman"
          error={errors.comment?.message}
          {...register('comment', { maxLength: { value: 500, message: 'Izoh juda uzun' } })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PasswordInput
            label="Parol"
            autoComplete="new-password"
            placeholder="Kamida 8 belgi"
            error={errors.password?.message}
            {...register('password', {
              required: 'Parol kiritilishi shart',
              minLength: { value: 8, message: 'Kamida 8 ta belgi' },
            })}
          />
          <PasswordInput
            label="Parolni tasdiqlang"
            autoComplete="new-password"
            placeholder="Parolni qayta kiriting"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Parolni qayta kiriting',
              validate: (v) => v === getValues('password') || 'Parollar mos kelmadi',
            })}
          />
        </div>

        <Alert tone="info">So'rov yuborilgach, hisobingiz administrator tasdig'idan so'ng faollashadi.</Alert>

        <Button type="submit" size="lg" loading={registerMutation.isPending} className="w-full">
          So'rov yuborish
        </Button>
      </form>
    </AuthLayout>
  );
}
