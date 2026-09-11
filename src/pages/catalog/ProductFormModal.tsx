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
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
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
  const t = useT();
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
      toast.success(isEdit ? t('cat.product.toast.updated') : t('cat.product.toast.created'));
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  const submit = (v: FormValues) => {
    const re: { company?: string; category?: string } = {};
    if (companyId == null) re.company = t('cat.valid.companyRequired');
    if (categoryId == null) re.category = t('cat.valid.categoryRequired');
    setRefErrors(re);
    if (Object.keys(re).length > 0) return;
    mutation.mutate(v);
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('cat.product.edit.title') : t('cat.product.new')}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="product-form" loading={mutation.isPending}>
            {isEdit ? t('common.save') : t('cat.action.create')}
          </Button>
        </div>
      }
    >
      <form id="product-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('cat.form.codeSku')} error={fieldError(errors.code?.message, t)} {...register('code', { required: 'cat.valid.codeRequired' })} />
          <Input label={t('cat.field.name')} error={fieldError(errors.name?.message, t)} {...register('name', { required: 'cat.valid.nameRequired' })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RefCombobox kind="companies" label={t('cat.field.company')} value={companyId} onChange={(v) => { setCompanyId(v); setRefErrors((e) => ({ ...e, company: undefined })); }} error={refErrors.company} />
          <RefCombobox kind="product-categories" label={t('cat.field.category')} value={categoryId} onChange={(v) => { setCategoryId(v); setRefErrors((e) => ({ ...e, category: undefined })); }} error={refErrors.category} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RefCombobox kind="brands" label={t('cat.form.brandOptional')} value={brandId} onChange={setBrandId} allowClear placeholder="—" />
          <RefCombobox kind="units" label={t('cat.form.unitOptional')} value={unitId} onChange={setUnitId} allowClear placeholder="—" />
        </div>

        <Input
          label={t('cat.form.priceProduct')}
          type="number"
          min={0}
          step={1}
          placeholder={t('cat.form.pricePlaceholder')}
          error={fieldError(errors.price?.message, t)}
          {...register('price', {
            validate: (v) => v.trim() === '' || (Number.isFinite(Number(v)) && Number(v) >= 0) || 'cat.valid.priceNonNegative',
          })}
        />

        {isEdit && (
          <Input label={t('cat.form.priceReasonLabel')} placeholder={t('cat.form.priceReasonPlaceholder')} {...register('priceReason')} />
        )}
      </form>
    </Modal>
  );
}
