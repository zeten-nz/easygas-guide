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

export function BranchesPage() {
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
      toast.success(target.status === 'ACTIVE' ? 'Filial faolsizlantirildi' : 'Filial faollashtirildi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setStatusTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setStatusTarget(null);
    },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Filiallar</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Servis filiallarini boshqarish. Filiallar o'chirilmaydi — faqat faolsizlantiriladi.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yangi filial
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {branchesQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {branchesQuery.isError && <Alert tone="error">{getApiError(branchesQuery.error).message}</Alert>}

        {branchesQuery.data && branchesQuery.data.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Building2 className="size-8" />
            <p className="text-sm">Hozircha filiallar yo'q</p>
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
                    Faol
                  </span>
                ) : (
                  <span className="rounded-full bg-ink-500/15 px-2.5 py-0.5 text-xs font-semibold text-ink-500">
                    Faol emas
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-2)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {b.region}
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
                  {b.userCount ?? 0} xodim
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
                aria-label={`${b.name}ni tahrirlash`}
              >
                <Pencil className="size-4" />
                <span className="hidden sm:inline">Tahrirlash</span>
              </Button>
              <Button
                variant={b.status === 'ACTIVE' ? 'danger-outline' : 'secondary'}
                onClick={() => setStatusTarget(b)}
                aria-label={b.status === 'ACTIVE' ? `${b.name}ni faolsizlantirish` : `${b.name}ni faollashtirish`}
              >
                <Power className="size-4" />
                <span className="hidden sm:inline">
                  {b.status === 'ACTIVE' ? 'Faolsizlantirish' : 'Faollashtirish'}
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
        title={statusTarget?.status === 'ACTIVE' ? 'Filialni faolsizlantirish' : 'Filialni faollashtirish'}
        confirmLabel={statusTarget?.status === 'ACTIVE' ? 'Faolsizlantirish' : 'Faollashtirish'}
        danger={statusTarget?.status === 'ACTIVE'}
        loading={statusMutation.isPending}
        onConfirm={() => statusTarget && statusMutation.mutate(statusTarget)}
        onCancel={() => setStatusTarget(null)}
      >
        {statusTarget?.status === 'ACTIVE' ? (
          <>
            <b>{statusTarget?.name}</b> faolsizlantiriladi: ro'yxatdan o'tish formasida ko'rinmaydi va unga yangi
            foydalanuvchi biriktirib bo'lmaydi. Mavjud xodimlar va yozuvlar saqlanib qoladi.
          </>
        ) : (
          <>
            <b>{statusTarget?.name}</b> yana faollashtiriladi va foydalanuvchi biriktirish mumkin bo'ladi.
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
      toast.success(isEdit ? "Filial ma'lumotlari yangilandi" : 'Filial yaratildi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Filialni tahrirlash' : 'Yangi filial'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label="Filial nomi"
          placeholder="Masalan: EASY GAS Chilonzor"
          leftIcon={<Building2 className="size-[18px]" />}
          error={errors.name?.message}
          {...register('name', {
            required: 'Filial nomi kiritilishi shart',
            minLength: { value: 3, message: 'Kamida 3 ta belgi' },
          })}
        />

        <Select
          label="Viloyat"
          error={errors.region?.message}
          {...register('region', { required: 'Viloyat tanlanishi shart' })}
        >
          <option value="" disabled>
            Viloyatni tanlang
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <Input
          label="Manzil (ixtiyoriy)"
          placeholder="Ko'cha, tuman"
          leftIcon={<MapPin className="size-[18px]" />}
          error={errors.address?.message}
          {...register('address', { maxLength: { value: 255, message: 'Manzil juda uzun' } })}
        />

        <Input
          label="Telefon (ixtiyoriy)"
          type="tel"
          placeholder="+998 71 200 00 00"
          leftIcon={<PhoneIcon className="size-[18px]" />}
          error={errors.phone?.message}
          {...register('phone', {
            validate: (v) => !v.trim() || /^[+\d][\d\s\-()]{5,19}$/.test(v.trim()) || "Telefon raqam noto'g'ri formatda",
          })}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Saqlash' : 'Yaratish'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
