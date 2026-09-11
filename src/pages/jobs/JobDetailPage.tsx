import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Car,
  Gauge,
  Play,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Modal } from '../../components/ui/Modal';
import { JobStatusBadge } from './JobStatusBadge';
import { ChecklistSection } from './ChecklistSection';
import { InstallationCard } from './InstallationCard';
import { CompletionSection } from './CompletionSection';
import { AssignmentPanel } from './AssignmentPanel';
import { RiskPanel } from './RiskPanel';
import { JobEvidenceGallery } from './JobEvidenceGallery';
import { StartJobModal } from './StartJobModal';
import { useAuth } from '../../features/auth/auth-context';
import * as jobsApi from '../../api/jobs.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { useT, useDateTime } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';

export function JobDetailPage() {
  const t = useT();
  const fmtDt = useDateTime();
  const { id } = useParams();
  const jobId = Number(id);
  const { user: actor } = useAuth();
  const queryClient = useQueryClient();

  const [startOpen, setStartOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const jobQuery = useQuery({
    queryKey: ['jobs', 'detail', jobId],
    queryFn: () => jobsApi.fetchJob(jobId),
    enabled: Number.isInteger(jobId) && jobId > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  const cancelMutation = useMutation({
    mutationFn: () => jobsApi.cancelJob(jobId, cancelReason.trim()),
    onSuccess: () => {
      toast.success(t('ja.detail.toastCancelled'));
      invalidate();
      setCancelOpen(false);
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
      setCancelOpen(false);
    },
  });

  if (!Number.isInteger(jobId) || jobId <= 0) {
    return <Alert tone="error">{t('ja.jobs.notFound')}</Alert>;
  }

  if (jobQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-7 text-brand-500" />
      </div>
    );
  }

  if (jobQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">{localizeApiError(getApiError(jobQuery.error).code, t)}</Alert>
        <Link to="/app/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <ArrowLeft className="size-4" />
          {t('ja.detail.backToList')}
        </Link>
      </div>
    );
  }

  const job = jobQuery.data!;
  const canOperate = can(actor, 'jobs.create');
  const showStart = canOperate && job.status === 'DRAFT';
  const showCancel = canOperate && (job.status === 'DRAFT' || job.status === 'IN_PROGRESS');

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
      >
        <ArrowLeft className="size-4" />
        {t('ja.jobs.title')}
      </Link>

      {/* Identity header */}
      <div className="mt-4 rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('ja.detail.title', { id: job.id })}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="flex gap-2">
            {showStart && (
              <Button onClick={() => setStartOpen(true)}>
                <Play className="size-4" />
                {t('ja.detail.start')}
              </Button>
            )}
            {showCancel && (
              <Button variant="danger-outline" onClick={() => setCancelOpen(true)}>
                <XCircle className="size-4" />
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>

        {job.status === 'CANCELLED' && job.cancelReason && (
          <Alert tone="error" className="mt-4">
            {t('ja.detail.cancelledPrefix')}{job.cancelledByName ? ` (${job.cancelledByName})` : ''}: {job.cancelReason}
          </Alert>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Customer */}
          <div className="rounded-2xl bg-[var(--surface-2)] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-2)]">
              <UserRound className="size-3.5" />
              {t('ja.create.reviewCustomer')}
            </p>
            <Link
              to={`/app/customers/${job.customerId}`}
              className="mt-2 block font-semibold text-[var(--text-1)] hover:text-brand-600"
            >
              {job.customerName}
            </Link>
            <p className="mt-0.5 text-sm text-[var(--text-2)]">{displayPhone(job.customerPhone)}</p>
          </div>

          {/* Vehicle */}
          <div className="rounded-2xl bg-[var(--surface-2)] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-2)]">
              <Car className="size-3.5" />
              {t('ja.create.reviewVehicle')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[var(--border-1)] bg-[var(--surface)] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[var(--text-1)]">
                {job.plateNumber}
              </span>
              <span className="font-semibold text-[var(--text-1)]">
                {job.make} {job.model}
                {job.year ? ` · ${job.year}` : ''}
              </span>
            </div>
            {job.vin && <p className="mt-1.5 font-mono text-xs text-[var(--text-2)]">VIN: {job.vin}</p>}
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-[var(--text-2)]">
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="size-3.5" />
            {job.branchName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UserRound className="size-3.5" />
            {t('ja.detail.createdBy', { name: job.createdByName })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            {fmtDt(job.createdAt)}
          </span>
          {job.startedAt && <span>{t('ja.detail.startedAt', { date: fmtDt(job.startedAt) })}</span>}
        </div>
      </div>

      {/* §12 assignment / responsibility */}
      <div className="mt-6">
        <AssignmentPanel job={job} onChanged={invalidate} />
      </div>

      {/* §13 installation details */}
      <div className="mt-6">
        <InstallationCard job={job} />
      </div>

      {/* Checklist workspace (Phase 5) */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-bold text-[var(--text-1)]">{t('ja.detail.checklistHeading')}</h2>
        <ChecklistSection job={job} />
      </div>

      {/* §21 risk register */}
      <div className="mt-6">
        <RiskPanel job={job} />
      </div>

      {/* Completion flow (§22–23) */}
      <div className="mt-6">
        <CompletionSection job={job} />
      </div>

      {/* Phase 11C — photo evidence (Fotolar). Shown once work has begun; the
          gallery itself renders an honest empty state when there are no photos. */}
      {job.status !== 'DRAFT' && (
        <div className="mt-6">
          <JobEvidenceGallery jobId={job.id} />
        </div>
      )}

      <StartJobModal
        jobId={job.id}
        plateNumber={job.plateNumber}
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onStarted={() => {
          invalidate();
          setStartOpen(false);
        }}
      />

      <Modal
        open={cancelOpen}
        onClose={cancelMutation.isPending ? () => {} : () => setCancelOpen(false)}
        title={t('ja.detail.cancelModalTitle')}
        className="sm:max-w-md"
      >
        <p className="text-sm text-[var(--text-2)]">
          <b className="text-[var(--text-1)]">#{job.id}</b> {t('ja.detail.cancelBody', { plate: job.plateNumber })}
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('ja.detail.cancelReasonLabel')}</span>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t('ja.detail.cancelReasonPlaceholder')}
            className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25"
          />
        </label>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setCancelOpen(false)} disabled={cancelMutation.isPending}>
            {t('ja.detail.cancelBack')}
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => cancelMutation.mutate()}
            loading={cancelMutation.isPending}
            disabled={cancelReason.trim().length < 3}
          >
            {t('ja.detail.cancelConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
