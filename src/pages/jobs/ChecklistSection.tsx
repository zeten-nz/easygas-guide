import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRef } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  Hourglass,
  Lock,
  OctagonAlert,
  Ruler,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../features/auth/auth-context';
import * as jobsApi from '../../api/jobs.api';
import { fetchAssignableTemplates } from '../../api/templates.api';
import { getApiError, getUploadError } from '../../api/client';
import { useT, useDateTime } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { can } from '../../lib/permissions';
import type { Job, JobStep } from '../../types/entities';
import { cn } from '../../lib/utils';

export function ChecklistSection({ job }: { job: Job }) {
  const t = useT();
  const { user: actor } = useAuth();
  const canExecute = can(actor, 'checklist.execute');
  const jobWorkable = job.status === 'DRAFT' || job.status === 'IN_PROGRESS';

  const checklistQuery = useQuery({
    queryKey: ['jobs', 'detail', job.id, 'checklist'],
    queryFn: () => jobsApi.fetchJobChecklist(job.id),
  });

  if (checklistQuery.isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="size-6 text-brand-500" />
      </div>
    );
  }

  if (checklistQuery.isError) {
    return <Alert tone="error">{localizeApiError(getApiError(checklistQuery.error).code, t)}</Alert>;
  }

  const checklist = checklistQuery.data;

  if (!checklist) {
    return canExecute && jobWorkable ? (
      <AssignChecklistCard jobId={job.id} />
    ) : (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border-1)] py-10 text-[var(--text-2)]">
        <ClipboardList className="size-7" />
        <p className="text-sm">{t('jb.checklist.notAssigned')}</p>
      </div>
    );
  }

  const pct = checklist.progress.total > 0 ? Math.round((checklist.progress.completed / checklist.progress.total) * 100) : 0;

  return (
    <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-bold text-[var(--text-1)]">
            {checklist.templateName}
            <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-2)]">
              v{checklist.version}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-[var(--text-2)]">
            {t('jb.checklist.progressDone', { completed: checklist.progress.completed, total: checklist.progress.total })}
          </p>
        </div>
        {checklist.completedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            {t('jb.checklist.finished')}
          </span>
        )}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className={cn('h-full rounded-full transition-all', checklist.completedAt ? 'bg-emerald-500' : 'bg-brand-500')}
          style={{ width: `${pct}%` }}
        />
      </div>

      {job.status === 'WAITING_STOP_APPROVAL' && (
        <Alert tone="info" className="mt-4">
          {t('jb.checklist.stopSubmittedInfo')}
        </Alert>
      )}
      {job.status === 'REJECTED' && (
        <Alert tone="error" className="mt-4">
          {t('jb.checklist.stopRejectedInfo')}
        </Alert>
      )}

      <div className="mt-4 space-y-2.5">
        {checklist.steps.map((step) => (
          <StepCard
            key={step.templateStepId}
            job={job}
            step={step}
            interactive={
              canExecute &&
              step.isCurrent &&
              step.status === 'PENDING' &&
              (job.status === 'IN_PROGRESS' || job.status === 'REOPENED')
            }
          />
        ))}
      </div>

      {canExecute && checklist.currentStepId !== null && job.status === 'DRAFT' && (
        <Alert tone="info" className="mt-4">
          {t('jb.checklist.startFirst')}
        </Alert>
      )}
    </div>
  );
}

function AssignChecklistCard({ jobId }: { jobId: number }) {
  const t = useT();
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState('');
  const templatesQuery = useQuery({ queryKey: ['templates', 'assignable'], queryFn: fetchAssignableTemplates });

  const assignMutation = useMutation({
    mutationFn: () => jobsApi.assignChecklist(jobId, Number(templateId)),
    onSuccess: () => {
      toast.success(t('jb.assign.assignedToast'));
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId, 'checklist'] });
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <p className="font-bold text-[var(--text-1)]">{t('jb.assign.title')}</p>
      <p className="mt-1 text-sm text-[var(--text-2)]">{t('jb.assign.desc')}</p>

      {templatesQuery.isError && (
        <Alert tone="error" className="mt-3">
          {localizeApiError(getApiError(templatesQuery.error).code, t)}
        </Alert>
      )}

      {templatesQuery.data?.length === 0 && (
        <Alert tone="info" className="mt-3">
          {t('jb.assign.noTemplates')}
        </Alert>
      )}

      {(templatesQuery.data?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label={t('jb.assign.selectAria')}>
            <option value="" disabled>
              {t('jb.assign.selectPlaceholder')}
            </option>
            {templatesQuery.data!.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} (v{tpl.version})
              </option>
            ))}
          </Select>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={templateId === ''}
            loading={assignMutation.isPending}
            className="shrink-0"
          >
            {t('jb.assign.submit')}
          </Button>
        </div>
      )}
    </div>
  );
}

interface MeasurementFormValues {
  note: string;
  values: Record<string, string>;
}

function StepCard({ job, step, interactive }: { job: Job; step: JobStep; interactive: boolean }) {
  const t = useT();
  const fmtDt = useDateTime();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit } = useForm<MeasurementFormValues>({
    defaultValues: { note: '', values: {} },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  const completeMutation = useMutation({
    mutationFn: (v: MeasurementFormValues) =>
      jobsApi.completeStep(job.id, step.id, {
        note: v.note.trim() || null,
        measurements: step.measurements
          .filter((m) => (v.values[String(m.id)] ?? '').trim() !== '')
          .map((m) => ({ measurementId: m.id, value: Number(v.values[String(m.id)]) })),
      }),
    onSuccess: () => {
      toast.success(
        step.isStop
          ? t('jb.step.sentToMasterToast', { name: step.name })
          : t('jb.step.doneToast', { name: step.name }),
      );
      setServerError(null);
      invalidate();
    },
    onError: (err) => {
      const e = getApiError(err);
      setServerError(e.details?.length ? e.details.map((d) => d.message).join(' · ') : localizeApiError(e.code, t));
    },
  });

  const done = step.status === 'COMPLETED' || step.status === 'APPROVED';
  const waiting = step.status === 'WAITING_APPROVAL';
  const rejected = step.status === 'REJECTED';
  const hasResult = done || waiting || rejected;

  return (
    <div
      className={cn(
        'rounded-2xl border p-4 transition-colors',
        done && 'border-emerald-500/30 bg-emerald-500/5',
        waiting && 'border-amber-500/50 bg-amber-500/5',
        rejected && 'border-brand-500/50 bg-brand-500/5',
        step.isCurrent && step.status === 'PENDING' && 'border-brand-500/50 bg-[var(--surface)] shadow-[0_0_0_3px_rgba(228,35,43,0.08)]',
        !hasResult && !step.isCurrent && 'border-[var(--border-1)] bg-[var(--surface-2)]/50 opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            step.status === 'COMPLETED' && 'bg-emerald-500 text-white',
            step.status === 'APPROVED' && 'bg-emerald-600 text-white',
            waiting && 'bg-amber-500 text-white',
            rejected && 'bg-brand-500 text-white',
            step.isCurrent && step.status === 'PENDING' && 'bg-brand-500 text-white',
            step.status === 'PENDING' && !step.isCurrent && 'bg-[var(--surface)] text-[var(--text-2)]',
          )}
        >
          {step.status === 'COMPLETED' && <Check className="size-4.5" strokeWidth={3} />}
          {step.status === 'APPROVED' && <ShieldCheck className="size-4.5" />}
          {waiting && <Hourglass className="size-4" />}
          {rejected && <X className="size-4.5" strokeWidth={3} />}
          {step.status === 'PENDING' && step.sortOrder}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-[var(--text-1)]">
            {step.name}
            {step.isStop && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-700">
                <OctagonAlert className="size-3" />
                STOP
              </span>
            )}
            {step.status === 'PENDING' && !step.isCurrent && <Lock className="size-3.5 text-[var(--text-2)]" />}
          </p>

          {/* Status labels — never color alone */}
          {waiting && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              <Hourglass className="size-3" />
              {t('jb.step.waitingApproval')}
            </p>
          )}
          {step.status === 'APPROVED' && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="size-3" />
              {t('jb.step.stopApproved')}{step.stopApproval?.decidedByName ? ` — ${step.stopApproval.decidedByName}` : ''}
            </p>
          )}
          {rejected && (
            <div className="mt-1 space-y-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                <X className="size-3" />
                {t('jb.step.stopRejected')}{step.stopApproval?.decidedByName ? ` — ${step.stopApproval.decidedByName}` : ''}
                {step.stopApproval && step.stopApproval.attempt > 1
                  ? ` (${t('jb.step.attemptN', { n: step.stopApproval.attempt })})`
                  : ''}
              </p>
              {step.stopApproval?.rejectReason && (
                <p className="text-sm font-medium text-brand-700">
                  {t('jb.reasonLine', { reason: step.stopApproval.rejectReason })}
                </p>
              )}
            </div>
          )}

          {step.description && <p className="mt-0.5 text-sm text-[var(--text-2)]">{step.description}</p>}
          {step.requirements && step.isCurrent && step.status === 'PENDING' && (
            <p className="mt-1 text-sm text-[var(--text-2)]">{t('jb.step.requirements', { req: step.requirements })}</p>
          )}

          {/* Submitted result (kept for waiting/approved/rejected/completed) */}
          {hasResult && (
            <div className="mt-2 space-y-1 text-sm text-[var(--text-2)]">
              {step.measurements
                .filter((m) => m.submittedValue !== null)
                .map((m) => (
                  <p key={m.id} className="flex items-center gap-1.5">
                    <Ruler className="size-3.5" />
                    {m.name}: <b className="text-[var(--text-1)]">{m.submittedValue} {m.unit}</b>
                    {m.minValue != null || m.maxValue != null ? (
                      <span className="text-xs">
                        {t('jb.step.normParen', { min: m.minValue ?? '−∞', max: m.maxValue ?? '+∞', unit: m.unit })}
                      </span>
                    ) : null}
                  </p>
                ))}
              {step.note && <p>{t('jb.step.noteLine', { note: step.note })}</p>}
              <p className="text-xs">
                {step.completedByName} · {step.completedAt ? fmtDt(step.completedAt) : ''}
              </p>
            </div>
          )}

          {/* Evidence photos (all attempts, immutable) */}
          {step.photos.length > 0 && <PhotoGallery job={job} step={step} />}

          {/* §3 correction: re-open a rejected STOP step */}
          {rejected && job.status === 'REJECTED' && <ReworkButton job={job} step={step} onStarted={invalidate} />}

          {/* §24 correction: redo a done step during a reopened cycle */}
          {done && job.status === 'REOPENED' && <RedoButton job={job} step={step} onStarted={invalidate} />}

          {/* Master decision panel */}
          {waiting && <StopDecisionPanel job={job} step={step} onDecided={invalidate} />}

          {/* Interactive current-step form */}
          {interactive && (
            <form onSubmit={handleSubmit((v) => completeMutation.mutate(v))} noValidate className="mt-3 space-y-3">
              {serverError && <Alert tone="error">{serverError}</Alert>}

              {step.isStop && (
                <Alert tone="info">
                  {t('jb.step.stopInfo')}
                </Alert>
              )}

              {step.photoProgress.need > 0 && <PhotoUploader job={job} step={step} onUploaded={invalidate} />}

              {step.measurements.map((m) => (
                <Input
                  key={m.id}
                  label={`${m.name}${m.required ? '' : ` ${t('jb.optionalSuffix')}`} — ${
                    m.minValue != null || m.maxValue != null
                      ? t('jb.step.normRange', { min: m.minValue ?? '−∞', max: m.maxValue ?? '+∞', unit: m.unit })
                      : m.unit
                  }`}
                  inputMode="decimal"
                  placeholder={m.expectedValue != null ? String(m.expectedValue) : '0.0'}
                  rightSlot={<span className="text-sm font-semibold text-[var(--text-2)]">{m.unit}</span>}
                  {...register(`values.${m.id}`)}
                />
              ))}

              <Input label={t('jb.noteOptional')} placeholder={t('jb.step.notePlaceholder')} {...register('note')} />

              {step.photoProgress.need > 0 && step.photoProgress.have < step.photoProgress.need && (
                <Alert tone="info">
                  {t('jb.step.morePhotos', {
                    n: step.photoProgress.need - step.photoProgress.have,
                    have: step.photoProgress.have,
                    need: step.photoProgress.need,
                  })}
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                loading={completeMutation.isPending}
                disabled={step.photoProgress.need > 0 && step.photoProgress.have < step.photoProgress.need}
                className="w-full"
              >
                {step.isStop ? <OctagonAlert className="size-5" /> : <Check className="size-5" strokeWidth={3} />}
                {step.isStop ? t('jb.step.sendToMaster') : t('jb.step.markDone')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/** Evidence gallery — photos of every attempt, labeled when reworks happened. */
function PhotoGallery({ job, step }: { job: Job; step: JobStep }) {
  const t = useT();
  const attempts = [...new Set(step.photos.map((p) => p.attempt))].sort((a, b) => a - b);
  const showAttemptLabels = attempts.length > 1 || (attempts[0] ?? 1) > 1;

  return (
    <div className="mt-3 space-y-2">
      {attempts.map((attempt) => (
        <div key={attempt}>
          {showAttemptLabels && (
            <p className="mb-1 text-xs font-semibold text-[var(--text-2)]">{t('jb.photo.attemptPhotos', { n: attempt })}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {step.photos
              .filter((p) => p.attempt === attempt)
              .map((p) => (
                <a
                  key={p.id}
                  href={jobsApi.stepPhotoUrl(job.id, step.id, p.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block overflow-hidden rounded-xl border border-[var(--border-1)]"
                  title={`${p.originalName} · ${p.uploadedByName}`}
                >
                  <img
                    src={jobsApi.stepPhotoUrl(job.id, step.id, p.id)}
                    alt={p.originalName}
                    loading="lazy"
                    className="size-20 object-cover transition-transform group-hover:scale-105"
                  />
                </a>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Camera-first uploader with live "Kerakli rasmlar: X/Y" progress. */
function PhotoUploader({ job, step, onUploaded }: { job: Job; step: JobStep; onUploaded: () => void }) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => jobsApi.uploadStepPhoto(job.id, step.id, file),
    onSuccess: () => {
      // Success only after the server confirms READY (201) — a stored, verified object.
      toast.success(t('jb.upload.successToast'));
      onUploaded();
    },
    onError: (err) => {
      const { message, retryable } = getUploadError(err);
      toast.error(message, retryable ? { description: t('jb.upload.retryDesc') } : undefined);
    },
  });

  const enough = step.photoProgress.have >= step.photoProgress.need;

  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
          <Camera className="size-4.5" />
          {t('jb.upload.needed', { have: step.photoProgress.have, need: step.photoProgress.need })}
          {enough && <Check className="size-4 text-emerald-600" strokeWidth={3} />}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          loading={uploadMutation.isPending}
        >
          <Camera className="size-4" />
          {t('jb.upload.button')}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadMutation.mutate(file);
          e.target.value = '';
        }}
      />
      <p className="mt-1.5 text-xs text-[var(--text-2)]">{t('jb.upload.hint')}</p>
    </div>
  );
}

/** §24: during a reopened cycle a done step may be redone as a new attempt. */
function RedoButton({ job, step, onStarted }: { job: Job; step: JobStep; onStarted: () => void }) {
  const t = useT();
  const { user: actor } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const redoMutation = useMutation({
    mutationFn: () => jobsApi.redoStep(job.id, step.id),
    onSuccess: () => {
      toast.success(t('jb.redo.reopenedToast', { name: step.name }));
      onStarted();
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setConfirmOpen(false);
    },
  });

  if (!can(actor, 'checklist.execute')) return null;

  return (
    <div className="mt-2">
      <Button variant="secondary" size="md" onClick={() => setConfirmOpen(true)}>
        <Wrench className="size-4" />
        {t('jb.redo.button')}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title={t('jb.redo.title')}
        confirmLabel={t('jb.redo.confirm')}
        loading={redoMutation.isPending}
        onConfirm={() => redoMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        {t('jb.redo.body', { name: step.name, stop: step.isStop ? t('jb.redo.stopClause') : '' })}
      </ConfirmDialog>
    </div>
  );
}

/** §3: technician re-opens a rejected STOP step for correction. */
function ReworkButton({ job, step, onStarted }: { job: Job; step: JobStep; onStarted: () => void }) {
  const t = useT();
  const { user: actor } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const reworkMutation = useMutation({
    mutationFn: () => jobsApi.reworkStop(job.id),
    onSuccess: () => {
      toast.success(t('jb.rework.startedToast'));
      onStarted();
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setConfirmOpen(false);
    },
  });

  if (!can(actor, 'checklist.execute')) return null;

  return (
    <div className="mt-3">
      <Button size="lg" onClick={() => setConfirmOpen(true)} className="w-full sm:w-auto">
        <Wrench className="size-5" />
        {t('jb.rework.start')}
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title={t('jb.rework.start')}
        confirmLabel={t('jb.rework.confirm')}
        loading={reworkMutation.isPending}
        onConfirm={() => reworkMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        {t('jb.rework.body', { name: step.name })}
      </ConfirmDialog>
    </div>
  );
}

function StopDecisionPanel({ job, step, onDecided }: { job: Job; step: JobStep; onDecided: () => void }) {
  const t = useT();
  const fmtDt = useDateTime();
  const { user: actor } = useAuth();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => jobsApi.approveStop(job.id),
    onSuccess: () => {
      toast.success(t('jb.stop.approvedToast'));
      onDecided();
      setApproveOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setApproveOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => jobsApi.rejectStop(job.id, rejectReason.trim()),
    onSuccess: () => {
      toast.success(t('jb.stop.rejectedToast'));
      onDecided();
      setRejectOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setRejectOpen(false);
    },
  });

  if (!can(actor, 'stops.approve')) {
    return (
      <p className="mt-3 text-sm text-[var(--text-2)]">
        {t('jb.stop.masterRequired', { name: step.stopApproval?.submittedByName ?? t('jb.stop.tech') })}
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/30 bg-[var(--surface)] p-4">
      <p className="font-semibold text-[var(--text-1)]">{t('jb.stop.decisionRequired')}</p>
      <p className="mt-0.5 text-sm text-[var(--text-2)]">
        {t('jb.stop.submittedBy', { plate: job.plateNumber, name: step.stopApproval?.submittedByName ?? '' })}
        {step.stopApproval?.submittedAt ? ` · ${fmtDt(step.stopApproval.submittedAt)}` : ''}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={() => setApproveOpen(true)} className="flex-1">
          <ShieldCheck className="size-5" />
          {t('jb.stop.approveButton')}
        </Button>
        <Button size="lg" variant="danger-outline" onClick={() => setRejectOpen(true)} className="flex-1">
          <X className="size-5" strokeWidth={3} />
          {t('jb.stop.rejectButton')}
        </Button>
      </div>

      <ConfirmDialog
        open={approveOpen}
        title={t('jb.stop.approveButton')}
        confirmLabel={t('common.confirm')}
        loading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate()}
        onCancel={() => setApproveOpen(false)}
      >
        {t('jb.stop.approveBody', { name: step.name })}
      </ConfirmDialog>

      <Modal
        open={rejectOpen}
        onClose={rejectMutation.isPending ? () => {} : () => setRejectOpen(false)}
        title={t('jb.stop.rejectTitle')}
        className="sm:max-w-md"
      >
        <p className="text-sm text-[var(--text-2)]">
          {t('jb.stop.rejectBodyBefore', { name: step.name })}
          <b className="text-brand-600">{t('jb.stop.rejectedState')}</b>
          {t('jb.stop.rejectBodyAfter')}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.stop.rejectReasonLabel')}</span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t('jb.stop.rejectReasonPlaceholder')}
            className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25"
          />
        </label>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={rejectMutation.isPending}>
            {t('jb.stop.back')}
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => rejectMutation.mutate()}
            loading={rejectMutation.isPending}
            disabled={rejectReason.trim().length < 3}
          >
            {t('jb.stop.rejectConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
