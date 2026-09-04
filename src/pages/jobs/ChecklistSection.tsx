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
import { can } from '../../lib/permissions';
import type { Job, JobStep } from '../../types/entities';
import { cn } from '../../lib/utils';

export function ChecklistSection({ job }: { job: Job }) {
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
    return <Alert tone="error">{getApiError(checklistQuery.error).message}</Alert>;
  }

  const checklist = checklistQuery.data;

  if (!checklist) {
    return canExecute && jobWorkable ? (
      <AssignChecklistCard jobId={job.id} />
    ) : (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border-1)] py-10 text-[var(--text-2)]">
        <ClipboardList className="size-7" />
        <p className="text-sm">Checklist hali biriktirilmagan</p>
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
            {checklist.progress.completed} / {checklist.progress.total} bajarildi
          </p>
        </div>
        {checklist.completedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="size-3.5" />
            Checklist yakunlandi
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
          STOP checkpoint yuborildi — Master tasdig'i kutilmoqda. Tasdiqlangunga qadar keyingi bosqichlar yopiq.
        </Alert>
      )}
      {job.status === 'REJECTED' && (
        <Alert tone="error" className="mt-4">
          STOP rad etilgan — jarayon bloklangan. Tuzatishni boshlab, bosqichni qayta bajarib Master tasdig'iga yuboring.
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
          Bosqichlarni bajarish uchun avval ishni boshlang ("Ishni boshlash" tugmasi).
        </Alert>
      )}
    </div>
  );
}

function AssignChecklistCard({ jobId }: { jobId: number }) {
  const queryClient = useQueryClient();
  const [templateId, setTemplateId] = useState('');
  const templatesQuery = useQuery({ queryKey: ['templates', 'assignable'], queryFn: fetchAssignableTemplates });

  const assignMutation = useMutation({
    mutationFn: () => jobsApi.assignChecklist(jobId, Number(templateId)),
    onSuccess: () => {
      toast.success('Checklist biriktirildi');
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId, 'checklist'] });
    },
    onError: (err) => toast.error(getApiError(err).message),
  });

  return (
    <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <p className="font-bold text-[var(--text-1)]">Checklist biriktirish</p>
      <p className="mt-1 text-sm text-[var(--text-2)]">
        Ish uchun tekshiruv ro'yxatini tanlang — joriy faol versiya qo'llanadi va ish davomida o'zgarmaydi.
      </p>

      {templatesQuery.isError && (
        <Alert tone="error" className="mt-3">
          {getApiError(templatesQuery.error).message}
        </Alert>
      )}

      {templatesQuery.data?.length === 0 && (
        <Alert tone="info" className="mt-3">
          Hozircha faol shablonlar yo'q — administrator shablon nashr qilishi kerak.
        </Alert>
      )}

      {(templatesQuery.data?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} aria-label="Shablon tanlash">
            <option value="" disabled>
              Shablonni tanlang
            </option>
            {templatesQuery.data!.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (v{t.version})
              </option>
            ))}
          </Select>
          <Button
            onClick={() => assignMutation.mutate()}
            disabled={templateId === ''}
            loading={assignMutation.isPending}
            className="shrink-0"
          >
            Biriktirish
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
      toast.success(step.isStop ? `"${step.name}" Master tasdig'iga yuborildi` : `"${step.name}" bajarildi`);
      setServerError(null);
      invalidate();
    },
    onError: (err) => {
      const e = getApiError(err);
      setServerError(e.details?.length ? e.details.map((d) => d.message).join(' · ') : e.message);
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
              STOP — Tasdiq kutilmoqda
            </p>
          )}
          {step.status === 'APPROVED' && (
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
              <ShieldCheck className="size-3" />
              STOP tasdiqlangan{step.stopApproval?.decidedByName ? ` — ${step.stopApproval.decidedByName}` : ''}
            </p>
          )}
          {rejected && (
            <div className="mt-1 space-y-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                <X className="size-3" />
                STOP rad etilgan{step.stopApproval?.decidedByName ? ` — ${step.stopApproval.decidedByName}` : ''}
                {step.stopApproval && step.stopApproval.attempt > 1 ? ` (${step.stopApproval.attempt}-urinish)` : ''}
              </p>
              {step.stopApproval?.rejectReason && (
                <p className="text-sm font-medium text-brand-700">Sabab: {step.stopApproval.rejectReason}</p>
              )}
            </div>
          )}

          {step.description && <p className="mt-0.5 text-sm text-[var(--text-2)]">{step.description}</p>}
          {step.requirements && step.isCurrent && step.status === 'PENDING' && (
            <p className="mt-1 text-sm text-[var(--text-2)]">Talablar: {step.requirements}</p>
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
                        (norma: {m.minValue ?? '−∞'}–{m.maxValue ?? '+∞'} {m.unit})
                      </span>
                    ) : null}
                  </p>
                ))}
              {step.note && <p>Izoh: {step.note}</p>}
              <p className="text-xs">
                {step.completedByName} · {step.completedAt ? new Date(step.completedAt).toLocaleString('uz-UZ') : ''}
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
                  Bu STOP checkpoint: bajarilgach Master tasdig'iga yuboriladi va tasdiqlanmaguncha keyingi bosqichlar
                  ochilmaydi.
                </Alert>
              )}

              {step.photoProgress.need > 0 && <PhotoUploader job={job} step={step} onUploaded={invalidate} />}

              {step.measurements.map((m) => (
                <Input
                  key={m.id}
                  label={`${m.name}${m.required ? '' : ' (ixtiyoriy)'} — ${
                    m.minValue != null || m.maxValue != null
                      ? `norma: ${m.minValue ?? '−∞'}–${m.maxValue ?? '+∞'} ${m.unit}`
                      : m.unit
                  }`}
                  inputMode="decimal"
                  placeholder={m.expectedValue != null ? String(m.expectedValue) : '0.0'}
                  rightSlot={<span className="text-sm font-semibold text-[var(--text-2)]">{m.unit}</span>}
                  {...register(`values.${m.id}`)}
                />
              ))}

              <Input label="Izoh (ixtiyoriy)" placeholder="Qo'shimcha izoh" {...register('note')} />

              {step.photoProgress.need > 0 && step.photoProgress.have < step.photoProgress.need && (
                <Alert tone="info">
                  Bosqichni yakunlash uchun yana {step.photoProgress.need - step.photoProgress.have} ta rasm yuklash
                  kerak ({step.photoProgress.have}/{step.photoProgress.need}).
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
                {step.isStop ? "Master tasdig'iga yuborish" : 'Bajarildi deb belgilash'}
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
  const attempts = [...new Set(step.photos.map((p) => p.attempt))].sort((a, b) => a - b);
  const showAttemptLabels = attempts.length > 1 || (attempts[0] ?? 1) > 1;

  return (
    <div className="mt-3 space-y-2">
      {attempts.map((attempt) => (
        <div key={attempt}>
          {showAttemptLabels && (
            <p className="mb-1 text-xs font-semibold text-[var(--text-2)]">{attempt}-urinish rasmlari</p>
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
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => jobsApi.uploadStepPhoto(job.id, step.id, file),
    onSuccess: () => {
      // Success only after the server confirms READY (201) — a stored, verified object.
      toast.success('Rasm yuklandi');
      onUploaded();
    },
    onError: (err) => {
      const { message, retryable } = getUploadError(err);
      toast.error(message, retryable ? { description: "Fayl saqlanmadi — qaytadan yuborishingiz mumkin." } : undefined);
    },
  });

  const enough = step.photoProgress.have >= step.photoProgress.need;

  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
          <Camera className="size-4.5" />
          Kerakli rasmlar: {step.photoProgress.have}/{step.photoProgress.need}
          {enough && <Check className="size-4 text-emerald-600" strokeWidth={3} />}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          loading={uploadMutation.isPending}
        >
          <Camera className="size-4" />
          Rasm yuklash
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
      <p className="mt-1.5 text-xs text-[var(--text-2)]">
        JPEG/PNG/WebP, maksimum 10 MB. Rasmlar dalil sifatida saqlanadi va o'chirilmaydi.
      </p>
    </div>
  );
}

/** §24: during a reopened cycle a done step may be redone as a new attempt. */
function RedoButton({ job, step, onStarted }: { job: Job; step: JobStep; onStarted: () => void }) {
  const { user: actor } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const redoMutation = useMutation({
    mutationFn: () => jobsApi.redoStep(job.id, step.id),
    onSuccess: () => {
      toast.success(`"${step.name}" tuzatish uchun qayta ochildi`);
      onStarted();
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setConfirmOpen(false);
    },
  });

  if (!can(actor, 'checklist.execute')) return null;

  return (
    <div className="mt-2">
      <Button variant="secondary" size="md" onClick={() => setConfirmOpen(true)}>
        <Wrench className="size-4" />
        Qayta bajarish
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="Bosqichni qayta bajarish"
        confirmLabel="Qayta ochish"
        loading={redoMutation.isPending}
        onConfirm={() => redoMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        «{step.name}» yangi urinish sifatida qayta ochiladi: yangi o'lchov va rasmlar talab qilinadi
        {step.isStop ? ", STOP bo'lgani uchun yana Master tasdig'i kerak bo'ladi" : ''}. Avvalgi natijalar tarixda
        saqlanadi.
      </ConfirmDialog>
    </div>
  );
}

/** §3: technician re-opens a rejected STOP step for correction. */
function ReworkButton({ job, step, onStarted }: { job: Job; step: JobStep; onStarted: () => void }) {
  const { user: actor } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const reworkMutation = useMutation({
    mutationFn: () => jobsApi.reworkStop(job.id),
    onSuccess: () => {
      toast.success('Tuzatish boshlandi — bosqichni qayta bajaring');
      onStarted();
      setConfirmOpen(false);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setConfirmOpen(false);
    },
  });

  if (!can(actor, 'checklist.execute')) return null;

  return (
    <div className="mt-3">
      <Button size="lg" onClick={() => setConfirmOpen(true)} className="w-full sm:w-auto">
        <Wrench className="size-5" />
        Tuzatishni boshlash
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="Tuzatishni boshlash"
        confirmLabel="Boshlash"
        loading={reworkMutation.isPending}
        onConfirm={() => reworkMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        «{step.name}» bosqichi qayta ochiladi: ishni tuzatib, yangi rasmlar bilan qayta yuborasiz. Yangi yuborish ham
        Master tasdig'ini talab qiladi. Avvalgi urinish natijalari tarixda saqlanib qoladi.
      </ConfirmDialog>
    </div>
  );
}

function StopDecisionPanel({ job, step, onDecided }: { job: Job; step: JobStep; onDecided: () => void }) {
  const { user: actor } = useAuth();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => jobsApi.approveStop(job.id),
    onSuccess: () => {
      toast.success('STOP tasdiqlandi — ish davom etishi mumkin');
      onDecided();
      setApproveOpen(false);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setApproveOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => jobsApi.rejectStop(job.id, rejectReason.trim()),
    onSuccess: () => {
      toast.success('STOP rad etildi');
      onDecided();
      setRejectOpen(false);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setRejectOpen(false);
    },
  });

  if (!can(actor, 'stops.approve')) {
    return (
      <p className="mt-3 text-sm text-[var(--text-2)]">
        Master tasdig'i talab qilinadi — {step.stopApproval?.submittedByName ?? 'usta'} tomonidan yuborilgan.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-amber-500/30 bg-[var(--surface)] p-4">
      <p className="font-semibold text-[var(--text-1)]">Master qarori talab qilinadi</p>
      <p className="mt-0.5 text-sm text-[var(--text-2)]">
        {job.plateNumber} · {step.stopApproval?.submittedByName} yubordi
        {step.stopApproval?.submittedAt ? ` · ${new Date(step.stopApproval.submittedAt).toLocaleString('uz-UZ')}` : ''}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button size="lg" onClick={() => setApproveOpen(true)} className="flex-1">
          <ShieldCheck className="size-5" />
          STOPni tasdiqlash
        </Button>
        <Button size="lg" variant="danger-outline" onClick={() => setRejectOpen(true)} className="flex-1">
          <X className="size-5" strokeWidth={3} />
          Rad etish
        </Button>
      </div>

      <ConfirmDialog
        open={approveOpen}
        title="STOPni tasdiqlash"
        confirmLabel="Tasdiqlash"
        loading={approveMutation.isPending}
        onConfirm={() => approveMutation.mutate()}
        onCancel={() => setApproveOpen(false)}
      >
        «{step.name}» STOP checkpointi tasdiqlanadi va ish davom etishi mumkin bo'ladi. Qaror audit jurnaliga yoziladi.
      </ConfirmDialog>

      <Modal
        open={rejectOpen}
        onClose={rejectMutation.isPending ? () => {} : () => setRejectOpen(false)}
        title="STOPni rad etish"
        className="sm:max-w-md"
      >
        <p className="text-sm text-[var(--text-2)]">
          «{step.name}» rad etiladi: ish <b className="text-brand-600">Rad etilgan</b> holatiga o'tadi va jarayon
          bloklanadi. Sabab majburiy.
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Rad etish sababi (majburiy)</span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Masalan: ish bosimi talabga mos emas, qayta sozlash kerak"
            className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25"
          />
        </label>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setRejectOpen(false)} disabled={rejectMutation.isPending}>
            Ortga
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => rejectMutation.mutate()}
            loading={rejectMutation.isPending}
            disabled={rejectReason.trim().length < 3}
          >
            Rad etishni tasdiqlash
          </Button>
        </div>
      </Modal>
    </div>
  );
}
