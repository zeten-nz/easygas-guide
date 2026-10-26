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
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import * as catalogApi from '../../api/catalog.api';
import { RefCombobox } from '../../components/catalog/RefCombobox';
import type { Product } from '../../types/catalog';
import { ProductFormModal } from './ProductFormModal';
import { PriceHistoryModal } from './PriceHistoryModal';

export function ProductsPanel() {
  const t = useT();
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
    const timer = setTimeout(() => setFilter('search', searchInput.trim(), true), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Product | null>(null);

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
      toast.success(p.status === 'ACTIVE' ? t('cat.product.toast.archived') : t('cat.product.toast.activated'));
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  const deleteMutation = useMutation({
    mutationFn: (p: Product) => catalogApi.deleteProduct(p.id),
    onSuccess: () => {
      toast.success(t('cat.product.toast.deleted'));
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-[var(--text-2)]">{t('cat.products.desc')}</p>
        {canManage && (
          <Button
            onClick={() => {
              setEditTarget(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> {t('cat.product.new')}
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={t('cat.search.placeholder')}
          leftIcon={<Search className="size-[18px]" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label={t('cat.search.aria')}
        />
        <RefCombobox
          kind="companies"
          ariaLabel={t('cat.filter.company.aria')}
          placeholder={t('cat.filter.company.all')}
          allowClear
          value={filters.companyId ? Number(filters.companyId) : null}
          onChange={(v) => setFilter('companyId', v ? String(v) : '')}
        />
        <RefCombobox
          kind="product-categories"
          ariaLabel={t('cat.filter.category.aria')}
          placeholder={t('cat.filter.category.all')}
          allowClear
          value={filters.categoryId ? Number(filters.categoryId) : null}
          onChange={(v) => setFilter('categoryId', v ? String(v) : '')}
        />
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label={t('cat.filter.status.aria')}>
          <option value="">{t('cat.filter.status.all')}</option>
          <option value="ACTIVE">{t('cat.status.active')}</option>
          <option value="ARCHIVED">{t('cat.status.archived')}</option>
        </Select>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm">
        <label className="text-[var(--text-2)]">{t('cat.sort.label')}</label>
        <Select value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label={t('cat.sort.field.aria')} className="max-w-[180px]">
          <option value="">{t('cat.sort.byName')}</option>
          <option value="code">{t('cat.field.code')}</option>
          <option value="price">{t('cat.field.price')}</option>
          <option value="updatedAt">{t('cat.sort.updated')}</option>
        </Select>
        <Select value={filters.order} onChange={(e) => setFilter('order', e.target.value)} aria-label={t('cat.sort.order.aria')} className="max-w-[140px]">
          <option value="">{t('cat.sort.asc')}</option>
          <option value="desc">{t('cat.sort.desc')}</option>
        </Select>
      </div>

      <div className="relative mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {query.isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : query.isError ? (
          <div className="p-4">
            <Alert tone="error">{localizeApiError(getApiError(query.error).code, t)}</Alert>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-20 text-center text-[var(--text-2)]">
            <Package className="size-8 text-[var(--text-3)]" />
            <div>
              <p className="font-medium text-[var(--text-1)]">{t('cat.products.empty.title')}</p>
              <p className="mt-1 text-sm">{t('cat.empty.hint')}</p>
            </div>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-sm sm:table">
              <thead>
                <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                  <th className="px-4 py-3">{t('cat.th.product')}</th>
                  <th className="px-4 py-3">{t('cat.field.company')}</th>
                  <th className="px-4 py-3">{t('cat.field.category')}</th>
                  <th className="px-4 py-3 text-right">{t('cat.field.price')}</th>
                  <th className="px-4 py-3">{t('cat.field.status')}</th>
                  {canManage && <th className="px-4 py-3 text-right">{t('cat.th.actions')}</th>}
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
        title={t('cat.product.delete.title')}
        confirmLabel={t('cat.action.delete')}
        danger
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      >
        <b>{deleteTarget?.name}</b> {t('cat.product.delete.body')}
      </ConfirmDialog>
    </div>
  );
}

function StatusPill({ status }: { status: 'ACTIVE' | 'ARCHIVED' }) {
  const t = useT();
  return status === 'ACTIVE' ? (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{t('cat.status.active')}</span>
  ) : (
    <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">{t('cat.status.archived')}</span>
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
  const t = useT();
  const navigate = useNavigate();
  return (
    <DropdownMenu
      align="end"
      button={
        <button type="button" aria-label={t('cat.rowActions.aria', { name: p.name })} className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50">
          <MoreHorizontal className="size-5" />
        </button>
      }
    >
      {(close) => (
        <>
          <MenuItem icon={<UserRound className="size-[18px]" />} onClick={() => { close(); navigate(`/app/catalog/products/${p.id}`); }}>
            {t('cat.action.details')}
          </MenuItem>
          <MenuItem icon={<Pencil className="size-[18px]" />} onClick={() => { close(); onEdit(); }}>
            {t('cat.action.edit')}
          </MenuItem>
          <MenuItem icon={<History className="size-[18px]" />} onClick={() => { close(); onHistory(); }}>
            {t('cat.field.priceHistory')}
          </MenuItem>
          <MenuItem icon={p.status === 'ACTIVE' ? <Archive className="size-[18px]" /> : <ArchiveRestore className="size-[18px]" />} onClick={() => { close(); onStatus(); }}>
            {p.status === 'ACTIVE' ? t('cat.action.archive') : t('cat.action.activate')}
          </MenuItem>
          <MenuItem icon={<Trash2 className="size-[18px]" />} danger onClick={() => { close(); onDelete(); }}>
            {t('cat.action.delete')}
          </MenuItem>
        </>
      )}
    </DropdownMenu>
  );
}
