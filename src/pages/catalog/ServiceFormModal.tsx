import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { RefCombobox } from '../../components/catalog/RefCombobox';
import { getApiError } from '../../api/client';
import * as catalogApi from '../../api/catalog.api';
import { somToMinor, minorToSom } from '../../lib/money';
import type { Service } from '../../types/catalog';

interface FormValues {
  code: string;
  name: string;
  durationMinutes: string;
  price: string;
  priceBasis: 'NET' | 'GROSS' | 'UNKNOWN';
  taxPercent: string;
  priceInclusive: string;
  priceReason: string;
}

export function ServiceFormModal({ editService, onClose }: { editService: Service | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!editService;
  const [serverError, setServerError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(editService?.categoryId ?? null);
  const [categoryError, setCategoryError] = useState<string | undefined>(undefined);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editService
      ? {
          code: editService.code,
          name: editService.name,
          durationMinutes: editService.durationMinutes === null ? '' : String(editService.durationMinutes),
          price: editService.priceMinor === null ? '' : String(minorToSom(editService.priceMinor)),
          priceBasis: editService.priceBasis,
          taxPercent: editService.taxRateBp === null ? '' : String(editService.taxRateBp / 100),
          priceInclusive: editService.priceInclusiveMinor === null ? '' : String(minorToSom(editService.priceInclusiveMinor)),
          priceReason: '',
        }
      : { code: '', name: '', durationMinutes: '', price: '', priceBasis: 'UNKNOWN', taxPercent: '', priceInclusive: '', priceReason: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const base = {
        code: v.code.trim(),
        name: v.name.trim(),
        categoryId: categoryId!,
        durationMinutes: v.durationMinutes.trim() === '' ? null : Number(v.durationMinutes),
        priceMinor: v.price.trim() === '' ? null : somToMinor(Number(v.price)),
        priceBasis: v.priceBasis,
        taxRateBp: v.taxPercent.trim() === '' ? null : Math.round(Number(v.taxPercent) * 100),
        priceInclusiveMinor: v.priceInclusive.trim() === '' ? null : somToMinor(Number(v.priceInclusive)),
        ...(v.priceReason.trim() ? { priceReason: v.priceReason.trim() } : {}),
      };
      return isEdit && editService
        ? catalogApi.updateService(editService.id, { ...base, version: editService.version })
        : catalogApi.createService(base);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Xizmat yangilandi' : 'Xizmat yaratildi');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Xizmatni tahrirlash' : 'Yangi xizmat'}>
      <form
        onSubmit={handleSubmit((v) => {
          if (categoryId == null) {
            setCategoryError('Kategoriya tanlanishi shart');
            return;
          }
          mutation.mutate(v);
        })}
        noValidate
        className="space-y-4"
      >
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Kod" error={errors.code?.message} {...register('code', { required: 'Kod kiritilishi shart' })} />
          <Input label="Nomi" error={errors.name?.message} {...register('name', { required: 'Nomi kiritilishi shart' })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RefCombobox
            kind="service-categories"
            label="Kategoriya"
            value={categoryId}
            onChange={(v) => {
              setCategoryId(v);
              setCategoryError(undefined);
            }}
            error={categoryError}
          />
          <Input label="Davomiyligi (daqiqa, ixtiyoriy)" type="number" min={0} {...register('durationMinutes')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Narx (so'm) — bo'sh = noma'lum" type="number" min={0} {...register('price', { validate: (v) => v.trim() === '' || Number(v) >= 0 || "Narx manfiy bo'lmasin" })} />
          <Select label="Narx asosi" {...register('priceBasis')}>
            <option value="UNKNOWN">Noma'lum</option>
            <option value="NET">Soliqsiz (NET)</option>
            <option value="GROSS">Soliq bilan (GROSS)</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Soliq stavkasi (%, ixtiyoriy)" type="number" min={0} step="0.01" placeholder="Masalan: 12" {...register('taxPercent')} />
          <Input label="Soliq bilan narx (so'm, ixtiyoriy)" type="number" min={0} {...register('priceInclusive')} />
        </div>
        <p className="text-xs text-[var(--text-3)]">Soliq siyosati universal emas — faqat aniq bo'lsa kiriting.</p>
        {isEdit && <Input label="Narx o'zgarishi sababi (ixtiyoriy)" placeholder="Narx o'zgarsa, tarixda saqlanadi" {...register('priceReason')} />}
        <div className="sticky bottom-0 -mx-5 mt-2 flex justify-end gap-3 border-t border-[var(--border-1)] bg-[var(--surface)] px-5 py-3 sm:-mx-6 sm:px-6">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
          <Button type="submit" loading={mutation.isPending}>{isEdit ? 'Saqlash' : 'Yaratish'}</Button>
        </div>
      </form>
    </Modal>
  );
}
