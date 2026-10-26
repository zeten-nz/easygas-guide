import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, MapPin, Pencil, Phone as PhoneIcon, Plus, Power, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import * as branchesApi from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { REGIONS } from '../../lib/regions';
import type { BranchFull } from '../../types/auth';
import { cn } from '../../lib/utils';
import { useT, useLocale } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
import { regionLabel } from '../../i18n/labels';

export function BranchesPage() {
  const t = useT();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BranchFull | null>(null);
  const [statusTarget, setStatusTarget] = useState<BranchFull | null>(null);

  const branchesQuery = useQuery({
    queryKey: ['admin', 'branches'],
    queryFn: branchesApi.fetchBranchesFull,
  });

  const statusMutation = useMutation({
    mutationFn: (target: BranchFull) =>
      target.status === 'ACTIVE' ? branchesApi.deactivateBranch(target.id) : branchesApi.activateBranch(target.id),
    onSuccess: (_data, target) => {
      toast.success(target.status === 'ACTIVE' ? t('au.branches.toastDeactivated') : t('au.branches.toastActivated'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setStatusTarget(null);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setStatusTarget(null);
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">{t('au.branches.title')}</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">{t('au.branches.subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t('au.branches.new')}
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {branchesQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {branchesQuery.isError && <Alert tone="error">{localizeApiError(getApiError(branchesQuery.error).code, t)}</Alert>}

        {branchesQuery.data && branchesQuery.data.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Building2 className="size-8" />
            <p className="text-sm">{t('au.branches.empty')}</p>
          </div>
        )}

        {branchesQuery.data?.map((b) => (
          <div
            key={b.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4',
              b.status === 'INACTIVE' && 'opacity-70',
            )}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[var(--text-1)]">{b.name}</p>
                {b.status === 'ACTIVE' ? (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {t('au.branchStatus.active')}
                  </span>
                ) : (
                  <span className="rounded-full bg-ink-500/15 px-2.5 py-0.5 text-xs font-semibold text-ink-500">
                    {t('au.branchStatus.inactive')}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-2)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {regionLabel(b.region, locale)}
                  {b.address ? ` · ${b.address}` : ''}
                </span>
                {b.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <PhoneIcon className="size-3.5" />
                    {b.phone}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {t('au.branches.staffCount', { count: b.userCount ?? 0 })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditTarget(b);
                  setFormOpen(true);
                }}
                aria-label={t('au.branches.editAria', { name: b.name })}
              >
                <Pencil className="size-4" />
                <span className="hidden sm:inline">{t('au.action.edit')}</span>
              </Button>
              <Button
                variant={b.status === 'ACTIVE' ? 'danger-outline' : 'secondary'}
                onClick={() => setStatusTarget(b)}
                aria-label={
                  b.status === 'ACTIVE'
                    ? t('au.branches.deactivateAria', { name: b.name })
                    : t('au.branches.activateAria', { name: b.name })
                }
              >
                <Power className="size-4" />
                <span className="hidden sm:inline">
                  {b.status === 'ACTIVE' ? t('au.branches.deactivate') : t('au.branches.activate')}
                </span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <BranchFormModal
          key={editTarget?.id ?? 'new'}
          onClose={() => {
            setFormOpen(false);
            setEditTarget(null);
          }}
          editBranch={editTarget}
        />
      )}

      <ConfirmDialog
        open={!!statusTarget}
        title={statusTarget?.status === 'ACTIVE' ? t('au.branches.deactivateTitle') : t('au.branches.activateTitle')}
        confirmLabel={statusTarget?.status === 'ACTIVE' ? t('au.branches.deactivate') : t('au.branches.activate')}
        danger={statusTarget?.status === 'ACTIVE'}
        loading={statusMutation.isPending}
        onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)}
        onCancel={() => setStatusTarget(null)}
      >
        {statusTarget?.status === 'ACTIVE' ? (
          <>
            <b>{statusTarget?.name}</b> {t('au.branches.deactivateBody')}
          </>
        ) : (
          <>
            <b>{statusTarget?.name}</b> {t('au.branches.activateBody')}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}

interface BranchFormValues {
  name: string;
  region: string;
  address: string;
  phone: string;
}

/**
 * Rendered conditionally (mounts fresh each time it opens), so initial form
 * state comes from defaultValues — no synchronization effects needed.
 */
function BranchFormModal({ onClose, editBranch }: { onClose: () => void; editBranch: BranchFull | null }) {
  const t = useT();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!editBranch;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BranchFormValues>({
    defaultValues: editBranch
      ? {
          name: editBranch.name,
          region: editBranch.region,
          address: editBranch.address ?? '',
          phone: editBranch.phone ?? '',
        }
      : { name: '', region: '', address: '', phone: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: BranchFormValues) => {
      const input: branchesApi.BranchInput = {
        name: values.name.trim(),
        region: values.region,
        address: values.address.trim() || null,
        phone: values.phone.trim() || null,
      };
      return isEdit && editBranch ? branchesApi.updateBranch(editBranch.id, input) : branchesApi.createBranch(input);
    },
    onSuccess: () => {
      toast.success(isEdit ? t('au.branchForm.toastUpdated') : t('au.branchForm.toastCreated'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? t('au.branchForm.editTitle') : t('au.branches.new')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label={t('au.branchForm.name')}
          placeholder={t('au.branchForm.namePlaceholder')}
          leftIcon={<Building2 className="size-[18px]" />}
          error={fieldError(errors.name?.message, t)}
          {...register('name', {
            required: 'au.branchForm.nameRequired',
            minLength: { value: 3, message: 'au.branchForm.nameMin' },
          })}
        />

        <Select
          label={t('au.userForm.region')}
          error={fieldError(errors.region?.message, t)}
          {...register('region', { required: 'valid.regionRequired' })}
        >
          <option value="" disabled>
            {t('au.userForm.regionPlaceholder')}
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {regionLabel(r, locale)}
            </option>
          ))}
        </Select>

        <Input
          label={t('au.branchForm.address')}
          placeholder={t('au.branchForm.addressPlaceholder')}
          leftIcon={<MapPin className="size-[18px]" />}
          error={fieldError(errors.address?.message, t)}
          {...register('address', { maxLength: { value: 255, message: 'au.branchForm.addressTooLong' } })}
        />

        <Input
          label={t('au.branchForm.phone')}
          type="tel"
          placeholder="+998 71 200 00 00"
          leftIcon={<PhoneIcon className="size-[18px]" />}
          error={fieldError(errors.phone?.message, t)}
          {...register('phone', {
            validate: (v) => !v.trim() || /^[+\d][\d\s\-()]{5,19}$/.test(v.trim()) || 'au.branchForm.phoneInvalid',
          })}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t('common.save') : t('au.action.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
