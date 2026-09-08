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
 *  - VOLUNTARY: reached from "Mening profilim → Parolni o'zgartirish"; the
 *    "current" password is the user's real password.
 * Either way the server revokes all sessions and issues this device a fresh one.
 */
export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
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
      if (!forced) toast.success("Parol o'zgartirildi");
      navigate(forced ? '/app' : '/app/profile', { replace: true });
    },
    onError: (err) => setServerError(getApiError(err).message),
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
            Chiqish
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/app/profile')}
            className="text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
          >
            Bekor qilish
          </button>
        )
      }
    >
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-brand-500/15">
          <KeyRound className="size-8 text-brand-400" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-[var(--text-1)]">
          {forced ? "Yangi parol o'rnating" : "Parolni o'zgartirish"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">
          {forced
            ? 'Bu vaqtinchalik parol. Ishni davom ettirish uchun uni almashtiring.'
            : 'Joriy parolingizni tasdiqlang va yangi parol tanlang.'}
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
          label={forced ? 'Vaqtinchalik parol' : 'Joriy parol'}
          autoComplete="current-password"
          placeholder={forced ? 'Administrator bergan parol' : 'Joriy parolingiz'}
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: forced ? 'Vaqtinchalik parolni kiriting' : 'Joriy parolni kiriting' })}
        />
        <PasswordInput
          label="Yangi parol"
          autoComplete="new-password"
          placeholder="Kamida 8 belgi"
          error={errors.newPassword?.message}
          {...register('newPassword', {
            required: 'Yangi parol kiritilishi shart',
            minLength: { value: 8, message: 'Kamida 8 ta belgi' },
            validate: (v) => v !== getValues('currentPassword') || 'Yangi parol joriy paroldan farq qilishi kerak',
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
