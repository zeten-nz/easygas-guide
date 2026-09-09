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
import type { ForcedInduction, InjectionReference, InjectionTechnology, ReferenceItem, ReferenceKind } from '../../types/catalog';

const TABS: { key: ReferenceKind | 'injection'; label: string; hasCode?: boolean }[] = [
  { key: 'companies', label: 'Kompaniyalar' },
  { key: 'brands', label: 'Brendlar' },
  { key: 'product-categories', label: 'Mahsulot kat.' },
  { key: 'service-categories', label: 'Xizmat kat.' },
  { key: 'units', label: "O'lchov birliklari", hasCode: true },
  { key: 'injection', label: 'Injektor turlari' },
];

export function ReferenceDataPage() {
  const [active, setActive] = useState<(typeof TABS)[number]['key']>('companies');
  const activeTab = TABS.find((t) => t.key === active)!;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-1)]">Ma'lumotnomalar</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">Katalog uchun umumiy ma'lumotlar. Ishlatilayotgan yozuvlar o'chirilmaydi — arxivlanadi.</p>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border-1)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              '-mb-px border-b-2 px-3.5 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
              active === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-[var(--text-2)] hover:text-[var(--text-1)]',
            )}
          >
            {t.label}
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
    onSuccess: () => { toast.success('Holat yangilandi'); invalidate(); },
    onError: (err) => toast.error(getApiError(err).message),
  });
  const deleteMutation = useMutation({
    mutationFn: (r: ReferenceItem) => ref.deleteReference(kind, r.id),
    onSuccess: () => { toast.success("O'chirildi"); invalidate(); setDeleteTarget(null); },
    onError: (err) => { toast.error(getApiError(err).message); setDeleteTarget(null); },
  });

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          <Input placeholder="Qidiruv…" leftIcon={<Search className="size-[18px]" />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Qidiruv" className="max-w-xs" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Holat" className="max-w-[180px]">
            <option value="">Barchasi</option>
            <option value="ACTIVE">Faol</option>
            <option value="ARCHIVED">Arxivlangan</option>
          </Select>
        </div>
        {canManage && <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="size-4" /> Yangi</Button>}
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {query.isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-blue-600" /></div>
        ) : query.isError ? (
          <div className="p-4"><Alert tone="error">{getApiError(query.error).message}</Alert></div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--text-2)]">Yozuv topilmadi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                {hasCode && <th className="px-4 py-3">Kod</th>}
                <th className="px-4 py-3">Nomi</th>
                <th className="px-4 py-3">Ishlatilishi</th>
                <th className="px-4 py-3">Holat</th>
                {canManage && <th className="px-4 py-3 text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]/50">
                  {hasCode && <td className="px-4 py-3 font-mono text-[var(--text-2)]">{r.code}</td>}
                  <td className="px-4 py-3 font-medium text-[var(--text-1)]">{r.name}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{r.inUseCount > 0 ? `${r.inUseCount} ta yozuvda` : "Ishlatilmagan"}</td>
                  <td className="px-4 py-3">{r.status === 'ACTIVE' ? <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Faol</span> : <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">Arxivlangan</span>}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu
                        align="end"
                        button={<button type="button" aria-label={`${r.name} — amallar`} className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"><MoreHorizontal className="size-5" /></button>}
                      >
                        {(close) => (
                          <>
                            <MenuItem icon={<Pencil className="size-[18px]" />} onClick={() => { close(); setEditTarget(r); setFormOpen(true); }}>Tahrirlash</MenuItem>
                            <MenuItem icon={r.status === 'ACTIVE' ? <Archive className="size-[18px]" /> : <ArchiveRestore className="size-[18px]" />} onClick={() => { close(); statusMutation.mutate(r); }}>{r.status === 'ACTIVE' ? 'Arxivlash' : 'Faollashtirish'}</MenuItem>
                            <MenuItem icon={<Trash2 className="size-[18px]" />} danger disabled={!r.deletable} onClick={() => { close(); setDeleteTarget(r); }}>O'chirish{!r.deletable ? ' (ishlatilmoqda)' : ''}</MenuItem>
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
      <ConfirmDialog open={!!deleteTarget} title="Yozuvni o'chirish" confirmLabel="O'chirish" danger loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} onCancel={() => setDeleteTarget(null)}>
        <b>{deleteTarget?.name}</b> butunlay o'chiriladi. Ishlatilayotgan yozuvlarni o'chirib bo'lmaydi — ularni arxivlang.
      </ConfirmDialog>
    </div>
  );
}

function ReferenceFormModal({ kind, hasCode, editItem, onClose }: { kind: ReferenceKind; hasCode: boolean; editItem: ReferenceItem | null; onClose: () => void }) {
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
    onSuccess: () => { toast.success(isEdit ? 'Yangilandi' : 'Yaratildi'); queryClient.invalidateQueries({ queryKey: ['reference', kind] }); onClose(); },
    onError: (err) => setServerError(getApiError(err).message),
  });
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Tahrirlash' : 'Yangi yozuv'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        {hasCode && <Input label="Kod" error={errors.code?.message} {...register('code', { required: 'Kod kiritilishi shart' })} />}
        <Input label="Nomi" error={errors.name?.message} {...register('name', { required: 'Nomi kiritilishi shart' })} />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Saqlash' : 'Yaratish'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ------------------------------ Injection reference ------------------------------

const TECH_LABEL: Record<InjectionTechnology, string> = { PORT_MULTIPOINT: 'Portli (multipoint)', DIRECT: "To'g'ridan-to'g'ri (direct)", UNKNOWN: "Noma'lum" };
const FORCED_LABEL: Record<ForcedInduction, string> = { NONE: "Yo'q", TURBO: 'Turbo', SUPERCHARGED: 'Kompressor', UNKNOWN: "Noma'lum" };

function InjectionPanel() {
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
    onSuccess: () => { toast.success('Holat yangilandi'); invalidate(); },
    onError: (err) => toast.error(getApiError(err).message),
  });
  const deleteMutation = useMutation({
    mutationFn: (r: InjectionReference) => ref.deleteInjection(r.id),
    onSuccess: () => { toast.success("O'chirildi"); invalidate(); setDeleteTarget(null); },
    onError: (err) => { toast.error(getApiError(err).message); setDeleteTarget(null); },
  });

  const rows = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input placeholder="Qidiruv…" leftIcon={<Search className="size-[18px]" />} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Qidiruv" className="max-w-xs" />
        {canManage && <Button onClick={() => { setEditTarget(null); setFormOpen(true); }}><Plus className="size-4" /> Yangi</Button>}
      </div>
      <p className="mt-2 text-xs text-[var(--text-3)]">Injektor texnologiyasi (portli/to'g'ridan) turbo/kompressor bilan bog'liq emas — ular alohida maydonlar. Noma'lum qiymat qo'llab-quvvatlanadi.</p>

      <div className="mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)]">
        {query.isLoading ? (
          <div className="flex justify-center py-16"><Spinner className="size-6 text-blue-600" /></div>
        ) : query.isError ? (
          <div className="p-4"><Alert tone="error">{getApiError(query.error).message}</Alert></div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-[var(--text-2)]">Yozuv topilmadi.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-1)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                <th className="px-4 py-3">Belgilanish</th>
                <th className="px-4 py-3">Texnologiya</th>
                <th className="px-4 py-3">Havo berish</th>
                <th className="px-4 py-3">Holat</th>
                {canManage && <th className="px-4 py-3 text-right">Amallar</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-1)]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]/50">
                  <td className="px-4 py-3 font-medium text-[var(--text-1)]">{r.designation}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{TECH_LABEL[r.technology]}</td>
                  <td className="px-4 py-3 text-[var(--text-2)]">{FORCED_LABEL[r.forcedInduction]}</td>
                  <td className="px-4 py-3">{r.status === 'ACTIVE' ? <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Faol</span> : <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">Arxivlangan</span>}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu align="end" button={<button type="button" aria-label={`${r.designation} — amallar`} className="inline-flex size-9 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"><MoreHorizontal className="size-5" /></button>}>
                        {(close) => (
                          <>
                            <MenuItem icon={<Pencil className="size-[18px]" />} onClick={() => { close(); setEditTarget(r); setFormOpen(true); }}>Tahrirlash</MenuItem>
                            <MenuItem icon={r.status === 'ACTIVE' ? <Archive className="size-[18px]" /> : <ArchiveRestore className="size-[18px]" />} onClick={() => { close(); statusMutation.mutate(r); }}>{r.status === 'ACTIVE' ? 'Arxivlash' : 'Faollashtirish'}</MenuItem>
                            <MenuItem icon={<Trash2 className="size-[18px]" />} danger onClick={() => { close(); setDeleteTarget(r); }}>O'chirish</MenuItem>
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
      <ConfirmDialog open={!!deleteTarget} title="Yozuvni o'chirish" confirmLabel="O'chirish" danger loading={deleteMutation.isPending} onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)} onCancel={() => setDeleteTarget(null)}>
        <b>{deleteTarget?.designation}</b> o'chiriladi.
      </ConfirmDialog>
    </div>
  );
}

function InjectionFormModal({ editItem, onClose }: { editItem: InjectionReference | null; onClose: () => void }) {
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
    onSuccess: () => { toast.success(isEdit ? 'Yangilandi' : 'Yaratildi'); queryClient.invalidateQueries({ queryKey: ['injection'] }); onClose(); },
    onError: (err) => setServerError(getApiError(err).message),
  });
  return (
    <Modal open onClose={onClose} title={isEdit ? 'Injektor turini tahrirlash' : 'Yangi injektor turi'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input label="Belgilanish (masalan MPI, GDI, FSI)" error={errors.designation?.message} {...register('designation', { required: 'Belgilanish kiritilishi shart' })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Injektor texnologiyasi" {...register('technology')}>
            <option value="UNKNOWN">Noma'lum</option>
            <option value="PORT_MULTIPOINT">Portli (multipoint)</option>
            <option value="DIRECT">To'g'ridan-to'g'ri (direct)</option>
          </Select>
          <Select label="Havo berish (alohida atribut)" {...register('forcedInduction')}>
            <option value="UNKNOWN">Noma'lum</option>
            <option value="NONE">Yo'q</option>
            <option value="TURBO">Turbo</option>
            <option value="SUPERCHARGED">Kompressor</option>
          </Select>
        </div>
        <Input label="Izoh (ixtiyoriy)" {...register('description')} />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Saqlash' : 'Yaratish'}</Button>
        </div>
      </form>
    </Modal>
  );
}
