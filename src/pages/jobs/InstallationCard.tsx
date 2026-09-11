import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Fuel, Pencil } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../features/auth/auth-context';
import * as jobsApi from '../../api/jobs.api';
import { getApiError } from '../../api/client';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { can } from '../../lib/permissions';
import type { GasType, Job } from '../../types/entities';
import { cn } from '../../lib/utils';

/** §13 installation details: LPG/CNG, kit, ECU, cylinder + note — exact spec fields. */
export function InstallationCard({ job }: { job: Job }) {
  const t = useT();
  const { user: actor } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

  const editable = can(actor, 'jobs.create') && (job.status === 'DRAFT' || job.status === 'IN_PROGRESS');
  const inst = job.installation;
  const isEmpty = !inst.gasType && !inst.kit && !inst.ecu && !inst.cylinder && !inst.note;

  return (
    <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold text-[var(--text-1)]">
          <Fuel className="size-4.5 text-brand-500" />
          {t('jb.inst.title')}
        </p>
        {editable && (
          <Button variant="secondary" size="md" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            {isEmpty ? t('jb.inst.add') : t('jb.inst.edit')}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <p className="mt-3 text-sm text-[var(--text-2)]">{t('jb.inst.empty')}</p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <InfoItem label={t('jb.inst.gasType')} value={inst.gasType} highlight />
          <InfoItem label={t('jb.inst.kit')} value={inst.kit} />
          <InfoItem label={t('jb.inst.ecu')} value={inst.ecu} />
          <InfoItem label={t('jb.inst.cylinder')} value={inst.cylinder} />
          {inst.note && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-xs text-[var(--text-2)]">{t('jb.inst.note')}</p>
              <p className="text-[var(--text-1)]">{inst.note}</p>
            </div>
          )}
        </div>
      )}

      {editOpen && <InstallationModal job={job} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function InfoItem({ label, value, highlight = false }: { label: string; value: string | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-2)]">{label}</p>
      <p className={cn('font-semibold', highlight ? 'text-brand-600' : 'text-[var(--text-1)]')}>{value ?? '—'}</p>
    </div>
  );
}

interface FormValues {
  gasType: GasType | '';
  kit: string;
  ecu: string;
  cylinder: string;
  note: string;
}

function InstallationModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const t = useT();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const inst = job.installation;

  const { register, handleSubmit, setValue, control } = useForm<FormValues>({
    defaultValues: {
      gasType: inst.gasType ?? '',
      kit: inst.kit ?? '',
      ecu: inst.ecu ?? '',
      cylinder: inst.cylinder ?? '',
      note: inst.note ?? '',
    },
  });
  const gasType = useWatch({ control, name: 'gasType' });

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      jobsApi.updateInstallation(job.id, {
        gasType: v.gasType === '' ? null : v.gasType,
        kit: v.kit.trim() || null,
        ecu: v.ecu.trim() || null,
        cylinder: v.cylinder.trim() || null,
        note: v.note.trim() || null,
      }),
    onSuccess: () => {
      toast.success(t('jb.inst.savedToast'));
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={onClose} title={t('jb.inst.title')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div>
          <p className="mb-1.5 text-[13px] font-medium text-[var(--text-2)]">{t('jb.inst.gasType')}</p>
          <div className="grid grid-cols-2 gap-2">
            {(['LPG', 'CNG'] as GasType[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setValue('gasType', gasType === g ? '' : g)}
                className={cn(
                  'h-12 rounded-xl border text-[15px] font-bold transition-colors',
                  gasType === g
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                    : 'border-[var(--field-border)] bg-[var(--field-bg)] text-[var(--text-2)] hover:text-[var(--text-1)]',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <Input label={t('jb.inst.kit')} placeholder={t('jb.inst.kitPlaceholder')} {...register('kit')} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('jb.inst.ecu')} placeholder={t('jb.inst.ecuPlaceholder')} {...register('ecu')} />
          <Input label={t('jb.inst.cylinder')} placeholder={t('jb.inst.cylinderPlaceholder')} {...register('cylinder')} />
        </div>
        <Input label={t('jb.noteOptional')} placeholder={t('jb.inst.notePlaceholder')} {...register('note')} />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
