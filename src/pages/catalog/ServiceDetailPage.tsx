import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { formatUZS } from '../../lib/money';
import { getApiError } from '../../api/client';
import * as catalogApi from '../../api/catalog.api';
import { ServiceFormModal } from './ServiceFormModal';

const BASIS_LABEL: Record<string, string> = { NET: 'Soliqsiz (NET)', GROSS: 'Soliq bilan (GROSS)', UNKNOWN: "Noma'lum" };

export function ServiceDetailPage() {
  const { id } = useParams();
  const serviceId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: actor } = useAuth();
  const canManage = can(actor, 'catalog.manage');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const query = useQuery({ queryKey: ['catalog', 'services', 'detail', serviceId], queryFn: () => catalogApi.getService(serviceId) });
  const history = useQuery({
    queryKey: ['catalog', 'service', 'price-history', serviceId],
    queryFn: () => catalogApi.getServicePriceHistory(serviceId),
    enabled: !!query.data,
  });

  const statusMutation = useMutation({
    mutationFn: () => (query.data!.status === 'ACTIVE' ? catalogApi.archiveService(serviceId) : catalogApi.reactivateService(serviceId)),
    onSuccess: () => {
      toast.success('Holat yangilandi');
      queryClient.invalidateQueries({ queryKey: ['catalog', 'services'] });
    },
    onError: (err) => toast.error(getApiError(err).message),
  });
  const deleteMutation = useMutation({
    mutationFn: () => catalogApi.deleteService(serviceId),
    onSuccess: () => {
      toast.success("Xizmat o'chirildi");
      queryClient.invalidateQueries({ queryKey: ['catalog', 'services'] });
      queryClient.removeQueries({ queryKey: ['catalog', 'services', 'detail', serviceId] });
      navigate('/app/catalog/services');
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setDeleteOpen(false);
    },
  });

  if (query.isLoading) return <div className="flex justify-center py-20"><Spinner className="size-7 text-blue-600" /></div>;
  if (query.isError) return <Alert tone="error">{getApiError(query.error).message}</Alert>;
  const s = query.data!;

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/app/catalog/services" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-2)] hover:text-[var(--text-1)]">
        <ArrowLeft className="size-4" /> Narx bazasiga qaytish
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-1)]">{s.name}</h2>
          <p className="mt-0.5 text-sm text-[var(--text-2)]">
            {s.code}
            {s.status === 'ARCHIVED' && <span className="ml-2 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold">Arxivlangan</span>}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}><Pencil className="size-4" /> Tahrirlash</Button>
            <Button variant="secondary" onClick={() => statusMutation.mutate()} loading={statusMutation.isPending}>
              {s.status === 'ACTIVE' ? <><Archive className="size-4" /> Arxivlash</> : <><ArchiveRestore className="size-4" /> Faollashtirish</>}
            </Button>
            <Button variant="danger-outline" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" /> O'chirish</Button>
          </div>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:grid-cols-2">
        <Field label="Narx" value={<span className="font-semibold tabular-nums">{formatUZS(s.priceMinor)}</span>} />
        <Field label="Narx asosi" value={BASIS_LABEL[s.priceBasis]} />
        <Field label="Kategoriya" value={s.categoryName} />
        <Field label="Davomiyligi" value={s.durationMinutes !== null ? `${s.durationMinutes} daqiqa` : '—'} />
        <Field label="Soliq stavkasi" value={s.taxRateBp !== null ? `${s.taxRateBp / 100}%` : '—'} />
        <Field label="Soliq bilan narx" value={s.priceInclusiveMinor !== null ? formatUZS(s.priceInclusiveMinor) : '—'} />
        <Field label="Manba" value={s.source === 'IMPORT' ? 'Import (tasdiqlanishi kerak)' : 'Qo\'lda'} />
      </dl>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-[var(--text-1)]">Narx tarixi</h3>
        {history.isLoading ? (
          <div className="py-6"><Spinner className="size-5 text-blue-600" /></div>
        ) : history.data && history.data.length > 0 ? (
          <ol className="mt-2 space-y-2">
            {history.data.map((h) => (
              <li key={h.id} className="rounded-xl border border-[var(--border-1)] bg-[var(--surface)] p-3 text-sm">
                <span className="font-semibold">{formatUZS(h.oldPriceMinor)} → {formatUZS(h.newPriceMinor)}</span>
                <span className="ml-2 text-[var(--text-2)]">{new Date(h.createdAt).toLocaleString('uz-UZ')}{h.changedByName ? ` · ${h.changedByName}` : ''}{h.source === 'IMPORT' ? ' · Import' : ''}</span>
                {h.reason && <p className="mt-1 text-[var(--text-2)]">Sabab: {h.reason}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-[var(--text-2)]">Narx hali o'zgartirilmagan.</p>
        )}
      </section>

      {editOpen && <ServiceFormModal editService={s} onClose={() => setEditOpen(false)} />}
      <ConfirmDialog open={deleteOpen} title="Xizmatni o'chirish" confirmLabel="O'chirish" danger loading={deleteMutation.isPending} onConfirm={() => deleteMutation.mutate()} onCancel={() => setDeleteOpen(false)}>
        <b>{s.name}</b> butunlay o'chiriladi.
      </ConfirmDialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--text-3)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--text-1)]">{value}</dd>
    </div>
  );
}
