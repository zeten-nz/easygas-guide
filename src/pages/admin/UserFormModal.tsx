import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Phone, User as UserIcon } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../features/auth/auth-context';
import * as usersApi from '../../api/users.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { assignableRoles, can } from '../../lib/permissions';
import { formatNationalPhone, toE164 } from '../../lib/phone';
import { REGIONS } from '../../lib/regions';
import { ROLE_LABELS, type RoleCode, type UserDetail } from '../../types/auth';

/** Roles that must belong to a branch (mirrors server BRANCH_REQUIRED_ROLES). */
const BRANCH_REQUIRED: RoleCode[] = ['USTA', 'MASTER', 'RAHBAR'];

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  roleCode: RoleCode | '';
  branchId: string;
  password: string;
}

interface UserFormModalProps {
  onClose: () => void;
  /** When set, the modal edits this user; otherwise it creates a new one. */
  editUser?: UserDetail | null;
}

/**
 * Rendered conditionally (mounts fresh each time it opens), so initial form
 * state comes from defaultValues — no synchronization effects needed.
 */
export function UserFormModal({ onClose, editUser }: UserFormModalProps) {
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = !!editUser;
  const roleOptions = assignableRoles(actor);
  const branchLocked = !can(actor, 'users.assign_role') && !!actor?.branchId;
  const editingSelf = isEdit && editUser?.id === actor?.id;

  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: editUser
      ? {
          firstName: editUser.firstName,
          lastName: editUser.lastName,
          phone: formatNationalPhone(editUser.phone.replace('+998', '')),
          region: editUser.region,
          roleCode: editUser.role,
          branchId: editUser.branchId != null ? String(editUser.branchId) : '',
          password: '',
        }
      : {
          firstName: '',
          lastName: '',
          phone: '',
          region: '',
          roleCode: '',
          branchId: branchLocked && actor?.branchId ? String(actor.branchId) : '',
          password: '',
        },
  });

  const selectedRole = useWatch({ control, name: 'roleCode' });
  const branchRequired = selectedRole !== '' && BRANCH_REQUIRED.includes(selectedRole);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const phone = toE164(values.phone);
      if (!phone) throw new Error('invalid phone');
      const branchId = values.branchId === '' ? null : Number(values.branchId);
      if (isEdit && editUser) {
        const input: usersApi.UpdateUserInput = {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          phone,
          region: values.region,
        };
        // Self role change is refused by the server; don't send it.
        if (!editingSelf && values.roleCode !== '') {
          input.roleCode = values.roleCode;
          input.branchId = branchId;
        }
        return usersApi.updateUser(editUser.id, input);
      }
      return usersApi.createUser({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone,
        region: values.region,
        branchId,
        roleCode: values.roleCode as RoleCode,
        password: values.password,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Foydalanuvchi ma'lumotlari yangilandi" : 'Foydalanuvchi yaratildi');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Ism"
            placeholder="Ism"
            leftIcon={<UserIcon className="size-[18px]" />}
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'Ism kiritilishi shart',
              minLength: { value: 2, message: 'Kamida 2 ta harf' },
            })}
          />
          <Input
            label="Familiya"
            placeholder="Familiya"
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'Familiya kiritilishi shart',
              minLength: { value: 2, message: 'Kamida 2 ta harf' },
            })}
          />
        </div>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Rol"
            disabled={editingSelf}
            error={errors.roleCode?.message}
            {...register('roleCode', { required: 'Rol tanlanishi shart' })}
          >
            <option value="" disabled>
              Rolni tanlang
            </option>
            {roleOptions.map((code) => (
              <option key={code} value={code}>
                {ROLE_LABELS[code]}
              </option>
            ))}
          </Select>

          <Select
            label={branchRequired ? 'Filial' : 'Filial (ixtiyoriy)'}
            disabled={branchLocked || editingSelf}
            error={errors.branchId?.message}
            {...register('branchId', {
              validate: (v) => !branchRequired || v !== '' || 'Bu rol uchun filial tanlanishi shart',
            })}
          >
            <option value="">{branchRequired ? 'Filialni tanlang' : '— Filialsiz —'}</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>

        {editingSelf && (
          <Alert tone="info">O'z rolingiz va filialingizni o'zgartira olmaysiz — buni boshqa administrator bajaradi.</Alert>
        )}

        {!isEdit && (
          <PasswordInput
            label="Boshlang'ich parol"
            autoComplete="new-password"
            placeholder="Kamida 8 belgi"
            error={errors.password?.message}
            {...register('password', {
              required: 'Parol kiritilishi shart',
              minLength: { value: 8, message: 'Kamida 8 ta belgi' },
            })}
          />
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
