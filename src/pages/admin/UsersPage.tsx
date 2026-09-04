import { useEffect, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Lock, LockOpen, Pencil, Plus, Search, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { UserFormModal } from './UserFormModal';
import { useAuth } from '../../features/auth/auth-context';
import * as usersApi from '../../api/users.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { ROLE_CODES, ROLE_LABELS, type RoleCode, type UserDetail, type UserStatus } from '../../types/auth';
import { cn } from '../../lib/utils';

export function UsersPage() {
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<RoleCode | ''>('');
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDetail | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserDetail | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const canFilterBranch = can(actor, 'users.assign_role');
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, enabled: canFilterBranch });

  const params: usersApi.ListUsersParams = {
    page,
    limit: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(role ? { role } : {}),
    ...(branchId ? { branchId: Number(branchId) } : {}),
    ...(status ? { status } : {}),
  };

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => usersApi.fetchUsers(params),
    placeholderData: keepPreviousData,
  });

  const blockMutation = useMutation({
    mutationFn: (target: UserDetail) =>
      target.status === 'ACTIVE' ? usersApi.blockUser(target.id) : usersApi.unblockUser(target.id),
    onSuccess: (_data, target) => {
      toast.success(target.status === 'ACTIVE' ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi blokdan chiqarildi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBlockTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setBlockTarget(null);
    },
  });

  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {can(actor, 'users.assign_role')
              ? 'Barcha foydalanuvchilarni boshqarish'
              : "O'z filialingiz foydalanuvchilari"}
          </p>
        </div>
        {can(actor, 'users.create') && (
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Yangi foydalanuvchi
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Ism, familiya yoki telefon..."
          leftIcon={<Search className="size-[18px]" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Qidiruv"
        />
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as RoleCode | '');
            setPage(1);
          }}
          aria-label="Rol bo'yicha filtr"
        >
          <option value="">Barcha rollar</option>
          {ROLE_CODES.map((code) => (
            <option key={code} value={code}>
              {ROLE_LABELS[code]}
            </option>
          ))}
        </Select>
        {canFilterBranch && (
          <Select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPage(1);
            }}
            aria-label="Filial bo'yicha filtr"
          >
            <option value="">Barcha filiallar</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as UserStatus | '');
            setPage(1);
          }}
          aria-label="Holat bo'yicha filtr"
        >
          <option value="">Barcha holatlar</option>
          <option value="ACTIVE">Faol</option>
          <option value="BLOCKED">Bloklangan</option>
        </Select>
      </div>

      <div className="mt-5 space-y-3">
        {usersQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {usersQuery.isError && <Alert tone="error">{getApiError(usersQuery.error).message}</Alert>}

        {usersQuery.data && usersQuery.data.users.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Users className="size-8" />
            <p className="text-sm">Foydalanuvchi topilmadi</p>
          </div>
        )}

        {usersQuery.data?.users.map((u) => (
          <div
            key={u.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4',
              u.status === 'BLOCKED' && 'opacity-70',
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[var(--text-1)]">
                  {u.firstName} {u.lastName}
                  {u.id === actor?.id && <span className="ml-1 text-xs text-[var(--text-2)]">(siz)</span>}
                </p>
                <RoleBadge role={u.role} />
                <StatusBadge status={u.status} />
              </div>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                {displayPhone(u.phone)} · {u.branchName ?? 'Filialsiz'} · {u.region}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {can(actor, 'users.update') && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    setEditTarget(u);
                    setFormOpen(true);
                  }}
                  aria-label={`${u.firstName}ni tahrirlash`}
                >
                  <Pencil className="size-4" />
                  <span className="hidden sm:inline">Tahrirlash</span>
                </Button>
              )}
              {can(actor, 'users.block') && u.id !== actor?.id && (
                <Button
                  variant={u.status === 'ACTIVE' ? 'danger-outline' : 'secondary'}
                  size="md"
                  onClick={() => setBlockTarget(u)}
                  aria-label={u.status === 'ACTIVE' ? `${u.firstName}ni bloklash` : `${u.firstName}ni blokdan chiqarish`}
                >
                  {u.status === 'ACTIVE' ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
                  <span className="hidden sm:inline">{u.status === 'ACTIVE' ? 'Bloklash' : 'Blokdan chiqarish'}</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {total > 25 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[var(--text-2)]">
            Jami {total} ta · {page}/{totalPages}-sahifa
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Oldingi sahifa">
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {formOpen && (
        <UserFormModal
          key={editTarget?.id ?? 'new'}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          editUser={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!blockTarget}
        title={blockTarget?.status === 'ACTIVE' ? 'Foydalanuvchini bloklash' : 'Blokdan chiqarish'}
        confirmLabel={blockTarget?.status === 'ACTIVE' ? 'Bloklash' : 'Blokdan chiqarish'}
        danger={blockTarget?.status === 'ACTIVE'}
        loading={blockMutation.isPending}
        onConfirm={() => blockTarget && blockMutation.mutate(blockTarget)}
        onCancel={() => setBlockTarget(null)}
      >
        {blockTarget?.status === 'ACTIVE' ? (
          <>
            <b>
              {blockTarget?.firstName} {blockTarget?.lastName}
            </b>{' '}
            bloklanadi: barcha faol sessiyalari darhol bekor qilinadi va tizimga kira olmaydi. Keyinchalik blokdan
            chiqarish mumkin.
          </>
        ) : (
          <>
            <b>
              {blockTarget?.firstName} {blockTarget?.lastName}
            </b>{' '}
            blokdan chiqariladi va yana tizimga kira oladi.
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

function RoleBadge({ role }: { role: RoleCode }) {
  const colors: Record<RoleCode, string> = {
    USTA: 'bg-sky-500/15 text-sky-700',
    MASTER: 'bg-violet-500/15 text-violet-700',
    RAHBAR: 'bg-amber-500/15 text-amber-700',
    SIFAT: 'bg-emerald-500/15 text-emerald-700',
    ADMIN: 'bg-brand-500/15 text-brand-700',
  };
  return <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', colors[role])}>{ROLE_LABELS[role]}</span>;
}

function StatusBadge({ status }: { status: UserStatus }) {
  return status === 'ACTIVE' ? (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Faol</span>
  ) : (
    <span className="rounded-full bg-ink-500/15 px-2.5 py-0.5 text-xs font-semibold text-ink-500">Bloklangan</span>
  );
}
