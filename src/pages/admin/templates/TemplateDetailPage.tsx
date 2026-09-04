import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Archive,
  OctagonAlert,
  Pencil,
  Plus,
  Rocket,
  Ruler,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import { Spinner } from '../../../components/ui/Spinner';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { StepFormModal } from './StepFormModal';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import { VERSION_STATUS_LABELS, type TemplateStep, type TemplateVersion } from '../../../types/entities';
import { cn } from '../../../lib/utils';

export function TemplateDetailPage() {
  const { id } = useParams();
  const templateId = Number(id);
  const queryClient = useQueryClient();

  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [stepFormOpen, setStepFormOpen] = useState(false);
  const [editStep, setEditStep] = useState<TemplateStep | null>(null);
  const [publishTarget, setPublishTarget] = useState<TemplateVersion | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<TemplateVersion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateStep | null>(null);

  const templateQuery = useQuery({
    queryKey: ['templates', 'detail', templateId],
    queryFn: () => templatesApi.fetchTemplate(templateId),
    enabled: Number.isInteger(templateId) && templateId > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['templates'] });

  const publishMutation = useMutation({
    mutationFn: (versionId: number) => templatesApi.publishVersion(templateId, versionId),
    onSuccess: () => {
      toast.success('Versiya nashr qilindi — endi yangi ishlarga biriktiriladi');
      invalidate();
      setPublishTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setPublishTarget(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (versionId: number) => templatesApi.archiveVersion(templateId, versionId),
    onSuccess: () => {
      toast.success('Versiya arxivlandi');
      invalidate();
      setArchiveTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setArchiveTarget(null);
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: () => templatesApi.createVersion(templateId),
    onSuccess: (t) => {
      toast.success('Yangi qoralama versiya yaratildi (bosqichlar nusxalandi)');
      invalidate();
      const draft = t.versions.find((v) => v.status === 'DRAFT');
      if (draft) setSelectedVersionId(draft.id);
    },
    onError: (err) => toast.error(getApiError(err).message),
  });

  const stepMutation = useMutation({
    mutationFn: ({ stepId, action }: { stepId: number; action: 'delete' | 'up' | 'down'; versionId: number }) =>
      action === 'delete'
        ? templatesApi.deleteStep(templateId, selectedVersion!.id, stepId)
        : templatesApi.moveStep(templateId, selectedVersion!.id, stepId, action),
    onSuccess: (_t, vars) => {
      if (vars.action === 'delete') toast.success("Bosqich o'chirildi");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setDeleteTarget(null);
    },
  });

  if (templateQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-7 text-brand-500" />
      </div>
    );
  }

  if (templateQuery.isError || !templateQuery.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">{templateQuery.error ? getApiError(templateQuery.error).message : 'Shablon topilmadi'}</Alert>
        <Link to="/app/admin/templates" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <ArrowLeft className="size-4" />
          Shablonlar
        </Link>
      </div>
    );
  }

  const template = templateQuery.data;
  const selectedVersion =
    template.versions.find((v) => v.id === selectedVersionId) ??
    template.versions.find((v) => v.status === 'DRAFT') ??
    template.versions.find((v) => v.status === 'PUBLISHED') ??
    template.versions[template.versions.length - 1];
  const isDraft = selectedVersion?.status === 'DRAFT';
  const hasDraft = template.versions.some((v) => v.status === 'DRAFT');

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app/admin/templates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
      >
        <ArrowLeft className="size-4" />
        Shablonlar
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">{template.name}</h1>
          {template.description && <p className="mt-1 text-sm text-[var(--text-2)]">{template.description}</p>}
        </div>
        {!hasDraft && (
          <Button variant="secondary" onClick={() => newVersionMutation.mutate()} loading={newVersionMutation.isPending}>
            <Plus className="size-4" />
            Yangi versiya
          </Button>
        )}
      </div>

      {/* Version tabs */}
      <div className="mt-4 flex flex-wrap gap-2">
        {template.versions.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setSelectedVersionId(v.id)}
            className={cn(
              'rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors',
              v.id === selectedVersion?.id
                ? 'border-brand-500 bg-brand-500/10 text-brand-700'
                : 'border-[var(--border-1)] bg-[var(--surface)] text-[var(--text-2)] hover:text-[var(--text-1)]',
            )}
          >
            v{v.version}
            <span className="ml-1.5 text-xs font-medium opacity-80">{VERSION_STATUS_LABELS[v.status]}</span>
          </button>
        ))}
      </div>

      {selectedVersion && (
        <div className="mt-5 rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[var(--text-1)]">
                v{selectedVersion.version} · {VERSION_STATUS_LABELS[selectedVersion.status]}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-2)]">
                {selectedVersion.steps?.length ?? 0} ta bosqich
                {!isDraft && " · o'zgartirib bo'lmaydi (tarixiy ishlar himoyasi)"}
              </p>
            </div>
            <div className="flex gap-2">
              {isDraft && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditStep(null);
                      setStepFormOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Bosqich
                  </Button>
                  <Button onClick={() => setPublishTarget(selectedVersion)}>
                    <Rocket className="size-4" />
                    Nashr qilish
                  </Button>
                </>
              )}
              {selectedVersion.status === 'PUBLISHED' && (
                <Button variant="danger-outline" onClick={() => setArchiveTarget(selectedVersion)}>
                  <Archive className="size-4" />
                  Arxivlash
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(selectedVersion.steps ?? []).length === 0 && (
              <p className="rounded-2xl border border-dashed border-[var(--border-1)] py-8 text-center text-sm text-[var(--text-2)]">
                Bu versiyada hali bosqichlar yo'q
              </p>
            )}

            {(selectedVersion.steps ?? []).map((step, idx, arr) => (
              <div key={step.id} className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-bold text-[var(--text-1)]">
                      {step.sortOrder}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-[var(--text-1)]">
                        {step.name}
                        {step.isStop && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-700">
                            <OctagonAlert className="size-3" />
                            STOP
                          </span>
                        )}
                      </p>
                      {step.description && <p className="mt-0.5 text-sm text-[var(--text-2)]">{step.description}</p>}
                      {step.measurements.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {step.measurements.map((m) => (
                            <span
                              key={m.id}
                              className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--text-2)]"
                            >
                              <Ruler className="size-3" />
                              {m.name}
                              {m.minValue != null || m.maxValue != null
                                ? `: ${m.minValue ?? '−∞'}–${m.maxValue ?? '+∞'} ${m.unit}`
                                : ` (${m.unit})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isDraft && (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="md"
                        disabled={idx === 0 || stepMutation.isPending}
                        onClick={() => stepMutation.mutate({ stepId: step.id, action: 'up', versionId: selectedVersion.id })}
                        aria-label="Yuqoriga"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        disabled={idx === arr.length - 1 || stepMutation.isPending}
                        onClick={() => stepMutation.mutate({ stepId: step.id, action: 'down', versionId: selectedVersion.id })}
                        aria-label="Pastga"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        onClick={() => {
                          setEditStep(step);
                          setStepFormOpen(true);
                        }}
                        aria-label="Tahrirlash"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => setDeleteTarget(step)} aria-label="O'chirish">
                        <Trash2 className="size-4 text-brand-500" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stepFormOpen && selectedVersion && (
        <StepFormModal
          key={editStep?.id ?? 'new'}
          templateId={templateId}
          versionId={selectedVersion.id}
          editStep={editStep}
          onClose={() => {
            setStepFormOpen(false);
            setEditStep(null);
          }}
        />
      )}

      <ConfirmDialog
        open={!!publishTarget}
        title="Versiyani nashr qilish"
        confirmLabel="Nashr qilish"
        loading={publishMutation.isPending}
        onConfirm={() => publishTarget && publishMutation.mutate(publishTarget.id)}
        onCancel={() => setPublishTarget(null)}
      >
        <b>v{publishTarget?.version}</b> nashr qilinadi va yangi ishlarga biriktiriladigan faol versiya bo'ladi. Nashrdan
        so'ng bu versiyani o'zgartirib bo'lmaydi. Avvalgi faol versiya arxivlanadi (eski ishlar o'z versiyasini saqlaydi).
      </ConfirmDialog>

      <ConfirmDialog
        open={!!archiveTarget}
        title="Versiyani arxivlash"
        confirmLabel="Arxivlash"
        danger
        loading={archiveMutation.isPending}
        onConfirm={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}
        onCancel={() => setArchiveTarget(null)}
      >
        <b>v{archiveTarget?.version}</b> arxivlanadi va yangi ishlarga biriktirilmaydi. Mavjud ishlarga ta'sir qilmaydi.
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Bosqichni o'chirish"
        confirmLabel="O'chirish"
        danger
        loading={stepMutation.isPending}
        onConfirm={() =>
          deleteTarget && selectedVersion && stepMutation.mutate({ stepId: deleteTarget.id, action: 'delete', versionId: selectedVersion.id })
        }
        onCancel={() => setDeleteTarget(null)}
      >
        «{deleteTarget?.name}» bosqichi qoralamadan o'chiriladi.
      </ConfirmDialog>
    </div>
  );
}
