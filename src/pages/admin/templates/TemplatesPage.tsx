import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, MoreHorizontal, Plus, SquareArrowOutUpRight, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Alert } from '../../../components/ui/Alert';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import { DropdownMenu, MenuItem } from '../../../components/ui/DropdownMenu';
import { TemplateStatusBadge, VersionChips } from './template-status';
import { statusLabel, templateStatus } from './template-lifecycle';
import { DeleteTemplateDialog } from './DeleteTemplateDialog';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import { useT } from '../../../i18n/i18n';
import { localizeApiError } from '../../../i18n/api-errors';
import { fieldError } from '../../../i18n/form';
import type { ChecklistTemplate } from '../../../types/entities';

type StatusFilter = '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export function TemplatesPage() {
  const t = useT();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(null);

  const templatesQuery = useQuery({ queryKey: ['templates', 'list'], queryFn: templatesApi.fetchTemplates });

  const filtered = useMemo(() => {
    const list = templatesQuery.data ?? [];
    return statusFilter ? list.filter((tpl) => templateStatus(tpl) === statusFilter) : list;
  }, [templatesQuery.data, statusFilter]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('tpl.page.title')}</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">{t('tpl.page.subtitle')}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('tpl.new')}
        </Button>
      </div>

      <div className="mt-6 sm:max-w-xs">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label={t('tpl.filter.aria')}>
          <option value="">{t('tpl.filter.all')}</option>
          <option value="PUBLISHED">{statusLabel('PUBLISHED', t)}</option>
          <option value="DRAFT">{statusLabel('DRAFT', t)}</option>
          <option value="ARCHIVED">{statusLabel('ARCHIVED', t)}</option>
        </Select>
      </div>

      <div className="mt-5 space-y-3">
        {templatesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : templatesQuery.isError ? (
          <Alert tone="error">{localizeApiError(getApiError(templatesQuery.error).code, t)}</Alert>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <ClipboardList className="size-8 text-[var(--text-3)]" />
            <p className="text-sm">{statusFilter ? t('tpl.empty.filtered') : t('tpl.empty.none')}</p>
          </div>
        ) : (
          filtered.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/app/admin/templates/${tpl.id}`}
                    className="font-semibold text-[var(--text-1)] hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    {tpl.name}
                  </Link>
                  <TemplateStatusBadge template={tpl} />
                </div>
                {tpl.description && <p className="mt-0.5 text-sm text-[var(--text-2)]">{tpl.description}</p>}
                <div className="mt-2">
                  <VersionChips template={tpl} />
                </div>
              </div>

              <DropdownMenu
                align="end"
                button={
                  <button
                    type="button"
                    aria-label={t('tpl.row.actionsAria', { name: tpl.name })}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    <MoreHorizontal className="size-5" />
                  </button>
                }
              >
                {(close) => (
                  <>
                    <MenuItem
                      icon={<SquareArrowOutUpRight className="size-[18px]" />}
                      onClick={() => {
                        close();
                        navigate(`/app/admin/templates/${tpl.id}`);
                      }}
                    >
                      {t('tpl.action.open')}
                    </MenuItem>
                    <MenuItem
                      icon={<Trash2 className="size-[18px]" />}
                      danger
                      disabled={tpl.deletable === false}
                      onClick={() => {
                        close();
                        setDeleteTarget(tpl);
                      }}
                    >
                      {t('tpl.action.delete')}
                    </MenuItem>
                    {tpl.deletable === false && (
                      <p className="px-3 pb-1.5 pt-1 text-xs text-[var(--text-3)]">
                        {t('tpl.row.deleteBlocked')}
                      </p>
                    )}
                  </>
                )}
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      {createOpen && <CreateTemplateModal onClose={() => setCreateOpen(false)} />}
      {deleteTarget && <DeleteTemplateDialog template={deleteTarget} onClose={() => setDeleteTarget(null)} />}
    </div>
  );
}

function CreateTemplateModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; description: string }>({ defaultValues: { name: '', description: '' } });

  const mutation = useMutation({
    mutationFn: (v: { name: string; description: string }) =>
      templatesApi.createTemplate({ name: v.name.trim(), description: v.description.trim() || null }),
    onSuccess: (template) => {
      toast.success(t('tpl.toast.created'));
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate(`/app/admin/templates/${template.id}`);
    },
    onError: (err) => setServerError(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={onClose} title={t('tpl.create.title')}>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label={t('tpl.field.name')}
          placeholder={t('tpl.create.namePlaceholder')}
          error={fieldError(errors.name?.message, t)}
          {...register('name', {
            required: 'tpl.valid.nameRequired',
            minLength: { value: 3, message: 'tpl.valid.min3' },
          })}
        />
        <Input label={t('tpl.field.descriptionOptional')} placeholder={t('tpl.create.descPlaceholder')} {...register('description')} />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {t('tpl.create.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
