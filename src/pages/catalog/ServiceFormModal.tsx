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
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
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
  const t = useT();
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
      toast.success(isEdit ? t('cat.service.toast.updated') : t('cat.service.toast.created'));
      queryClient.invalidateQueries({ queryKey: ['catalog'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? t('cat.service.edit.title') : t('cat.service.new')}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" form="service-form" loading={mutation.isPending}>{isEdit ? t('common.save') : t('cat.action.create')}</Button>
        </div>
      }
    >
      <form
        id="service-form"
        onSubmit={handleSubmit((v) => {
          if (categoryId == null) {
            setCategoryError(t('cat.valid.categoryRequired'));
            return;
          }
          mutation.mutate(v);
        })}
        noValidate
        className="space-y-4"
      >
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('cat.field.code')} error={fieldError(errors.code?.message, t)} {...register('code', { required: 'cat.valid.codeRequired' })} />
          <Input label={t('cat.field.name')} error={fieldError(errors.name?.message, t)} {...register('name', { required: 'cat.valid.nameRequired' })} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <RefCombobox
            kind="service-categories"
            label={t('cat.field.category')}
            value={categoryId}
            onChange={(v) => {
              setCategoryId(v);
              setCategoryError(undefined);
            }}
            error={categoryError}
          />
          <Input label={t('cat.form.durationLabel')} type="number" min={0} {...register('durationMinutes')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('cat.form.priceService')} type="number" min={0} {...register('price', { validate: (v) => v.trim() === '' || Number(v) >= 0 || 'cat.valid.priceNotNegative' })} />
          <Select label={t('cat.field.priceBasis')} {...register('priceBasis')}>
            <option value="UNKNOWN">{t('cat.priceBasis.unknown')}</option>
            <option value="NET">{t('cat.priceBasis.net')}</option>
            <option value="GROSS">{t('cat.priceBasis.gross')}</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('cat.form.taxRateLabel')} type="number" min={0} step="0.01" placeholder={t('cat.form.taxPlaceholder')} {...register('taxPercent')} />
          <Input label={t('cat.form.priceInclusiveLabel')} type="number" min={0} {...register('priceInclusive')} />
        </div>
        <p className="text-xs text-[var(--text-3)]">{t('cat.form.taxNote')}</p>
        {isEdit && <Input label={t('cat.form.priceReasonLabel')} placeholder={t('cat.form.priceReasonPlaceholder')} {...register('priceReason')} />}
      </form>
    </Modal>
  );
}
