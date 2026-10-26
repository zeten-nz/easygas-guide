import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { cn } from '../../lib/utils';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { getApiError } from '../../api/client';
import * as ref from '../../api/reference.api';
import { useT, type TFunc } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/types';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
import type { ForcedInduction, InjectionReference, InjectionTechnology, ReferenceItem, ReferenceKind } from '../../types/catalog';

const TABS: { key: ReferenceKind | 'injection'; labelKey: MessageKey; hasCode?: boolean }[] = [
  { key: 'companies', labelKey: 'm.ref.tab.companies' },
  { key: 'brands', labelKey: 'm.ref.tab.brands' },
  { key: 'product-categories', labelKey: 'm.ref.tab.productCat' },
  { key: 'service-categories', labelKey: 'm.ref.tab.serviceCat' },
  { key: 'units', labelKey: 'm.ref.tab.units', hasCode: true },
  { key: 'injection', labelKey: 'm.ref.tab.injection' },
];

export function ReferenceDataPage() {
  const t = useT();
  const [active, setActive] = useState<(typeof TABS)[number]['key']>('companies');
  const activeTab = TABS.find((tab) => tab.key === active)!;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('m.ref.title')}</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">{t('m.ref.subtitle')}</p>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border-1)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
              active === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-[var(--text-2)] hover:text-[var(--text-1)]',
            )}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {active === 'injection' ? <InjectionPanel /> : <ReferencePanel kind={active as ReferenceKind} hasCode={!!activeTab.hasCode} />}
      </div>
    </div>
  );
}

// ------------------------------ Simple reference kinds ------------------------------

function ReferencePanel({ kind, hasCode }: { kind: ReferenceKind; hasCode: boolean }) {
  const t = useT();
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const canManage = can(actor, 'catalog.manage');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ReferenceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReferenceItem | null>(null);

  const params: ref.ListReferenceParams = { page, limit: pageSize, ...(search ? { search } : {}), ...(status ? { status: status as 'ACTIVE' | 'ARCHIVED' } : {}) };
  const query = useQuery({ queryKey: ['reference', kind, params], queryFn: () => ref.listReference(kind, params), placeholderData: keepPreviousData });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['reference', kind] });
  const statusMutation = useMutation({
    mutationFn: (r: ReferenceItem) => (r.status === 'ACTIVE' ? ref.archiveReference(kind, r.id) : ref.reactivateReference(kind, r.id)),
    onSuccess: () => { toast.success(t('m.toast.statusUpdated')); invalidate(); },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });
  const deleteMutation = useMutation({
    mutationFn: (r: ReferenceItem) => ref.deleteReference(kind, r.id),
    onSuccess: () => { toast.success(t('m.toast.deleted')); invalidate(); setDeleteTarget(null); },
    onError: (err) => { toast.error(localizeApiError(getApiError(err).code, t)); setDeleteTarget(null); },
  });

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <Input placeholder={t('m.search.placeholder')} leftIcon={<Search className="size-[18px]" />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label={t('m.search.aria')} className="max-w-xs" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label={t('m.field.status')} className="max-w-[180px]">
            <option value="">{t('m.filter.all')}</option>
            <option value="ACTIVE">{t('m.status.active')}</option>
            <option value="ARCHIVED">{t('m.status.archived')}</option>
          </Select>
        </div>
        {canManage && <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="size-4" /> {t('m.action.new')}</Button>}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {query.isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-blue-600" /></div>
        ) : query.isError ? (
          <div className="p-4"><Alert tone="error">{localizeApiError(getApiError(query.error).code, t)}</Alert></div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--text-2)]">{t('m.ref.noRecords')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                {hasCode && <th className="px-4 py-3">{t('m.ref.col.code')}</th>}
                <th className="px-4 py-3">{t('m.ref.col.name')}</th>
                <th className="px-4 py-3">{t('m.ref.col.usage')}</th>
                <th className="px-4 py-3">{t('m.field.status')}</th>
                {canManage && <th className="px-4 py-3 text-right">{t('m.col.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]/50">
                  {hasCode && <td className="px-4 py-3 font-mono text-[var(--text-2)]">{r.code}</td>}
                  <td className="px-4 py-3 font-medium text-[var(--text-1)]">{r.name}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{r.inUseCount > 0 ? t('m.ref.inUseCount', { count: r.inUseCount }) : t('m.ref.notUsed')}</td>
                  <td className="px-4 py-3">{r.status === 'ACTIVE' ? <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{t('m.status.active')}</span> : <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">{t('m.status.archived')}</span>}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        align="end"
                        button={<button type="button" aria-label={t('m.actionsFor', { name: r.name })} className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"><MoreHorizontal className="size-5" /></button>}
                      >
                        {(close) => (
                          <>
                            <MenuItem icon={<Pencil className="size-[18px]" />} onClick={() => { close(); setEditTarget(r); setFormOpen(true); }}>{t('m.action.edit')}</MenuItem>
                            <MenuItem icon={r.status === 'ACTIVE' ? <Archive className="size-[18px]" /> : <ArchiveRestore className="size-[18px]" />} onClick={() => { close(); statusMutation.mutate(r); }}>{r.status === 'ACTIVE' ? t('m.action.archive') : t('m.action.reactivate')}</MenuItem>
                            <MenuItem icon={<Trash2 className="size-[18px]" />} danger disabled={!r.deletable} onClick={() => { close(); setDeleteTarget(r); }}>{r.deletable ? t('m.action.delete') : t('m.ref.deleteInUse')}</MenuItem>
                          </>
                        )}
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && <div className="mt-4"><Pagination page={page} pageSize={pageSize} total={total} noun="yozuv" onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} /></div>}

      {formOpen && <ReferenceFormModal kind={kind} hasCode={hasCode} editItem={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null); }} />}
      <ConfirmDialog open={!!deleteTarget} title={t('m.ref.deleteTitle')} confirmLabel={t('m.action.delete')} danger loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} onCancel={() => setDeleteTarget(null)}>
        <b>{deleteTarget?.name}</b>{t('m.ref.deleteBody')}
      </ConfirmDialog>
    </div>
  );
}

function ReferenceFormModal({ kind, hasCode, editItem, onClose }: { kind: ReferenceKind; hasCode: boolean; editItem: ReferenceItem | null; onClose: () => void }) {
  const t = useT();
  const queryClient = useQueryClient();
  const isEdit = !!editItem;
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string; code: string }>({
    defaultValues: { name: editItem?.name ?? '', code: editItem?.code ?? '' },
  });
  const mutation = useMutation({
    mutationFn: (v: { name: string; code: string }) => {
      const body = { name: v.name.trim(), ...(hasCode ? { code: v.code.trim() } : {}) };
      return isEdit && editItem ? ref.updateReference(kind, editItem.id, body) : ref.createReference(kind, body);
    },
    onSuccess: () => { toast.success(isEdit ? t('m.toast.updated') : t('m.toast.created')); queryClient.invalidateQueries({ queryKey: ['reference', kind] }); onClose(); },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });
  return (
    <Modal open onClose={onClose} title={isEdit ? t('m.action.edit') : t('m.ref.newRecord')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        {hasCode && <Input label={t('m.ref.col.code')} error={fieldError(errors.code?.message, t)} {...register('code', { required: 'm.valid.codeRequired' })} />}
        <Input label={t('m.ref.col.name')} error={fieldError(errors.name?.message, t)} {...register('name', { required: 'm.valid.refNameRequired' })} />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? t('common.save') : t('m.action.create')}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ------------------------------ Injection reference ------------------------------

function techLabel(v: InjectionTechnology, t: TFunc): string {
  switch (v) {
    case 'PORT_MULTIPOINT':
      return t('m.inj.tech.port');
    case 'DIRECT':
      return t('m.inj.tech.direct');
    default:
      return t('m.inj.unknown');
  }
}

function forcedLabel(v: ForcedInduction, t: TFunc): string {
  switch (v) {
    case 'NONE':
      return t('m.inj.forced.none');
    case 'TURBO':
      return t('m.inj.forced.turbo');
    case 'SUPERCHARGED':
      return t('m.inj.forced.supercharged');
    default:
      return t('m.inj.unknown');
  }
}

function InjectionPanel() {
  const t = useT();
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const canManage = can(actor, 'catalog.manage');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InjectionReference | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InjectionReference | null>(null);

  const params = { page, limit: pageSize, ...(search ? { search } : {}) };
  const query = useQuery({ queryKey: ['injection', params], queryFn: () => ref.listInjection(params), placeholderData: keepPreviousData });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['injection'] });
  const statusMutation = useMutation({
    mutationFn: (r: InjectionReference) => (r.status === 'ACTIVE' ? ref.archiveInjection(r.id) : ref.reactivateInjection(r.id)),
    onSuccess: () => { toast.success(t('m.toast.statusUpdated')); invalidate(); },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });
  const deleteMutation = useMutation({
    mutationFn: (r: InjectionReference) => ref.deleteInjection(r.id),
    onSuccess: () => { toast.success(t('m.toast.deleted')); invalidate(); setDeleteTarget(null); },
    onError: (err) => { toast.error(localizeApiError(getApiError(err).code, t)); setDeleteTarget(null); },
  });

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder={t('m.search.placeholder')} leftIcon={<Search className="size-[18px]" />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label={t('m.search.aria')} className="max-w-xs" />
        {canManage && <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="size-4" /> {t('m.action.new')}</Button>}
      </div>
      <p className="mt-2 text-xs text-[var(--text-3)]">{t('m.inj.info')}</p>

      <div className="mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {query.isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-blue-600" /></div>
        ) : query.isError ? (
          <div className="p-4"><Alert tone="error">{localizeApiError(getApiError(query.error).code, t)}</Alert></div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--text-2)]">{t('m.ref.noRecords')}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                <th className="px-4 py-3">{t('m.inj.col.designation')}</th>
                <th className="px-4 py-3">{t('m.inj.col.technology')}</th>
                <th className="px-4 py-3">{t('m.inj.col.forced')}</th>
                <th className="px-4 py-3">{t('m.field.status')}</th>
                {canManage && <th className="px-4 py-3 text-right">{t('m.col.actions')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]/50">
                  <td className="px-4 py-3 font-medium text-[var(--text-1)]">{r.designation}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{techLabel(r.technology, t)}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{forcedLabel(r.forcedInduction, t)}</td>
                  <td className="px-4 py-3">{r.status === 'ACTIVE' ? <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">{t('m.status.active')}</span> : <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">{t('m.status.archived')}</span>}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu align="end" button={<button type="button" aria-label={t('m.actionsFor', { name: r.designation })} className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"><MoreHorizontal className="size-5" /></button>}>
                        {(close) => (
                          <>
                            <MenuItem icon={<Pencil className="size-[18px]" />} onClick={() => { close(); setEditTarget(r); setFormOpen(true); }}>{t('m.action.edit')}</MenuItem>
                            <MenuItem icon={r.status === 'ACTIVE' ? <Archive className="size-[18px]" /> : <ArchiveRestore className="size-[18px]" />} onClick={() => { close(); statusMutation.mutate(r); }}>{r.status === 'ACTIVE' ? t('m.action.archive') : t('m.action.reactivate')}</MenuItem>
                            <MenuItem icon={<Trash2 className="size-[18px]" />} danger onClick={() => { close(); setDeleteTarget(r); }}>{t('m.action.delete')}</MenuItem>
                          </>
                        )}
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {total > 0 && <div className="mt-4"><Pagination page={page} pageSize={pageSize} total={total} noun="yozuv" onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} /></div>}

      {formOpen && <InjectionFormModal editItem={editTarget} onClose={() => { setFormOpen(false); setEditTarget(null); }} />}
      <ConfirmDialog open={!!deleteTarget} title={t('m.ref.deleteTitle')} confirmLabel={t('m.action.delete')} danger loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} onCancel={() => setDeleteTarget(null)}>
        <b>{deleteTarget?.designation}</b>{t('m.inj.deleteBody')}
      </ConfirmDialog>
    </div>
  );
}

function InjectionFormModal({ editItem, onClose }: { editItem: InjectionReference | null; onClose: () => void }) {
  const t = useT();
  const queryClient = useQueryClient();
  const isEdit = !!editItem;
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<{ designation: string; technology: InjectionTechnology; forcedInduction: ForcedInduction; description: string }>({
    defaultValues: {
      designation: editItem?.designation ?? '',
      technology: editItem?.technology ?? 'UNKNOWN',
      forcedInduction: editItem?.forcedInduction ?? 'UNKNOWN',
      description: editItem?.description ?? '',
    },
  });
  const mutation = useMutation({
    mutationFn: (v: { designation: string; technology: InjectionTechnology; forcedInduction: ForcedInduction; description: string }) => {
      const body = { designation: v.designation.trim(), technology: v.technology, forcedInduction: v.forcedInduction, description: v.description.trim() || null };
      return isEdit && editItem ? ref.updateInjection(editItem.id, body) : ref.createInjection(body);
    },
    onSuccess: () => { toast.success(isEdit ? t('m.toast.updated') : t('m.toast.created')); queryClient.invalidateQueries({ queryKey: ['injection'] }); onClose(); },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });
  return (
    <Modal open onClose={onClose} title={isEdit ? t('m.inj.editTitle') : t('m.inj.newTitle')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input label={t('m.inj.designationLabel')} error={fieldError(errors.designation?.message, t)} {...register('designation', { required: 'm.valid.designationRequired' })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label={t('m.inj.techLabel')} {...register('technology')}>
            <option value="UNKNOWN">{t('m.inj.unknown')}</option>
            <option value="PORT_MULTIPOINT">{t('m.inj.tech.port')}</option>
            <option value="DIRECT">{t('m.inj.tech.direct')}</option>
          </Select>
          <Select label={t('m.inj.forcedLabel')} {...register('forcedInduction')}>
            <option value="UNKNOWN">{t('m.inj.unknown')}</option>
            <option value="NONE">{t('m.inj.forced.none')}</option>
            <option value="TURBO">{t('m.inj.forced.turbo')}</option>
            <option value="SUPERCHARGED">{t('m.inj.forced.supercharged')}</option>
          </Select>
        </div>
        <Input label={t('m.field.commentOptional')} {...register('description')} />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? t('common.save') : t('m.action.create')}</Button>
        </div>
      </form>
    </Modal>
  );
}
