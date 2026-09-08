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
import { templateStatus } from './template-lifecycle';
import { DeleteTemplateDialog } from './DeleteTemplateDialog';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import type { ChecklistTemplate } from '../../../types/entities';

type StatusFilter = '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export function TemplatesPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplate | null>(null);

  const templatesQuery = useQuery({ queryKey: ['templates', 'list'], queryFn: templatesApi.fetchTemplates });

  const filtered = useMemo(() => {
    const list = templatesQuery.data ?? [];
    return statusFilter ? list.filter((t) => templateStatus(t) === statusFilter) : list;
  }, [templatesQuery.data, statusFilter]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Checklist shablonlari</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Yangi ishlar faol (nashr qilingan) versiyadan foydalanadi. Eski ishlar o'z versiyasini saqlab qoladi.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Yangi shablon
        </Button>
      </div>

      <div className="mt-6 sm:max-w-xs">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label="Holat bo'yicha filtr">
          <option value="">Barcha holatlar</option>
          <option value="PUBLISHED">Faol</option>
          <option value="DRAFT">Qoralama</option>
          <option value="ARCHIVED">Arxivlangan</option>
        </Select>
      </div>

      <div className="mt-5 space-y-3">
        {templatesQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : templatesQuery.isError ? (
          <Alert tone="error">{getApiError(templatesQuery.error).message}</Alert>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <ClipboardList className="size-8 text-[var(--text-3)]" />
            <p className="text-sm">{statusFilter ? 'Bu holatda shablon yo\'q' : "Hozircha shablonlar yo'q"}</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/app/admin/templates/${t.id}`}
                    className="font-semibold text-[var(--text-1)] hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  >
                    {t.name}
                  </Link>
                  <TemplateStatusBadge template={t} />
                </div>
                {t.description && <p className="mt-0.5 text-sm text-[var(--text-2)]">{t.description}</p>}
                <div className="mt-2">
                  <VersionChips template={t} />
                </div>
              </div>

              <DropdownMenu
                align="end"
                button={
                  <button
                    type="button"
                    aria-label={`${t.name} — amallar`}
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
                        navigate(`/app/admin/templates/${t.id}`);
                      }}
                    >
                      Ochish
                    </MenuItem>
                    <MenuItem
                      icon={<Trash2 className="size-[18px]" />}
                      danger
                      disabled={t.deletable === false}
                      onClick={() => {
                        close();
                        setDeleteTarget(t);
                      }}
                    >
                      O'chirish
                    </MenuItem>
                    {t.deletable === false && (
                      <p className="px-3 pb-1.5 pt-1 text-xs text-[var(--text-3)]">
                        Nashr qilingan yoki arxivlangan shablon o'chirilmaydi — tarixni saqlaydi.
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
