import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, KeyRound, Lock, LockOpen, Pencil, UserX } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { ProfileView } from '../app/ProfileView';
import { useAuth } from '../../features/auth/auth-context';
import * as usersApi from '../../api/users.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import type { UserDetail } from '../../types/auth';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';

/**
 * §C employee profile. Authorization is enforced on the SERVER (GET /users/:id):
 * out-of-scope / nonexistent ids return 404, and roles without users.view get 403
 * — this page just renders those states honestly. Management actions reuse the
 * existing secure modals (edit, block/unblock, one-time temporary password reset).
 */
export function UserDetailPage() {
  const t = useT();
  const { id } = useParams();
  const userId = Number(id);
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const query = useQuery({
    queryKey: ['admin', 'users', 'detail', userId],
    queryFn: () => usersApi.fetchUser(userId),
    enabled: Number.isFinite(userId) && userId > 0,
    retry: false,
  });

  const detail = query.data;
  const isSelf = detail?.id === actor?.id;

  const blockMutation = useMutation({
    mutationFn: (u: UserDetail) => (u.status === 'ACTIVE' ? usersApi.blockUser(u.id) : usersApi.unblockUser(u.id)),
    onSuccess: (_d, u) => {
      toast.success(u.status === 'ACTIVE' ? t('au.users.toast.blocked') : t('au.users.toast.unblocked'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBlockOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setBlockOpen(false);
    },
  });

  const status = isAxiosError(query.error) ? query.error.response?.status : undefined;

  const back = (
    <Link
      to="/app/admin/users"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
    >
      <ArrowLeft className="size-4" />
      {t('au.users.title')}
    </Link>
  );

  if (query.isLoading) {
    return (
      <div>
        {back}
        <div className="flex justify-center py-20">
          <Spinner className="size-7 text-blue-600" />
        </div>
      </div>
    );
  }

  if (query.isError || !detail) {
    const notFound = status === 404;
    const forbidden = status === 403;
    return (
      <div className="mx-auto max-w-2xl">
        {back}
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] px-6 py-16 text-center text-[var(--text-2)]">
          <UserX className="size-8 text-[var(--text-3)]" />
          <div>
            <p className="font-medium text-[var(--text-1)]">
              {notFound
                ? t('au.userDetail.notFoundTitle')
                : forbidden
                  ? t('au.userDetail.forbiddenTitle')
                  : t('au.userDetail.errorTitle')}
            </p>
            <p className="mt-1 text-sm">
              {notFound
                ? t('au.userDetail.notFoundBody')
                : forbidden
                  ? t('au.userDetail.forbiddenBody')
                  : localizeApiError(getApiError(query.error).code, t)}
            </p>
          </div>
          {!notFound && !forbidden && (
            <Button variant="secondary" size="sm" onClick={() => query.refetch()}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const showEdit = can(actor, 'users.update');
  const showReset = can(actor, 'users.reset_password') && !isSelf;
  const showBlock = can(actor, 'users.block') && !isSelf;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {back}
      </div>

      <div className="mt-5">
        <ProfileView user={detail} />
      </div>

      {(showEdit || showReset || showBlock) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {showEdit && (
            <Button variant="secondary" size="md" onClick={() => setFormOpen(true)}>
              <Pencil className="size-4" />
              {t('au.action.edit')}
            </Button>
          )}
          {showReset && (
            <Button variant="secondary" size="md" onClick={() => setResetOpen(true)}>
              <KeyRound className="size-4" />
              {t('au.users.tempPassword')}
            </Button>
          )}
          {showBlock && (
            <Button variant={detail.status === 'ACTIVE' ? 'danger-outline' : 'secondary'} size="md" onClick={() => setBlockOpen(true)}>
              {detail.status === 'ACTIVE' ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
              {detail.status === 'ACTIVE' ? t('au.users.block') : t('au.users.unblock')}
            </Button>
          )}
        </div>
      )}

      {formOpen && (
        <UserFormModal
          key={detail.id}
          editUser={detail}
          onClose={() => {
            setFormOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', userId] });
          }}
        />
      )}
      {resetOpen && (
        <ResetPasswordModal
          target={detail}
          onClose={() => {
            setResetOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'detail', userId] });
          }}
        />
      )}
      <ConfirmDialog
        open={blockOpen}
        title={detail.status === 'ACTIVE' ? t('au.users.blockTitle') : t('au.users.unblock')}
        confirmLabel={detail.status === 'ACTIVE' ? t('au.users.block') : t('au.users.unblock')}
        danger={detail.status === 'ACTIVE'}
        loading={blockMutation.isPending}
        onConfirm={() => blockMutation.mutate(detail)}
        onCancel={() => setBlockOpen(false)}
      >
        {detail.status === 'ACTIVE' ? (
          <>
            <b>
              {detail.firstName} {detail.lastName}
            </b>{' '}
            {t('au.userDetail.blockBody')}
          </>
        ) : (
          <>
            <b>
              {detail.firstName} {detail.lastName}
            </b>{' '}
            {t('au.users.unblockBody')}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}
