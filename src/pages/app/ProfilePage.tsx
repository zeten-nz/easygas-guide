import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ProfileView } from './ProfileView';
import { fetchOwnProfile } from '../../api/users.api';
import { getApiError } from '../../api/client';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';

/**
 * §C own profile ("Mening profilim"). Read-only identity (self-editing role/branch
 * /status is not authorized) plus a clear path to the existing password-change
 * workflow. Self-scoped GET /users/me — no users.view permission needed.
 */
export function ProfilePage() {
  const navigate = useNavigate();
  const t = useT();
  const query = useQuery({ queryKey: ['profile', 'me'], queryFn: fetchOwnProfile });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('m.profile.title')}</h1>
        <Button variant="secondary" onClick={() => navigate('/change-password')}>
          <KeyRound className="size-4" />
          {t('m.profile.changePassword')}
        </Button>
      </div>

      <div className="mt-6">
        {query.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : query.isError ? (
          <Alert tone="error">{localizeApiError(getApiError(query.error).code, t)}</Alert>
        ) : query.data ? (
          <>
            <ProfileView user={query.data} />
            <p className="mt-3 px-1 text-[13px] leading-relaxed text-[var(--text-2)]">{t('m.profile.note')}</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
