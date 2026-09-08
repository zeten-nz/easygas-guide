import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../features/auth/auth-context';
import * as authApi from '../../api/auth.api';
import { getApiError } from '../../api/client';

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * §D first-login password change. Reached when the session is on an admin-issued
 * temporary password (`user.mustChangePassword`). The route guard forces the user
 * here and blocks the rest of the app until the change succeeds — the server
 * enforces the same restriction, so this is UX, not the control.
 *
 * The "current password" here is the temporary one the admin handed over.
 */
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { setUser, logout } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

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
      navigate('/app', { replace: true });
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <AuthLayout
      footer={
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
        >
          Chiqish
        </button>
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-500/15">
          <KeyRound className="size-8 text-brand-400" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-[var(--text-1)]">Yangi parol o'rnating</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
          Bu vaqtinchalik parol. Ishni davom ettirish uchun uni almashtiring.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((v) => {
          setServerError(null);
          mutation.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword });
        })}
        noValidate
        className="mt-6 space-y-4"
      >
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <PasswordInput
          label="Vaqtinchalik parol"
          autoComplete="current-password"
          placeholder="Administrator bergan parol"
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: 'Vaqtinchalik parolni kiriting' })}
        />
        <PasswordInput
          label="Yangi parol"
          autoComplete="new-password"
          placeholder="Kamida 8 belgi"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'Yangi parol kiritilishi shart',
            minLength: { value: 8, message: 'Kamida 8 ta belgi' },
            validate: (v) => v !== getValues('currentPassword') || 'Yangi parol vaqtinchalik paroldan farq qilishi kerak',
          })}
        />
        <PasswordInput
          label="Yangi parolni tasdiqlang"
          autoComplete="new-password"
          placeholder="Parolni qayta kiriting"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Parolni qayta kiriting',
            validate: (v) => v === getValues('newPassword') || 'Parollar mos kelmadi',
          })}
        />

        {/* Session security: the server revokes every existing session on a
            password change and issues this device a fresh one. */}
        <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
          Xavfsizlik uchun parolni o'zgartirsangiz, boshqa qurilmalardagi barcha seanslaringiz
          tugatiladi — faqat shu qurilma tizimda qoladi.
        </p>

        <Button type="submit" size="lg" loading={mutation.isPending} className="w-full">
          Parolni o'rnatish
        </Button>
      </form>
    </AuthLayout>
  );
}
