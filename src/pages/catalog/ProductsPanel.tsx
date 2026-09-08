import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, History, MoreHorizontal, Package, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../features/auth/auth-context';
import { useTableParams } from '../../lib/useTableParams';
import { can } from '../../lib/permissions';
import { formatUZS } from '../../lib/money';
import { getApiError } from '../../api/client';
import * as catalogApi from '../../api/catalog.api';
import { listReference } from '../../api/reference.api';
import type { Product, ReferenceKind } from '../../types/catalog';
import { ProductFormModal } from './ProductFormModal';
import { PriceHistoryModal } from './PriceHistoryModal';

function useRefOptions(kind: ReferenceKind, enabled = true) {
  return useQuery({
    queryKey: ['reference', kind, 'active-options'],
    queryFn: () => listReference(kind, { status: 'ACTIVE', limit: 100 }),
    select: (d) => d.items,
    enabled,
  });
}

export function ProductsPanel() {
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const canManage = can(actor, 'catalog.manage');
  const { page, pageSize, filters, setPage, setPageSize, setFilter } = useTableParams(
    ['search', 'status', 'companyId', 'categoryId', 'brandId', 'sort', 'order'],
    { defaultPageSize: 25 },
  );

  const [searchInput, setSearchInput] = useState(filters.search);
  const [prevSearch, setPrevSearch] = useState(filters.search);
  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setSearchInput(filters.search);
  }
  useEffect(() => {
    if (searchInput === filters.search) return;
    const t = setTimeout(() => setFilter('search', searchInput.trim(), true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Product | null>(null);

  const companies = useRefOptions('companies', canManage || !!filters.companyId || true);
  const categories = useRefOptions('product-categories');

  const params: catalogApi.ListProductsParams = {
    page,
    limit: pageSize,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status as 'ACTIVE' | 'ARCHIVED' } : {}),
    ...(filters.companyId ? { companyId: Number(filters.companyId) } : {}),
    ...(filters.categoryId ? { categoryId: Number(filters.categoryId) } : {}),
    ...(filters.sort ? { sort: filters.sort as catalogApi.ListProductsParams['sort'] } : {}),
    ...(filters.order ? { order: filters.order as 'asc' | 'desc' } : {}),
  };

  const query = useQuery({
    queryKey: ['catalog', 'products', params],
    queryFn: () => catalogApi.listProducts(params),
    placeholderData: keepPreviousData,
  });

  const total = query.data?.total ?? 0;
  const rows = query.data?.items ?? [];

  useEffect(() => {
    if (query.isPlaceholderData) return;
    if (total > 0 && rows.length === 0 && page > 1) setPage(Math.max(1, Math.ceil(total / pageSize)));
  }, [query.isPlaceholderData, total, rows.length, page, pageSize, setPage]);

  const statusMutation = useMutation({
    mutationFn: (p: Product) => (p.status === 'ACTIVE' ? catalogApi.archiveProduct(p.id) : catalogApi.reactivateProduct(p.id)),
    onSuccess: (_d, p) => {
      toast.success(p.status === 'ACTIVE' ? 'Mahsulot arxivlandi' : 'Mahsulot faollashtirildi');
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
    },
    onError: (err) => toast.error(getApiError(err).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (p: Product) => catalogApi.deleteProduct(p.id),
    onSuccess: () => {
      toast.success("Mahsulot o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-[var(--text-2)]">Mahsulotlar narx bazasi. Narxlar tasdiqlangan biznes narxlari hisoblanadi.</p>
        {canManage && (
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Yangi mahsulot
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Kod yoki nom…"
          leftIcon={<Search className="size-[18px]" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Qidiruv"
        />
        <Select value={filters.companyId} onChange={(e) => setFilter('companyId', e.target.value)} aria-label="Kompaniya bo'yicha filtr">
          <option value="">Barcha kompaniyalar</option>
          {(companies.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filters.categoryId} onChange={(e) => setFilter('categoryId', e.target.value)} aria-label="Kategoriya bo'yicha filtr">
          <option value="">Barcha kategoriyalar</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Holat bo'yicha filtr">
          <option value="">Barcha holatlar</option>
          <option value="ACTIVE">Faol</option>
          <option value="ARCHIVED">Arxivlangan</option>
        </Select>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <label className="text-[var(--text-2)]">Saralash:</label>
        <Select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Saralash maydoni" className="max-w-[180px]">
          <option value="">Nom bo'yicha</option>
          <option value="code">Kod</option>
          <option value="price">Narx</option>
          <option value="updatedAt">Yangilangan</option>
        </Select>
        <Select value={filters.order} onChange={(e) => setFilter('order', e.target.value)} aria-label="Saralash tartibi" className="max-w-[140px]">
          <option value="">O'sish</option>
          <option value="desc">Kamayish</option>
        </Select>
      </div>

      <div className="relative mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {query.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : query.isError ? (
          <div className="p-4">
            <Alert tone="error">{getApiError(query.error).message}</Alert>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center text-[var(--text-2)]">
            <Package className="size-8 text-[var(--text-3)]" />
            <div>
              <p className="font-medium text-[var(--text-1)]">Mahsulot topilmadi</p>
              <p className="mt-1 text-sm">Qidiruv yoki filtrlarni o'zgartirib ko'ring.</p>
            </div>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                  <th className="px-4 py-3">Mahsulot</th>
                  <th className="px-4 py-3">Kompaniya</th>
                  <th className="px-4 py-3">Kategoriya</th>
                  <th className="px-4 py-3 text-right">Narx</th>
                  <th className="px-4 py-3">Holat</th>
                  {canManage && <th className="px-4 py-3 text-right">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-1)]">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--surface-2)]/50">
                    <td className="px-4 py-3">
                      <Link to={`/app/catalog/products/${p.id}`} className="font-semibold text-[var(--text-1)] hover:text-blue-700 hover:underline">
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-[var(--text-2)]">{p.code}{p.brandName ? ` · ${p.brandName}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)]">{p.companyName}</td>
                    <td className="px-4 py-3 text-[var(--text-2)]">{p.categoryName}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatUZS(p.priceMinor)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <RowActions p={p} onEdit={() => { setEditTarget(p); setFormOpen(true); }} onStatus={() => statusMutation.mutate(p)} onHistory={() => setHistoryTarget(p)} onDelete={() => setDeleteTarget(p)} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-[var(--border-1)] sm:hidden">
              {rows.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link to={`/app/catalog/products/${p.id}`} className="font-semibold text-[var(--text-1)]">
                      {p.name}
                    </Link>
                    <p className="mt-0.5 text-sm text-[var(--text-2)]">{p.code} · {p.companyName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold tabular-nums text-[var(--text-1)]">{formatUZS(p.priceMinor)}</span>
                      <StatusPill status={p.status} />
                    </div>
                  </div>
                  {canManage && (
                    <RowActions p={p} onEdit={() => { setEditTarget(p); setFormOpen(true); }} onStatus={() => statusMutation.mutate(p)} onHistory={() => setHistoryTarget(p)} onDelete={() => setDeleteTarget(p)} />
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {total > 0 && (
        <div className="mt-4">
          <Pagination page={page} pageSize={pageSize} total={total} noun="mahsulot" onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      )}

      {formOpen && <ProductFormModal key={editTarget?.id ?? 'new'} editProduct={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null); }} />}
      {historyTarget && <PriceHistoryModal kind="product" id={historyTarget.id} title={`${historyTarget.name} (${historyTarget.code})`} onClose={() => setHistoryTarget(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Mahsulotni o'chirish"
        confirmLabel="O'chirish"
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      >
        <b>{deleteTarget?.name}</b> butunlay o'chiriladi. Bu amalni bekor qilib bo'lmaydi. Agar keyinchalik kerak bo'lishi mumkin bo'lsa, uni <b>arxivlang</b>.
      </ConfirmDialog>
    </div>
  );
}

function StatusPill({ status }: { status: 'ACTIVE' | 'ARCHIVED' }) {
  return status === 'ACTIVE' ? (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Faol</span>
  ) : (
    <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">Arxivlangan</span>
  );
}

function RowActions({
  p,
  onEdit,
  onStatus,
  onHistory,
  onDelete,
}: {
  p: Product;
  onEdit: () => void;
  onStatus: () => void;
  onHistory: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  return (
    <DropdownMenu
      align="end"
      button={
        <button type="button" aria-label={`${p.name} — amallar`} className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
          <MoreHorizontal className="size-5" />
        </button>
      }
    >
      {(close) => (
        <>
          <MenuItem icon={<UserRound className="size-[18px]" />} onClick={() => { close(); navigate(`/app/catalog/products/${p.id}`); }}>
            Batafsil
          </MenuItem>
          <MenuItem icon={<Pencil className="size-[18px]" />} onClick={() => { close(); onEdit(); }}>
            Tahrirlash
          </MenuItem>
          <MenuItem icon={<History className="size-[18px]" />} onClick={() => { close(); onHistory(); }}>
            Narx tarixi
          </MenuItem>
          <MenuItem icon={p.status === 'ACTIVE' ? <Archive className="size-[18px]" /> : <ArchiveRestore className="size-[18px]" />} onClick={() => { close(); onStatus(); }}>
            {p.status === 'ACTIVE' ? 'Arxivlash' : 'Faollashtirish'}
          </MenuItem>
          <MenuItem icon={<Trash2 className="size-[18px]" />} danger onClick={() => { close(); onDelete(); }}>
            O'chirish
          </MenuItem>
        </>
      )}
    </DropdownMenu>
  );
}
