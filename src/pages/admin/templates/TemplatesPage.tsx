import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronsRight, ClipboardList, Plus } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Alert } from '../../../components/ui/Alert';
import { Spinner } from '../../../components/ui/Spinner';
import { Modal } from '../../../components/ui/Modal';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import { VERSION_STATUS_LABELS, type VersionStatus } from '../../../types/entities';
import { cn } from '../../../lib/utils';

const STATUS_BADGE: Record<VersionStatus, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-700',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-700',
  ARCHIVED: 'bg-ink-500/15 text-ink-500',
};

export function TemplatesPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);

  const templatesQuery = useQuery({ queryKey: ['templates', 'list'], queryFn: templatesApi.fetchTemplates });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Checklist shablonlari</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Yangi ishlar faol (nashr qilingan) versiyadan foydalanadi. Eski ishlar o'z versiyasini saqlab qoladi.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Yangi shablon
        </Button>
      </div>

      <div className="mt-5 space-y-3">
        {templatesQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {templatesQuery.isError && <Alert tone="error">{getApiError(templatesQuery.error).message}</Alert>}

        {templatesQuery.data?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <ClipboardList className="size-8" />
            <p className="text-sm">Hozircha shablonlar yo'q</p>
          </div>
        )}

        {templatesQuery.data?.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate(`/app/admin/templates/${t.id}`)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-brand-500/40"
          >
            <div className="min-w-0">
              <p className="font-semibold text-[var(--text-1)]">{t.name}</p>
              {t.description && <p className="mt-0.5 text-sm text-[var(--text-2)]">{t.description}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {t.versions.map((v) => (
                  <span
                    key={v.id}
                    className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_BADGE[v.status])}
                  >
                    v{v.version} — {VERSION_STATUS_LABELS[v.status]}
                  </span>
                ))}
              </div>
            </div>
            <ChevronsRight className="size-5 shrink-0 text-[var(--text-2)]" />
          </button>
        ))}
      </div>

      {createOpen && <CreateTemplateModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function CreateTemplateModal({ onClose }: { onClose: () => void }) {
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
      toast.success('Shablon yaratildi (v1 qoralama tayyor)');
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      navigate(`/app/admin/templates/${template.id}`);
    },
    onError: (err) => setServerError(getApiError(err).message),
  });

  return (
    <Modal open onClose={onClose} title="Yangi checklist shabloni">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input
          label="Shablon nomi"
          placeholder="Masalan: LPG o'rnatish tekshiruv ro'yxati"
          error={errors.name?.message}
          {...register('name', {
            required: 'Shablon nomi kiritilishi shart',
            minLength: { value: 3, message: 'Kamida 3 ta belgi' },
          })}
        />
        <Input label="Tavsif (ixtiyoriy)" placeholder="Qisqa tavsif" {...register('description')} />
        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Yaratish
          </Button>
        </div>
      </form>
    </Modal>
  );
}
