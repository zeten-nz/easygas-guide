import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Car, Gauge, Hash } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import * as vehiclesApi from '../../api/vehicles.api';
import { getApiError } from '../../api/client';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
import type { Vehicle } from '../../types/entities';

interface FormValues {
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  engine: string;
  mileage: string;
  vin: string;
}

/**
 * Rendered conditionally (mounts fresh each time it opens).
 * Creates a vehicle for `customerId`, or edits `editVehicle` when set.
 * Fields follow loyiha.md §13: davlat raqami, marka, model, yil, engine, mileage, VIN.
 */
export function VehicleFormModal({
  customerId,
  editVehicle,
  onClose,
}: {
  customerId: number;
  editVehicle: Vehicle | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const t = useT();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!editVehicle;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editVehicle
      ? {
          plateNumber: editVehicle.plateNumber,
          make: editVehicle.make,
          model: editVehicle.model,
          year: editVehicle.year != null ? String(editVehicle.year) : '',
          engine: editVehicle.engine ?? '',
          mileage: editVehicle.mileage != null ? String(editVehicle.mileage) : '',
          vin: editVehicle.vin ?? '',
        }
      : { plateNumber: '', make: '', model: '', year: '', engine: '', mileage: '', vin: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input: vehiclesApi.VehicleInput = {
        customerId,
        plateNumber: values.plateNumber.trim(),
        make: values.make.trim(),
        model: values.model.trim(),
        year: values.year.trim() === '' ? null : Number(values.year),
        engine: values.engine.trim() === '' ? null : values.engine.trim(),
        mileage: values.mileage.trim() === '' ? null : Number(values.mileage),
        vin: values.vin.trim() === '' ? null : values.vin.trim(),
      };
      return isEdit && editVehicle ? vehiclesApi.updateVehicle(editVehicle.id, input) : vehiclesApi.createVehicle(input);
    },
    onSuccess: () => {
      toast.success(isEdit ? t('m.vehicleForm.updated') : t('m.vehicleForm.created'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  const currentYear = new Date().getFullYear();

  return (
    <Modal open onClose={onClose} title={isEdit ? t('m.vehicleForm.editTitle') : t('m.vehicles.add')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label={t('m.vehicleForm.plate')}
          placeholder="01 A 123 BC"
          leftIcon={<Hash className="size-[18px]" />}
          className="uppercase"
          error={fieldError(errors.plateNumber?.message, t)}
          {...register('plateNumber', {
            required: 'm.valid.plateRequired',
            validate: (v) =>
              /^[A-Z0-9]{5,12}$/.test(v.toUpperCase().replace(/[\s-]/g, '')) || 'm.valid.plateFormat',
            onChange: (e) => setValue('plateNumber', e.target.value.toUpperCase()),
          })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('m.vehicleForm.make')}
            placeholder="Chevrolet"
            leftIcon={<Car className="size-[18px]" />}
            error={fieldError(errors.make?.message, t)}
            {...register('make', {
              required: 'm.valid.makeRequired',
              minLength: { value: 2, message: 'm.valid.min2Chars' },
            })}
          />
          <Input
            label={t('m.vehicleForm.model')}
            placeholder="Cobalt"
            error={fieldError(errors.model?.message, t)}
            {...register('model', { required: 'm.valid.modelRequired' })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('m.vehicleForm.year')}
            inputMode="numeric"
            placeholder={String(currentYear)}
            error={fieldError(errors.year?.message, t)}
            {...register('year', {
              validate: (v) => {
                if (v.trim() === '') return true;
                const n = Number(v);
                return (Number.isInteger(n) && n >= 1950 && n <= currentYear + 1) || 'm.valid.yearInvalid';
              },
              onChange: (e) => setValue('year', e.target.value.replace(/\D/g, '').slice(0, 4)),
            })}
          />
          <Input
            label={t('m.vehicleForm.mileage')}
            inputMode="numeric"
            placeholder="120000"
            leftIcon={<Gauge className="size-[18px]" />}
            error={fieldError(errors.mileage?.message, t)}
            {...register('mileage', {
              validate: (v) => {
                if (v.trim() === '') return true;
                const n = Number(v);
                return (Number.isInteger(n) && n >= 0 && n <= 2_000_000) || 'm.valid.mileageInvalid';
              },
              onChange: (e) => setValue('mileage', e.target.value.replace(/\D/g, '').slice(0, 7)),
            })}
          />
        </div>

        <Input
          label={t('m.vehicleForm.engine')}
          placeholder={t('m.vehicleForm.enginePlaceholder')}
          error={fieldError(errors.engine?.message, t)}
          {...register('engine', { maxLength: { value: 100, message: 'm.valid.tooLong' } })}
        />

        <Input
          label={t('m.vehicleForm.vin')}
          placeholder={t('m.vehicleForm.vinPlaceholder')}
          className="uppercase"
          error={fieldError(errors.vin?.message, t)}
          {...register('vin', {
            validate: (v) =>
              v.trim() === '' ||
              /^[A-HJ-NPR-Z0-9]{17}$/.test(v.toUpperCase().replace(/\s/g, '')) ||
              'm.valid.vinFormat',
            onChange: (e) => setValue('vin', e.target.value.toUpperCase().slice(0, 17)),
          })}
        />

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t('common.save') : t('m.action.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
