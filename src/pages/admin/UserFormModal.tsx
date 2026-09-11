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
import { type RoleCode, type UserDetail } from '../../types/auth';
import { useT, useLocale } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
import { roleLabel, regionLabel } from '../../i18n/labels';

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
  const t = useT();
  const { locale } = useLocale();
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
      toast.success(isEdit ? t('au.userForm.toastUpdated') : t('au.userForm.toastCreated'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={onClose} title={isEdit ? t('au.userForm.editTitle') : t('au.userForm.newTitle')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t('au.userForm.firstName')}
            placeholder={t('au.userForm.firstName')}
            leftIcon={<UserIcon className="size-[18px]" />}
            error={fieldError(errors.firstName?.message, t)}
            {...register('firstName', {
              required: 'valid.firstNameRequired',
              minLength: { value: 2, message: 'valid.min2' },
            })}
          />
          <Input
            label={t('au.userForm.lastName')}
            placeholder={t('au.userForm.lastName')}
            error={fieldError(errors.lastName?.message, t)}
            {...register('lastName', {
              required: 'valid.lastNameRequired',
              minLength: { value: 2, message: 'valid.min2' },
            })}
          />
        </div>

        <Input
          label={t('au.userForm.phone')}
          type="tel"
          inputMode="numeric"
          placeholder="90 123 45 67"
          leftIcon={<Phone className="size-[18px]" />}
          prefix="+998"
          error={fieldError(errors.phone?.message, t)}
          {...register('phone', {
            required: 'valid.phoneRequired',
            validate: (v) => toE164(v) !== null || 'valid.phoneInvalid',
            onChange: (e) => setValue('phone', formatNationalPhone(e.target.value)),
          })}
        />

        <Select
          label={t('au.userForm.region')}
          error={fieldError(errors.region?.message, t)}
          {...register('region', { required: 'valid.regionRequired' })}
        >
          <option value="" disabled>
            {t('au.userForm.regionPlaceholder')}
          </option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {regionLabel(r, locale)}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label={t('au.userForm.role')}
            disabled={editingSelf}
            error={fieldError(errors.roleCode?.message, t)}
            {...register('roleCode', { required: 'au.userForm.roleRequired' })}
          >
            <option value="" disabled>
              {t('au.userForm.rolePlaceholder')}
            </option>
            {roleOptions.map((code) => (
              <option key={code} value={code}>
                {roleLabel(code, t)}
              </option>
            ))}
          </Select>

          <Select
            label={branchRequired ? t('au.userForm.branch') : t('au.userForm.branchOptional')}
            disabled={branchLocked || editingSelf}
            error={fieldError(errors.branchId?.message, t)}
            {...register('branchId', {
              validate: (v) => !branchRequired || v !== '' || 'au.userForm.branchRequiredForRole',
            })}
          >
            <option value="">{branchRequired ? t('au.userForm.branchPlaceholder') : t('au.userForm.branchNone')}</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>

        {editingSelf && <Alert tone="info">{t('au.userForm.selfRoleNote')}</Alert>}

        {!isEdit && (
          <PasswordInput
            label={t('au.userForm.initialPassword')}
            autoComplete="new-password"
            placeholder={t('au.userForm.passwordPlaceholder')}
            error={fieldError(errors.password?.message, t)}
            {...register('password', {
              required: 'valid.passwordRequired',
              minLength: { value: 8, message: 'valid.passwordMin8' },
            })}
          />
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEdit ? t('common.save') : t('au.action.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
