import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, User as UserIcon } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import * as customersApi from '../../api/customers.api';
import { getApiError } from '../../api/client';
import { formatNationalPhone, toE164 } from '../../lib/phone';
import type { Customer } from '../../types/entities';

interface FormValues {
  name: string;
  phone: string;
}

/**
 * Rendered conditionally (mounts fresh each time it opens).
 * Create mode when editCustomer is null; edit mode otherwise.
 */
export function CustomerFormModal({
  onClose,
  editCustomer,
  onCreated,
}: {
  onClose: () => void;
  editCustomer: Customer | null;
  /** Called with the new customer after successful creation (e.g. to open it). */
  onCreated?: (customer: Customer) => void;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const isEdit = !!editCustomer;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editCustomer
      ? { name: editCustomer.name, phone: formatNationalPhone(editCustomer.phone.replace('+998', '')) }
      : { name: '', phone: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const phone = toE164(values.phone);
      if (!phone) throw new Error('invalid phone');
      const input = { name: values.name.trim(), phone };
      return isEdit && editCustomer ? customersApi.updateCustomer(editCustomer.id, input) : customersApi.createCustomer(input);
    },
    onSuccess: (customer) => {
      toast.success(isEdit ? "Mijoz ma'lumotlari yangilandi" : 'Mijoz yaratildi');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (!isEdit) onCreated?.(customer);
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Mijozni tahrirlash' : 'Yangi mijoz'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <Input
          label="Ism"
          placeholder="Mijozning ismi"
          leftIcon={<UserIcon className="size-[18px]" />}
          error={errors.name?.message}
          {...register('name', {
            required: 'Ism kiritilishi shart',
            minLength: { value: 2, message: 'Kamida 2 ta harf' },
          })}
        />

        <Input
          label="Telefon raqam"
          type="tel"
          inputMode="numeric"
          placeholder="90 123 45 67"
          leftIcon={<Phone className="size-[18px]" />}
          prefix="+998"
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Telefon raqam kiritilishi shart',
            validate: (v) => toE164(v) !== null || "Telefon raqam to'liq emas",
            onChange: (e) => setValue('phone', formatNationalPhone(e.target.value)),
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
