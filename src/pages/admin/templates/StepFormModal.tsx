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
      toast.success(isEdit ? 'Bosqich yangilandi' : "Bosqich qo'shildi");
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Bosqichni tahrirlash' : "Yangi bosqich"} className="sm:max-w-2xl">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label="Bosqich nomi"
          placeholder="Masalan: Reduktor o'rnatish va sozlash"
          error={errors.name?.message}
          {...register('name', {
            required: 'Bosqich nomi kiritilishi shart',
            minLength: { value: 3, message: 'Kamida 3 ta belgi' },
          })}
        />

        <Input label="Tavsif (ixtiyoriy)" placeholder="Bosqich tavsifi" {...register('description')} />
        <Input label="Talablar (ixtiyoriy)" placeholder="Texnik talablar" {...register('requirements')} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Risk vazni (0–100)"
            inputMode="numeric"
            error={errors.riskWeight?.message}
            {...register('riskWeight', {
              validate: (v) => {
                const n = Number(v || 0);
                return (Number.isInteger(n) && n >= 0 && n <= 100) || "Noto'g'ri qiymat";
              },
            })}
          />
          <Input
            label="Majburiy fotolar soni"
            inputMode="numeric"
            error={errors.requiredPhotos?.message}
            {...register('requiredPhotos', {
              validate: (v) => {
                const n = Number(v || 0);
                return (Number.isInteger(n) && n >= 0 && n <= 20) || "Noto'g'ri qiymat";
              },
            })}
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/5 p-3">
          <OctagonAlert className="size-4 shrink-0 text-brand-500" />
          <Checkbox label="STOP checkpoint (Master tasdig'i talab qilinadi — keyingi bosqichda faollashadi)" {...register('isStop')} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[var(--text-2)]">O'lchovlar (§16 — min/max chegaralari bilan)</p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => append({ name: '', unit: '', minValue: '', maxValue: '', expectedValue: '', required: true })}
            >
              <Plus className="size-4" />
              O'lchov
            </Button>
          </div>

          <div className="mt-2 space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nomi"
                    placeholder="Ish bosimi"
                    error={errors.measurements?.[i]?.name?.message}
                    {...register(`measurements.${i}.name`, { required: "O'lchov nomi shart", minLength: { value: 2, message: 'Kamida 2 belgi' } })}
                  />
                  <Input
                    label="Birlik"
                    placeholder="bar"
                    error={errors.measurements?.[i]?.unit?.message}
                    {...register(`measurements.${i}.unit`, { required: 'Birlik shart' })}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <Input label="Min" inputMode="decimal" placeholder="0.9" {...register(`measurements.${i}.minValue`)} />
                  <Input label="Max" inputMode="decimal" placeholder="1.4" {...register(`measurements.${i}.maxValue`)} />
                  <Input label="Kutilgan" inputMode="decimal" placeholder="1.2" {...register(`measurements.${i}.expectedValue`)} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Checkbox label="Majburiy" {...register(`measurements.${i}.required`)} />
                  <Button type="button" variant="ghost" size="md" onClick={() => remove(i)} aria-label="O'lchovni o'chirish">
                    <Trash2 className="size-4 text-brand-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? 'Saqlash' : "Qo'shish"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
