import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { RefCombobox } from '../../components/catalog/RefCombobox';
import { getApiError } from '../../api/client';
import * as catalogApi from '../../api/catalog.api';
import { somToMinor, minorToSom } from '../../lib/money';
import type { Product } from '../../types/catalog';

interface FormValues {
  code: string;
  name: string;
  price: string; // "so'm"; empty = unknown
  priceReason: string;
}

export function ProductFormModal({ editProduct, onClose }: { editProduct: Product | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!editProduct;
  const [serverError, setServerError] = useState<string | null>(null);

  // Reference selections are ids in local state (the RefCombobox is a controlled
  // server-backed search — it is not a native <select>, so it lives outside RHF).
  const [companyId, setCompanyId] = useState<number | null>(editProduct?.companyId ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(editProduct?.categoryId ?? null);
  const [brandId, setBrandId] = useState<number | null>(editProduct?.brandId ?? null);
  const [unitId, setUnitId] = useState<number | null>(editProduct?.unitId ?? null);
  const [refErrors, setRefErrors] = useState<{ company?: string; category?: string }>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editProduct
      ? { code: editProduct.code, name: editProduct.name, price: editProduct.priceMinor === null ? '' : String(minorToSom(editProduct.priceMinor)), priceReason: '' }
      : { code: '', name: '', price: '', priceReason: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const priceMinor = v.price.trim() === '' ? null : somToMinor(Number(v.price));
      const base = {
        code: v.code.trim(),
        name: v.name.trim(),
        companyId: companyId!,
        categoryId: categoryId!,
        brandId,
        unitId,
        priceMinor,
        ...(v.priceReason.trim() ? { priceReason: v.priceReason.trim() } : {}),
      };
      return isEdit && editProduct
        ? catalogApi.updateProduct(editProduct.id, { ...base, version: editProduct.version })
        : catalogApi.createProduct(base);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Mahsulot yangilandi' : 'Mahsulot yaratildi');
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  const submit = (v: FormValues) => {
    const re: { company?: string; category?: string } = {};
    if (companyId == null) re.company = 'Kompaniya tanlanishi shart';
    if (categoryId == null) re.category = 'Kategoriya tanlanishi shart';
    setRefErrors(re);
    if (Object.keys(re).length > 0) return;
    mutation.mutate(v);
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Kod (SKU)" error={errors.code?.message} {...register('code', { required: 'Kod kiritilishi shart' })} />
          <Input label="Nomi" error={errors.name?.message} {...register('name', { required: 'Nomi kiritilishi shart' })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RefCombobox kind="companies" label="Kompaniya" value={companyId} onChange={(v) => { setCompanyId(v); setRefErrors((e) => ({ ...e, company: undefined })); }} error={refErrors.company} />
          <RefCombobox kind="product-categories" label="Kategoriya" value={categoryId} onChange={(v) => { setCategoryId(v); setRefErrors((e) => ({ ...e, category: undefined })); }} error={refErrors.category} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RefCombobox kind="brands" label="Brend (ixtiyoriy)" value={brandId} onChange={setBrandId} allowClear placeholder="—" />
          <RefCombobox kind="units" label="O'lchov birligi (ixtiyoriy)" value={unitId} onChange={setUnitId} allowClear placeholder="—" />
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

        {/* Sticky footer: the action buttons stay pinned to the bottom of the
            (scrollable) modal, so they are always in view and stable — no scroll
            race on a tall dialog / small viewport. */}
        <div className="sticky bottom-0 -mx-5 mt-2 flex justify-end gap-3 border-t border-[var(--border-1)] bg-[var(--surface)] px-5 py-3 sm:-mx-6 sm:px-6">
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
