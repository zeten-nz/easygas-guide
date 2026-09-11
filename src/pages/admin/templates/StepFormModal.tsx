import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { OctagonAlert, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import { useT } from '../../../i18n/i18n';
import { localizeApiError } from '../../../i18n/api-errors';
import { fieldError } from '../../../i18n/form';
import type { TemplateStep } from '../../../types/entities';

interface MeasurementForm {
  name: string;
  unit: string;
  minValue: string;
  maxValue: string;
  expectedValue: string;
  required: boolean;
}

interface FormValues {
  name: string;
  description: string;
  requirements: string;
  isStop: boolean;
  riskWeight: string;
  requiredPhotos: string;
  measurements: MeasurementForm[];
}

const num = (s: string): number | null => (s.trim() === '' ? null : Number(s));

/** Rendered conditionally — mounts fresh, initial state from defaultValues. */
export function StepFormModal({
  templateId,
  versionId,
  editStep,
  onClose,
}: {
  templateId: number;
  versionId: number;
  editStep: TemplateStep | null;
  onClose: () => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!editStep;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editStep
      ? {
          name: editStep.name,
          description: editStep.description ?? '',
          requirements: editStep.requirements ?? '',
          isStop: editStep.isStop,
          riskWeight: String(editStep.riskWeight),
          requiredPhotos: String(editStep.requiredPhotos),
          measurements: editStep.measurements.map((m) => ({
            name: m.name,
            unit: m.unit,
            minValue: m.minValue != null ? String(m.minValue) : '',
            maxValue: m.maxValue != null ? String(m.maxValue) : '',
            expectedValue: m.expectedValue != null ? String(m.expectedValue) : '',
            required: m.required,
          })),
        }
      : {
          name: '',
          description: '',
          requirements: '',
          isStop: false,
          riskWeight: '0',
          requiredPhotos: '0',
          measurements: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'measurements' });

  const mutation = useMutation({
    mutationFn: (v: FormValues) => {
      const input: templatesApi.StepInput = {
        name: v.name.trim(),
        description: v.description.trim() || null,
        requirements: v.requirements.trim() || null,
        isStop: v.isStop,
        riskWeight: Number(v.riskWeight || 0),
        requiredPhotos: Number(v.requiredPhotos || 0),
        measurements: v.measurements.map((m) => ({
          name: m.name.trim(),
          unit: m.unit.trim(),
          minValue: num(m.minValue),
          maxValue: num(m.maxValue),
          expectedValue: num(m.expectedValue),
          required: m.required,
        })),
      };
      return isEdit && editStep
        ? templatesApi.updateStep(templateId, versionId, editStep.id, input)
        : templatesApi.addStep(templateId, versionId, input);
    },
    onSuccess: () => {
      toast.success(isEdit ? t('tpl.toast.stepUpdated') : t('tpl.toast.stepAdded'));
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? t('tpl.step.editTitle') : t('tpl.step.newTitle')} className="sm:max-w-2xl">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label={t('tpl.step.nameLabel')}
          placeholder={t('tpl.step.namePlaceholder')}
          error={fieldError(errors.name?.message, t)}
          {...register('name', {
            required: 'tpl.valid.stepNameRequired',
            minLength: { value: 3, message: 'tpl.valid.min3' },
          })}
        />

        <Input label={t('tpl.field.descriptionOptional')} placeholder={t('tpl.step.descPlaceholder')} {...register('description')} />
        <Input label={t('tpl.step.requirementsLabel')} placeholder={t('tpl.step.requirementsPlaceholder')} {...register('requirements')} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('tpl.step.riskWeightLabel')}
            inputMode="numeric"
            error={fieldError(errors.riskWeight?.message, t)}
            {...register('riskWeight', {
              validate: (v) => {
                const n = Number(v || 0);
                return (Number.isInteger(n) && n >= 0 && n <= 100) || 'tpl.valid.invalidValue';
              },
            })}
          />
          <Input
            label={t('tpl.step.requiredPhotosLabel')}
            inputMode="numeric"
            error={fieldError(errors.requiredPhotos?.message, t)}
            {...register('requiredPhotos', {
              validate: (v) => {
                const n = Number(v || 0);
                return (Number.isInteger(n) && n >= 0 && n <= 20) || 'tpl.valid.invalidValue';
              },
            })}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/5 p-3">
          <OctagonAlert className="size-4 shrink-0 text-brand-500" />
          <Checkbox label={t('tpl.step.stopLabel')} {...register('isStop')} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[var(--text-2)]">{t('tpl.step.measurementsHeading')}</p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => append({ name: '', unit: '', minValue: '', maxValue: '', expectedValue: '', required: true })}
            >
              <Plus className="size-4" />
              {t('tpl.step.addMeasurement')}
            </Button>
          </div>

          <div className="mt-2 space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('tpl.field.nameShort')}
                    placeholder={t('tpl.step.measureNamePlaceholder')}
                    error={fieldError(errors.measurements?.[i]?.name?.message, t)}
                    {...register(`measurements.${i}.name`, { required: 'tpl.valid.measureNameRequired', minLength: { value: 2, message: 'tpl.valid.min2chars' } })}
                  />
                  <Input
                    label={t('tpl.step.unitLabel')}
                    placeholder={t('tpl.step.unitPlaceholder')}
                    error={fieldError(errors.measurements?.[i]?.unit?.message, t)}
                    {...register(`measurements.${i}.unit`, { required: 'tpl.valid.unitRequired' })}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <Input label={t('tpl.step.minLabel')} inputMode="decimal" placeholder="0.9" {...register(`measurements.${i}.minValue`)} />
                  <Input label={t('tpl.step.maxLabel')} inputMode="decimal" placeholder="1.4" {...register(`measurements.${i}.maxValue`)} />
                  <Input label={t('tpl.step.expectedLabel')} inputMode="decimal" placeholder="1.2" {...register(`measurements.${i}.expectedValue`)} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Checkbox label={t('tpl.field.required')} {...register(`measurements.${i}.required`)} />
                  <Button type="button" variant="ghost" size="md" onClick={() => remove(i)} aria-label={t('tpl.step.removeMeasurement')}>
                    <Trash2 className="size-4 text-brand-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t('common.save') : t('tpl.action.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
