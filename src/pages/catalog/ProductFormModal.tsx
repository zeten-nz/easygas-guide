import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { getApiError } from '../../api/client';
import * as catalogApi from '../../api/catalog.api';
import { listReference } from '../../api/reference.api';
import { somToMinor, minorToSom } from '../../lib/money';
import type { Product, ReferenceKind } from '../../types/catalog';

/** Bounded ACTIVE reference options for a picker (reference sets are small; the
 *  large catalogue itself is always server-paginated, never downloaded whole). */
function useRefOptions(kind: ReferenceKind) {
  return useQuery({
    queryKey: ['reference', kind, 'active-options'],
    queryFn: () => listReference(kind, { status: 'ACTIVE', limit: 100 }),
    select: (d) => d.items,
  });
}

interface FormValues {
  code: string;
  name: string;
  companyId: string;
  categoryId: string;
  brandId: string;
  unitId: string;
  price: string; // "so'm"; empty = unknown
  priceReason: string;
}

export function ProductFormModal({ editProduct, onClose }: { editProduct: Product | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!editProduct;
  const [serverError, setServerError] = useState<string | null>(null);

  const companies = useRefOptions('companies');
  const categories = useRefOptions('product-categories');
  const brands = useRefOptions('brands');
  const units = useRefOptions('units');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editProduct
      ? {
          code: editProduct.code,
          name: editProduct.name,
          companyId: String(editProduct.companyId),
          categoryId: String(editProduct.categoryId),
          brandId: editProduct.brandId ? String(editProduct.brandId) : '',
          unitId: editProduct.unitId ? String(editProduct.unitId) : '',
          price: editProduct.priceMinor === null ? '' : String(minorToSom(editProduct.priceMinor)),
          priceReason: '',
        }
      : { code: '', name: '', companyId: '', categoryId: '', brandId: '', unitId: '', price: '', priceReason: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const priceMinor = v.price.trim() === '' ? null : somToMinor(Number(v.price));
      const base = {
        code: v.code.trim(),
        name: v.name.trim(),
        companyId: Number(v.companyId),
        categoryId: Number(v.categoryId),
        brandId: v.brandId ? Number(v.brandId) : null,
        unitId: v.unitId ? Number(v.unitId) : null,
        priceMinor,
        ...(v.priceReason.trim() ? { priceReason: v.priceReason.trim() } : {}),
      };
      return isEdit && editProduct
        ? catalogApi.updateProduct(editProduct.id, { ...base, version: editProduct.version })
        : catalogApi.createProduct(base);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Mahsulot yangilandi' : 'Mahsulot yaratildi');
      // Broad invalidation so the list, the detail, AND its price history refetch.
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Kod (SKU)" error={errors.code?.message} {...register('code', { required: 'Kod kiritilishi shart' })} />
          <Input label="Nomi" error={errors.name?.message} {...register('name', { required: 'Nomi kiritilishi shart' })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Kompaniya" error={errors.companyId?.message} {...register('companyId', { required: 'Kompaniya tanlanishi shart' })}>
            <option value="" disabled>
              Tanlang
            </option>
            {(companies.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Kategoriya" error={errors.categoryId?.message} {...register('categoryId', { required: 'Kategoriya tanlanishi shart' })}>
            <option value="" disabled>
              Tanlang
            </option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Brend (ixtiyoriy)" {...register('brandId')}>
            <option value="">—</option>
            {(brands.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select label="O'lchov birligi (ixtiyoriy)" {...register('unitId')}>
            <option value="">—</option>
            {(units.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} — {u.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Narx (so'm) — bo'sh qoldirilsa noma'lum"
          type="number"
          min={0}
          step={1}
          placeholder="Masalan: 1500000"
          error={errors.price?.message}
          {...register('price', {
            validate: (v) => v.trim() === '' || (Number.isFinite(Number(v)) && Number(v) >= 0) || "Narx manfiy bo'lmagan son bo'lishi kerak",
          })}
        />

        {isEdit && (
          <Input label="Narx o'zgarishi sababi (ixtiyoriy)" placeholder="Narx o'zgarsa, tarixda saqlanadi" {...register('priceReason')} />
        )}

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
