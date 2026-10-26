import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, CheckCircle2, Eraser, FileLock2, Flag, Fingerprint, PenLine, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { SignableSummaryCard } from './SignableSummaryCard';
import { useAuth } from '../../features/auth/auth-context';
import * as jobsApi from '../../api/jobs.api';
import * as safety from '../../api/safety.api';
import { getApiError, getUploadError } from '../../api/client';
import { useT, useDateTime } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { can } from '../../lib/permissions';
import { isReSignRequired } from '../../features/safety/completion-blockers';
import type { Job } from '../../types/entities';
import type { MessageKey } from '../../i18n/types';
import { cn } from '../../lib/utils';

const CONDITION_LABELS: { key: keyof jobsApi.CompletionInfo['readiness']['conditions']; labelKey: MessageKey }[] = [
  { key: 'checklist', labelKey: 'jb.cond.checklist' },
  { key: 'stops', labelKey: 'jb.cond.stops' },
  { key: 'measurements', labelKey: 'jb.cond.measurements' },
  { key: 'photos', labelKey: 'jb.cond.photos' },
  { key: 'risks', labelKey: 'jb.cond.risks' },
  { key: 'signature', labelKey: 'jb.cond.signature' },
];

/** §22–23 completion workspace: readiness, signable summary, signature, close. */
export function CompletionSection({ job }: { job: Job }) {
  const t = useT();
  const fmtDt = useDateTime();
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  const completionQuery = useQuery({
    queryKey: ['jobs', 'detail', job.id, 'completion'],
    queryFn: () => jobsApi.fetchCompletion(job.id),
    enabled: ['IN_PROGRESS', 'COMPLETED', 'REOPENED', 'QUALITY_REVIEW'].includes(job.status),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['jobs'] });

  const closeMutation = useMutation({
    mutationFn: () => jobsApi.completeJob(job.id),
    onSuccess: () => {
      toast.success(t('jb.completion.closedToast'));
      invalidate();
      setCloseConfirmOpen(false);
    },
    onError: (err) => {
      const e = getApiError(err);
      if (isReSignRequired(e.code)) {
        // §23: the accepted work summary went stale — force a fresh signature.
        toast.error(t('jb.completion.reSignToast'));
        queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', job.id, 'signable-summary'] });
      } else {
        toast.error(e.details?.length ? e.details.map((d) => d.message).join(' · ') : localizeApiError(e.code, t));
      }
      setCloseConfirmOpen(false);
      invalidate();
    },
  });

  if (job.status === 'COMPLETED') {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-700">
          <CheckCircle2 className="size-5" />
          {t('jb.completion.doneTitle')}
        </p>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {job.closedByName ? t('jb.completion.closedBy', { name: job.closedByName }) : ''}
          {job.closedAt ? ` · ${fmtDt(job.closedAt)}` : ''}
        </p>
        {job.reopenedAt && (
          <p className="mt-1 text-xs text-[var(--text-2)]">
            {t('jb.completion.previouslyReopened', { name: job.reopenedByName ?? '', reason: job.reopenReason ?? '' })}
          </p>
        )}
        {completionQuery.data?.signature && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-[var(--text-2)]">{t('jb.completion.customerSignature')}</p>
            <img
              src={jobsApi.signatureUrl(job.id)}
              alt={t('jb.completion.customerSignature')}
              className="h-24 rounded-xl border border-[var(--border-1)] bg-white object-contain p-2"
            />
          </div>
        )}
        <CompletionSnapshotView job={job} />
        {can(actor, 'jobs.reopen') && <ReopenPanel job={job} onDone={invalidate} />}
      </div>
    );
  }

  if (job.status === 'QUALITY_REVIEW') {
    return <QualityReviewPanel job={job} onDone={invalidate} />;
  }

  if (job.status !== 'IN_PROGRESS' && job.status !== 'REOPENED') return null;

  if (completionQuery.isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner className="size-6 text-brand-500" />
      </div>
    );
  }
  if (completionQuery.isError || !completionQuery.data) {
    return (
      <Alert tone="error">
        {completionQuery.error ? localizeApiError(getApiError(completionQuery.error).code, t) : t('jb.completion.errorGeneric')}
      </Alert>
    );
  }

  const { readiness, signature } = completionQuery.data;
  const checklistDone = readiness.conditions.checklist && readiness.conditions.stops;
  const needSignature = !signature && checklistDone;

  return (
    <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <p className="flex items-center gap-2 font-bold text-[var(--text-1)]">
        <Flag className="size-4.5 text-brand-500" />
        {t('jb.completion.finish')}
      </p>

      {job.status === 'REOPENED' && (
        <Alert tone="info" className="mt-3">
          {t('jb.completion.reopenedInfo', { name: job.reopenedByName ?? '', reason: job.reopenReason ?? '' })}
        </Alert>
      )}

      {/* §22 condition checklist (server-authoritative; icon + text, not colour alone) */}
      <div className="mt-3 space-y-2">
        {CONDITION_LABELS.map(({ key, labelKey }) => {
          const ok = readiness.conditions[key];
          return (
            <div key={key} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full',
                  ok ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]',
                )}
              >
                {ok ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3" />}
              </span>
              <span className={ok ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]'}>{t(labelKey)}</span>
              <span className="ml-auto text-xs font-medium text-[var(--text-3)]">{ok ? t('jb.cond.ok') : t('jb.cond.needed')}</span>
            </div>
          );
        })}
      </div>

      {readiness.reasons.length > 0 && (
        <Alert tone="info" className="mt-3">
          {readiness.reasons.map((r) => (
            <span key={r.code + r.message} className="block">
              {r.message}
            </span>
          ))}
        </Alert>
      )}

      {/* §23 signable summary + customer signature capture */}
      {checklistDone && can(actor, 'checklist.execute') && (
        <SignatureFlow job={job} hasSignature={!!signature} needSignature={needSignature} onSaved={invalidate} />
      )}

      {signature && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold text-[var(--text-2)]">
            {t('jb.completion.customerSignature')} · {fmtDt(signature.createdAt)}
          </p>
          <img
            src={jobsApi.signatureUrl(job.id)}
            alt={t('jb.completion.customerSignature')}
            className="h-24 rounded-xl border border-[var(--border-1)] bg-white object-contain p-2"
          />
        </div>
      )}

      {/* §22 Master close — UX only; the server re-runs the full gate */}
      {can(actor, 'jobs.close') && (
        <Button size="lg" className="mt-4 w-full" disabled={!readiness.canComplete} onClick={() => setCloseConfirmOpen(true)}>
          <CheckCircle2 className="size-5" />
          {job.status === 'REOPENED' ? t('jb.completion.sendToQuality') : t('jb.completion.finish')}
        </Button>
      )}

      <ConfirmDialog
        open={closeConfirmOpen}
        title={job.status === 'REOPENED' ? t('jb.completion.sendToQuality') : t('jb.completion.finish')}
        confirmLabel={t('jb.completion.confirmContinue')}
        loading={closeMutation.isPending}
        onConfirm={() => closeMutation.mutate()}
        onCancel={() => setCloseConfirmOpen(false)}
      >
        <b>#{job.id}</b>{' '}
        {t('jb.completion.confirmBody', {
          plate: job.plateNumber,
          tail: job.status === 'REOPENED' ? t('jb.completion.confirmTailReopened') : t('jb.completion.confirmTailNormal'),
        })}
      </ConfirmDialog>
    </div>
  );
}

/**
 * §23: shows the server's signable summary (what the customer signs) with its
 * canonical digest, then captures the signature bound to that digest. If the
 * summary went stale (SIGNATURE_STALE / SUMMARY_STALE), it refetches the fresh
 * summary and prompts a re-sign — never silently signing an outdated summary.
 */
function SignatureFlow({
  job,
  hasSignature,
  needSignature,
  onSaved,
}: {
  job: Job;
  hasSignature: boolean;
  needSignature: boolean;
  onSaved: () => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const summaryQuery = useQuery({
    queryKey: ['jobs', 'detail', job.id, 'signable-summary'],
    queryFn: () => safety.getSignableSummary(job.id),
  });

  if (summaryQuery.isLoading) {
    return (
      <div className="mt-4 flex justify-center py-4">
        <Spinner className="size-5 text-brand-500" />
      </div>
    );
  }
  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <Alert tone="error" className="mt-4">
        {summaryQuery.error ? localizeApiError(getApiError(summaryQuery.error).code, t) : t('jb.completion.summaryLoadError')}
      </Alert>
    );
  }

  const summary = summaryQuery.data;

  return (
    <div className="mt-4 space-y-3">
      <SignableSummaryCard content={summary.summary} digest={summary.digest} />
      {needSignature && (
        <SignaturePad
          jobId={job.id}
          summaryDigest={summary.digest}
          onStale={() => {
            toast.error(t('jb.completion.staleReSignToast'));
            queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', job.id, 'signable-summary'] });
          }}
          onSaved={onSaved}
        />
      )}
      {hasSignature && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--text-3)]">
          <Fingerprint className="size-3.5" aria-hidden />
          {t('jb.completion.signatureBound')}
        </p>
      )}
    </div>
  );
}

/**
 * Phase 10D immutable completion snapshot (§23). Shows the stored, digest-sealed
 * record of the completion cycle. Honest about legacy jobs closed before
 * snapshots existed (none stored → an explicit note, never a fabricated one).
 */
function CompletionSnapshotView({ job }: { job: Job }) {
  const t = useT();
  const snapshotQuery = useQuery({
    queryKey: ['jobs', 'detail', job.id, 'completion-snapshot'],
    queryFn: () => safety.getCompletionSnapshot(job.id),
  });

  if (snapshotQuery.isLoading) return null;
  const snapshot = snapshotQuery.data;

  if (!snapshot) {
    return (
      <p className="mt-3 text-xs text-[var(--text-3)]">{t('jb.snapshot.none')}</p>
    );
  }

  const c = snapshot.content;
  return (
    <details className="mt-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-3.5">
      <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
        <FileLock2 className="size-4 text-[var(--accent)]" aria-hidden />
        {t('jb.snapshot.title', { cycle: snapshot.cycle })}
      </summary>
      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-[var(--text-2)]">{t('jb.snapshot.status')}</span>
          <span className="font-medium text-[var(--text-1)]">{snapshot.provenance}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-[var(--text-2)]">{t('jb.snapshot.schemaVersion')}</span>
          <span className="font-medium text-[var(--text-1)]">{snapshot.schemaVersion}</span>
        </div>
        {c.assignment && (
          <div className="flex justify-between gap-3">
            <span className="text-[var(--text-2)]">{t('jb.snapshot.technicianId')}</span>
            <span className="font-medium text-[var(--text-1)]">{c.assignment.technicianId ?? '—'}</span>
          </div>
        )}
        {c.signature && (
          <div className="flex justify-between gap-3">
            <span className="text-[var(--text-2)]">{t('jb.snapshot.signatureDigest')}</span>
            <span className="font-mono text-xs text-[var(--text-3)]">{c.signature.summaryDigest?.slice(0, 16) ?? '—'}…</span>
          </div>
        )}
      </div>

      {c.risks && c.risks.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-[var(--text-2)]">{t('jb.snapshot.risks', { count: c.risks.length })}</p>
          <ul className="mt-1 space-y-1">
            {c.risks.map((r) => (
              <li key={r.id} className="text-xs text-[var(--text-3)]">
                {r.level} · {r.status}
                {r.blocking ? ` · ${t('jb.snapshot.blocking')}` : ''} · {t('jb.snapshot.matrix', { v: r.matrixVersion })}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 border-t border-[var(--border-1)] pt-3">
        <Fingerprint className="mt-0.5 size-4 shrink-0 text-[var(--text-3)]" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-2)]">{t('jb.snapshot.digest')}</p>
          <p className="break-all font-mono text-[11px] text-[var(--text-3)]">{snapshot.digest}</p>
        </div>
      </div>
    </details>
  );
}

/** §24: quality reopens a completed job with a mandatory reason. */
function ReopenPanel({ job, onDone }: { job: Job; onDone: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const reopenMutation = useMutation({
    mutationFn: () => jobsApi.reopenJob(job.id, reason.trim()),
    onSuccess: () => {
      toast.success(t('jb.reopen.doneToast'));
      onDone();
      setOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setOpen(false);
    },
  });

  return (
    <div className="mt-4">
      <Button variant="danger-outline" onClick={() => setOpen(true)}>
        <RotateCcw className="size-4" />
        {t('jb.reopen.button')}
      </Button>
      <Modal
        open={open}
        onClose={reopenMutation.isPending ? () => {} : () => setOpen(false)}
        title={t('jb.reopen.button')}
        className="sm:max-w-md"
      >
        <p className="text-sm text-[var(--text-2)]">
          <b className="text-[var(--text-1)]">#{job.id}</b> {t('jb.reopen.body', { plate: job.plateNumber })}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.reopen.reasonLabel')}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t('jb.reopen.reasonPlaceholder')}
            className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25"
          />
        </label>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={reopenMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => reopenMutation.mutate()}
            loading={reopenMutation.isPending}
            disabled={reason.trim().length < 3}
          >
            {t('jb.reopen.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** §24: quality accepts the corrected work — the second completion. */
function QualityReviewPanel({ job, onDone }: { job: Job; onDone: () => void }) {
  const t = useT();
  const { user: actor } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: () => jobsApi.confirmQuality(job.id),
    onSuccess: () => {
      toast.success(t('jb.quality.confirmedToast'));
      onDone();
      setConfirmOpen(false);
    },
    onError: (err) => {
      const e = getApiError(err);
      toast.error(e.details?.length ? e.details.map((d) => d.message).join(' · ') : localizeApiError(e.code, t));
      setConfirmOpen(false);
    },
  });

  return (
    <div className="rounded-3xl border border-teal-500/30 bg-teal-500/5 p-5">
      <p className="flex items-center gap-2 font-bold text-teal-700">
        <ShieldCheck className="size-5" />
        {t('jb.quality.title')}
      </p>
      <p className="mt-1 text-sm text-[var(--text-2)]">
        {t('jb.quality.awaiting')}
        {job.reopenReason ? ` ${t('jb.quality.reopenReason', { reason: job.reopenReason })}` : ''}
      </p>
      {can(actor, 'jobs.reopen') && (
        <Button size="lg" className="mt-3 w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
          <ShieldCheck className="size-5" />
          {t('jb.quality.passButton')}
        </Button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={t('jb.quality.confirmTitle')}
        confirmLabel={t('jb.quality.confirmLabel')}
        loading={confirmMutation.isPending}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        <b>#{job.id}</b> {t('jb.quality.confirmBody', { plate: job.plateNumber })}
      </ConfirmDialog>
    </div>
  );
}

/** Mobile-first canvas signature capture — the customer signs on the device. */
function SignaturePad({
  jobId,
  summaryDigest,
  onStale,
  onSaved,
}: {
  jobId: number;
  summaryDigest: string;
  onStale: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (blob: Blob) => jobsApi.uploadSignature(jobId, blob, summaryDigest),
    onSuccess: () => {
      toast.success(t('jb.sign.savedToast'));
      onSaved();
    },
    onError: (err) => {
      const e = getApiError(err);
      if (isReSignRequired(e.code)) {
        // Summary changed under us — refetch the fresh digest; ink is preserved.
        onStale();
        return;
      }
      const { message, retryable } = getUploadError(err);
      toast.error(message, retryable ? { description: t('jb.sign.retryDesc') } : undefined);
    },
  });

  const ctx = () => {
    const canvas = canvasRef.current!;
    const c = canvas.getContext('2d')!;
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.strokeStyle = '#14161a';
    return c;
  };

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const canvas = canvasRef.current!;
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const c = ctx();
    c.fillStyle = '#ffffff';
    c.fillRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const save = () => {
    if (uploadMutation.isPending) return;
    canvasRef.current!.toBlob((blob) => {
      if (blob && !uploadMutation.isPending) uploadMutation.mutate(blob);
    }, 'image/png');
  };

  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
        <PenLine className="size-4" />
        {t('jb.sign.title')}
      </p>
      <p className="mt-1 text-xs text-[var(--text-2)]">{t('jb.sign.desc')}</p>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="mt-2 h-40 w-full touch-none rounded-xl border border-[var(--field-border)] bg-white"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          if (!hasInk) {
            const c = ctx();
            c.fillStyle = '#ffffff';
            c.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          }
          drawing.current = true;
          const { x, y } = pos(e);
          const c = ctx();
          c.beginPath();
          c.moveTo(x, y);
          setHasInk(true);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const { x, y } = pos(e);
          const c = ctx();
          c.lineTo(x, y);
          c.stroke();
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="ghost" onClick={clear} disabled={!hasInk || uploadMutation.isPending}>
          <Eraser className="size-4" />
          {t('jb.sign.clear')}
        </Button>
        <Button type="button" size="lg" className="flex-1" onClick={save} disabled={!hasInk} loading={uploadMutation.isPending}>
          <Check className="size-5" strokeWidth={3} />
          {t('jb.sign.save')}
        </Button>
      </div>
    </div>
  );
}
