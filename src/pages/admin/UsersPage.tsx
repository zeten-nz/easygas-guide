import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { KeyRound, Lock, LockOpen, MoreHorizontal, Pencil, Plus, Search, UserRound, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination } from '../../components/ui/Pagination';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { RoleBadge, StatusBadge } from './user-badges';
import { useAuth } from '../../features/auth/auth-context';
import { useTableParams } from '../../lib/useTableParams';
import * as usersApi from '../../api/users.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { ROLE_CODES, ROLE_LABELS, type RoleCode, type UserDetail } from '../../types/auth';

export function UsersPage() {
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const { page, pageSize, filters, setPage, setPageSize, setFilter } = useTableParams(
    ['search', 'role', 'branchId', 'status'],
    { defaultPageSize: 25 },
  );

  // Local, debounced mirror of the URL search so typing does not flood history.
  const [searchInput, setSearchInput] = useState(filters.search);
  // Adjust the input when the URL search changes externally (e.g. browser Back) —
  // the React-recommended "reset state on change during render" pattern.
  const [prevUrlSearch, setPrevUrlSearch] = useState(filters.search);
  if (filters.search !== prevUrlSearch) {
    setPrevUrlSearch(filters.search);
    setSearchInput(filters.search);
  }
  useEffect(() => {
    if (searchInput === filters.search) return;
    const t = setTimeout(() => setFilter('search', searchInput.trim(), true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserDetail | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserDetail | null>(null);
  const [resetTarget, setResetTarget] = useState<UserDetail | null>(null);

  const canFilterBranch = can(actor, 'users.assign_role');
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, enabled: canFilterBranch });

  const params: usersApi.ListUsersParams = {
    page,
    limit: pageSize,
    excludeSelf: true, // the directory never lists the current viewer (own profile handles them)
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.role ? { role: filters.role as RoleCode } : {}),
    ...(filters.branchId ? { branchId: Number(filters.branchId) } : {}),
    ...(filters.status ? { status: filters.status as 'ACTIVE' | 'BLOCKED' } : {}),
  };

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => usersApi.fetchUsers(params),
    placeholderData: keepPreviousData,
  });

  const total = usersQuery.data?.total ?? 0;
  const rows = usersQuery.data?.users ?? [];

  // Recover if this page went empty (e.g. filtering shrank the set) — jump to the
  // last valid page instead of showing a blank page with rows beyond it.
  useEffect(() => {
    if (usersQuery.isPlaceholderData) return;
    if (total > 0 && rows.length === 0 && page > 1) {
      setPage(Math.max(1, Math.ceil(total / pageSize)));
    }
  }, [usersQuery.isPlaceholderData, total, rows.length, page, pageSize, setPage]);

  const blockMutation = useMutation({
    mutationFn: (target: UserDetail) =>
      target.status === 'ACTIVE' ? usersApi.blockUser(target.id) : usersApi.unblockUser(target.id),
    onSuccess: (_data, target) => {
      toast.success(target.status === 'ACTIVE' ? 'Xodim bloklandi' : 'Xodim blokdan chiqarildi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setBlockTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setBlockTarget(null);
    },
  });

  const canManage = can(actor, 'users.update') || can(actor, 'users.reset_password') || can(actor, 'users.block');

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Xodimlar</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {canFilterBranch ? 'Barcha filiallar xodimlarini boshqaring' : "O'z filialingiz xodimlari"}
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
            Yangi xodim
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Ism, familiya yoki telefon…"
          leftIcon={<Search className="size-[18px]" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Qidiruv"
        />
        <Select value={filters.role} onChange={(e) => setFilter('role', e.target.value)} aria-label="Rol bo'yicha filtr">
          <option value="">Barcha rollar</option>
          {ROLE_CODES.map((code) => (
            <option key={code} value={code}>
              {ROLE_LABELS[code]}
            </option>
          ))}
        </Select>
        {canFilterBranch && (
          <Select value={filters.branchId} onChange={(e) => setFilter('branchId', e.target.value)} aria-label="Filial bo'yicha filtr">
            <option value="">Barcha filiallar</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Holat bo'yicha filtr">
          <option value="">Barcha holatlar</option>
          <option value="ACTIVE">Faol</option>
          <option value="BLOCKED">Bloklangan</option>
        </Select>
      </div>

      <div className="relative mt-5 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {usersQuery.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : usersQuery.isError ? (
          <div className="p-4">
            <Alert tone="error">{getApiError(usersQuery.error).message}</Alert>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center text-[var(--text-2)]">
            <Users className="size-8 text-[var(--text-3)]" />
            <div>
              <p className="font-medium text-[var(--text-1)]">Xodim topilmadi</p>
              <p className="mt-1 text-sm">Qidiruv yoki filtrlarni o'zgartirib ko'ring.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                  <th className="px-4 py-3 font-semibold">Xodim</th>
                  <th className="px-4 py-3 font-semibold">Rol</th>
                  <th className="px-4 py-3 font-semibold">Filial</th>
                  <th className="px-4 py-3 font-semibold">Holat</th>
                  {canManage && <th className="px-4 py-3 text-right font-semibold">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--surface-2)]/50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/app/admin/users/${u.id}`}
                        className="font-semibold text-[var(--text-1)] hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                      >
                        {u.firstName} {u.lastName}
                      </Link>
                      <p className="mt-0.5 text-[var(--text-2)]">{displayPhone(u.phone)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">{u.branchName ?? 'Filialsiz'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <RowActions
                          u={u}
                          actorId={actor?.id}
                          onEdit={() => {
                            setEditTarget(u);
                            setFormOpen(true);
                          }}
                          onReset={() => setResetTarget(u)}
                          onBlock={() => setBlockTarget(u)}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <ul className="divide-y divide-[var(--border-1)] sm:hidden">
              {rows.map((u) => (
                <li key={u.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link
                      to={`/app/admin/users/${u.id}`}
                      className="font-semibold text-[var(--text-1)] hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    >
                      {u.firstName} {u.lastName}
                    </Link>
                    <p className="mt-0.5 text-sm text-[var(--text-2)]">{displayPhone(u.phone)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <RoleBadge role={u.role} />
                      <StatusBadge status={u.status} />
                      <span className="text-xs text-[var(--text-3)]">{u.branchName ?? 'Filialsiz'}</span>
                    </div>
                  </div>
                  {canManage && (
                    <RowActions
                      u={u}
                      actorId={actor?.id}
                      onEdit={() => {
                        setEditTarget(u);
                        setFormOpen(true);
                      }}
                      onReset={() => setResetTarget(u)}
                      onBlock={() => setBlockTarget(u)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {total > 0 && (
        <div className="mt-4">
          <Pagination page={page} pageSize={pageSize} total={total} noun="xodim" onPageChange={setPage} onPageSizeChange={setPageSize} />
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

      {resetTarget && <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)} />}

      <ConfirmDialog
        open={!!blockTarget}
        title={blockTarget?.status === 'ACTIVE' ? 'Xodimni bloklash' : 'Blokdan chiqarish'}
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

/** Per-row actions in an accessible menu — keeps the row dense and the name link clean. */
function RowActions({
  u,
  actorId,
  onEdit,
  onReset,
  onBlock,
}: {
  u: UserDetail;
  actorId?: number;
  onEdit: () => void;
  onReset: () => void;
  onBlock: () => void;
}) {
  const { user: actor } = useAuth();
  const navigate = useNavigate();
  const isSelf = u.id === actorId;
  return (
    <DropdownMenu
      align="end"
      button={
        <button
          type="button"
          aria-label={`${u.firstName} ${u.lastName} — amallar`}
          className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          <MoreHorizontal className="size-5" />
        </button>
      }
    >
      {(close) => (
        <>
          <MenuItem
            icon={<UserRound className="size-[18px]" />}
            onClick={() => {
              close();
              navigate(`/app/admin/users/${u.id}`);
            }}
          >
            Profilni ko'rish
          </MenuItem>
          {can(actor, 'users.update') && (
            <MenuItem
              icon={<Pencil className="size-[18px]" />}
              onClick={() => {
                close();
                onEdit();
              }}
            >
              Tahrirlash
            </MenuItem>
          )}
          {can(actor, 'users.reset_password') && !isSelf && (
            <MenuItem
              icon={<KeyRound className="size-[18px]" />}
              onClick={() => {
                close();
                onReset();
              }}
            >
              Vaqtinchalik parol
            </MenuItem>
          )}
          {can(actor, 'users.block') && !isSelf && (
            <MenuItem
              icon={u.status === 'ACTIVE' ? <Lock className="size-[18px]" /> : <LockOpen className="size-[18px]" />}
              danger={u.status === 'ACTIVE'}
              onClick={() => {
                close();
                onBlock();
              }}
            >
              {u.status === 'ACTIVE' ? 'Bloklash' : 'Blokdan chiqarish'}
            </MenuItem>
          )}
        </>
      )}
    </DropdownMenu>
  );
}
