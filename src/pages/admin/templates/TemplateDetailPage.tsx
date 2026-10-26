import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { DeleteTemplateDialog } from './DeleteTemplateDialog';
import { statusLabel } from './template-lifecycle';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import { useT } from '../../../i18n/i18n';
import { localizeApiError } from '../../../i18n/api-errors';
import { type TemplateStep, type TemplateVersion } from '../../../types/entities';
import { cn } from '../../../lib/utils';

export function TemplateDetailPage() {
  const t = useT();
  const { id } = useParams();
  const templateId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(null);
  const [stepFormOpen, setStepFormOpen] = useState(false);
  const [editStep, setEditStep] = useState<TemplateStep | null>(null);
  const [publishTarget, setPublishTarget] = useState<TemplateVersion | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<TemplateVersion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateStep | null>(null);
  const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false);

  const templateQuery = useQuery({
    queryKey: ['templates', 'detail', templateId],
    queryFn: () => templatesApi.fetchTemplate(templateId),
    enabled: Number.isInteger(templateId) && templateId > 0,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['templates'] });

  const publishMutation = useMutation({
    mutationFn: (versionId: number) => templatesApi.publishVersion(templateId, versionId),
    onSuccess: () => {
      toast.success(t('tpl.toast.published'));
      invalidate();
      setPublishTarget(null);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setPublishTarget(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (versionId: number) => templatesApi.archiveVersion(templateId, versionId),
    onSuccess: () => {
      toast.success(t('tpl.toast.archived'));
      invalidate();
      setArchiveTarget(null);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setArchiveTarget(null);
    },
  });

  const newVersionMutation = useMutation({
    mutationFn: () => templatesApi.createVersion(templateId),
    onSuccess: (created) => {
      toast.success(t('tpl.toast.versionCreated'));
      invalidate();
      const draft = created.versions.find((v) => v.status === 'DRAFT');
      if (draft) setSelectedVersionId(draft.id);
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  const stepMutation = useMutation({
    mutationFn: ({ stepId, action }: { stepId: number; action: 'delete' | 'up' | 'down'; versionId: number }) =>
      action === 'delete'
        ? templatesApi.deleteStep(templateId, selectedVersion!.id, stepId)
        : templatesApi.moveStep(templateId, selectedVersion!.id, stepId, action),
    onSuccess: (_t, vars) => {
      if (vars.action === 'delete') toast.success(t('tpl.toast.stepDeleted'));
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
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
        <Alert tone="error">
          {templateQuery.error ? localizeApiError(getApiError(templateQuery.error).code, t) : t('tpl.notFound')}
        </Alert>
        <Link to="/app/admin/templates" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <ArrowLeft className="size-4" />
          {t('tpl.templates')}
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
        {t('tpl.templates')}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">{template.name}</h1>
          {template.description && <p className="mt-1 text-sm text-[var(--text-2)]">{template.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {!hasDraft && (
            <Button variant="secondary" onClick={() => newVersionMutation.mutate()} loading={newVersionMutation.isPending}>
              <Plus className="size-4" />
              {t('tpl.newVersion')}
            </Button>
          )}
          {/* §D whole-template delete — only for an unused draft-only template. When
              a version has been published the template carries history: archive it. */}
          {template.deletable && (
            <Button variant="danger-outline" onClick={() => setDeleteTemplateOpen(true)}>
              <Trash2 className="size-4" />
              {t('tpl.deleteTemplate')}
            </Button>
          )}
        </div>
      </div>

      {!template.deletable && (
        <p className="mt-2 text-[13px] text-[var(--text-3)]">{t('tpl.detail.notDeletableNote')}</p>
      )}

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
            <span className="ml-1.5 text-xs font-medium opacity-80">{statusLabel(v.status, t)}</span>
          </button>
        ))}
      </div>

      {selectedVersion && (
        <div className="mt-5 rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-[var(--text-1)]">
                v{selectedVersion.version} · {statusLabel(selectedVersion.status, t)}
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-2)]">
                {t('tpl.detail.stepCount', { n: selectedVersion.steps?.length ?? 0 })}
                {!isDraft && t('tpl.detail.readonlySuffix')}
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
                    {t('tpl.step.add')}
                  </Button>
                  <Button onClick={() => setPublishTarget(selectedVersion)}>
                    <Rocket className="size-4" />
                    {t('tpl.action.publish')}
                  </Button>
                </>
              )}
              {selectedVersion.status === 'PUBLISHED' && (
                <Button variant="danger-outline" onClick={() => setArchiveTarget(selectedVersion)}>
                  <Archive className="size-4" />
                  {t('tpl.action.archive')}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {(selectedVersion.steps ?? []).length === 0 && (
              <p className="rounded-2xl border border-dashed border-[var(--border-1)] py-8 text-center text-sm text-[var(--text-2)]">
                {t('tpl.detail.noSteps')}
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
                        aria-label={t('tpl.aria.moveUp')}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        disabled={idx === arr.length - 1 || stepMutation.isPending}
                        onClick={() => stepMutation.mutate({ stepId: step.id, action: 'down', versionId: selectedVersion.id })}
                        aria-label={t('tpl.aria.moveDown')}
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
                        aria-label={t('tpl.aria.edit')}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="md" onClick={() => setDeleteTarget(step)} aria-label={t('tpl.action.delete')}>
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
        title={t('tpl.publish.title')}
        confirmLabel={t('tpl.action.publish')}
        loading={publishMutation.isPending}
        onConfirm={() => publishTarget && publishMutation.mutate(publishTarget.id)}
        onCancel={() => setPublishTarget(null)}
      >
        <b>v{publishTarget?.version}</b> {t('tpl.publish.body')}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!archiveTarget}
        title={t('tpl.archive.title')}
        confirmLabel={t('tpl.action.archive')}
        danger
        loading={archiveMutation.isPending}
        onConfirm={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}
        onCancel={() => setArchiveTarget(null)}
      >
        <b>v{archiveTarget?.version}</b> {t('tpl.archive.body')}
      </ConfirmDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('tpl.deleteStep.title')}
        confirmLabel={t('tpl.action.delete')}
        danger
        loading={stepMutation.isPending}
        onConfirm={() =>
          deleteTarget && selectedVersion && stepMutation.mutate({ stepId: deleteTarget.id, action: 'delete', versionId: selectedVersion.id })
        }
        onCancel={() => setDeleteTarget(null)}
      >
        {t('tpl.deleteStep.body', { name: deleteTarget?.name ?? '' })}
      </ConfirmDialog>

      {deleteTemplateOpen && (
        <DeleteTemplateDialog
          template={template}
          onClose={() => setDeleteTemplateOpen(false)}
          onDeleted={() => navigate('/app/admin/templates')}
        />
      )}
    </div>
  );
}
