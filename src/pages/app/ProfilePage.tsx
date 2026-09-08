import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ProfileView } from './ProfileView';
import { fetchOwnProfile } from '../../api/users.api';
import { getApiError } from '../../api/client';

/**
 * §C own profile ("Mening profilim"). Read-only identity (self-editing role/branch
 * /status is not authorized) plus a clear path to the existing password-change
 * workflow. Self-scoped GET /users/me — no users.view permission needed.
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['profile', 'me'], queryFn: fetchOwnProfile });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Mening profilim</h1>
        <Button variant="secondary" onClick={() => navigate('/change-password')}>
          <KeyRound className="size-4" />
          Parolni o'zgartirish
        </Button>
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : query.isError ? (
          <Alert tone="error">{getApiError(query.error).message}</Alert>
        ) : query.data ? (
          <>
            <ProfileView user={query.data} />
            <p className="mt-3 px-1 text-[13px] leading-relaxed text-[var(--text-2)]">
              Parolni o'zgartirsangiz, boshqa qurilmalardagi barcha seanslaringiz tugatiladi va faqat shu qurilma
              tizimda qoladi. Ism, rol yoki filialni o'zgartirish uchun administratorga murojaat qiling.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
