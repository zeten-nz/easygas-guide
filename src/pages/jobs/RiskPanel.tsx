import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Info,
  Link2,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { getApiError } from '../../api/client';
import { useT, useDateTime } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { fieldError } from '../../i18n/form';
import type { MessageKey } from '../../i18n/types';
import { validateRiskInput, type RiskFormErrors } from '../../features/safety/risk-form';
import * as safety from '../../api/safety.api';
import type { RiskListItem } from '../../api/safety.api';
import type { Job } from '../../types/entities';
import { cn } from '../../lib/utils';

/** Server-computed level → UI treatment. Text label + icon, never colour alone. */
const LEVEL: Record<string, { labelKey: MessageKey; Icon: typeof AlertTriangle; className: string; critical?: boolean }> = {
  LOW: { labelKey: 'jb.risk.levelLow', Icon: Info, className: 'border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)]' },
  MEDIUM: { labelKey: 'jb.risk.levelMedium', Icon: AlertTriangle, className: 'border-[var(--warning-fg)]/30 bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  HIGH: { labelKey: 'jb.risk.levelHigh', Icon: AlertOctagon, className: 'border-[var(--danger-fg)]/30 bg-[var(--danger-bg)] text-[var(--danger-fg)]' },
  CRITICAL: { labelKey: 'jb.risk.levelCritical', Icon: ShieldAlert, className: 'border-[var(--critical)]/50 bg-[var(--critical-bg)] text-[var(--critical)] font-bold', critical: true },
};

const STATUS_LABEL_KEY: Record<string, MessageKey> = {
  OPEN: 'jb.risk.statusOpen',
  MITIGATION_IN_PROGRESS: 'jb.risk.statusMitigation',
  RESOLVED: 'jb.risk.statusResolved',
  REJECTED: 'jb.risk.statusRejected',
};

const SOURCE_LABEL_KEY: Record<string, MessageKey> = {
  MANUAL: 'jb.risk.sourceManual',
  STOP_REJECTED: 'jb.risk.sourceStopRejected',
  CHECKLIST: 'jb.risk.sourceChecklist',
};

const OPEN_STATUSES = new Set(['OPEN', 'MITIGATION_IN_PROGRESS']);

function LevelBadge({ level }: { level: string }) {
  const t = useT();
  const l = LEVEL[level] ?? LEVEL.LOW;
  const { Icon } = l;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', l.className)}>
      <Icon className="size-3.5" aria-hidden />
      {t(l.labelKey)}
    </span>
  );
}

/**
 * Phase 10D risk register (§21). Shows current- and historical-cycle risks with
 * the SERVER's authoritative score/level/blocking/matrix-version — the client
 * never derives them. Blocking status is shown as text + icon (never colour
 * alone). Create / resolve / override are gated by permission; override is
 * audited and warned. Fails closed to the server (RISK_POLICY_NOT_APPROVED etc.
 * surface as errors).
 */
export function RiskPanel({ job }: { job: Job }) {
  const t = useT();
  const { user: actor } = useAuth();
  const qc = useQueryClient();
  const mayCreate = can(actor, 'risks.create');
  const mayResolve = can(actor, 'risks.resolve');
  const mayOverride = can(actor, 'risks.override');
  const terminal = job.status === 'CANCELLED';

  const [createOpen, setCreateOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<RiskListItem | null>(null);
  const [overrideTarget, setOverrideTarget] = useState<RiskListItem | null>(null);

  const risksQuery = useQuery({
    queryKey: ['jobs', 'detail', job.id, 'risks'],
    queryFn: () => safety.listRisks(job.id, { page: 1 }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['jobs', 'detail', job.id, 'risks'] });
    qc.invalidateQueries({ queryKey: ['jobs', 'detail', job.id, 'completion'] });
  };

  const { current, historical } = useMemo(() => {
    const cur: RiskListItem[] = [];
    const hist: RiskListItem[] = [];
    for (const r of risksQuery.data?.items ?? []) (r.cycle === job.cycle ? cur : hist).push(r);
    return { current: cur, historical: hist };
  }, [risksQuery.data, job.cycle]);

  const openBlocking = current.filter((r) => r.blocking && OPEN_STATUSES.has(r.status)).length;

  return (
    <section aria-label={t('jb.risk.register')} className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold text-[var(--text-1)]">
          <ShieldAlert className="size-4.5 text-[var(--accent)]" />
          {t('jb.risk.register')}
        </p>
        {mayCreate && !terminal && (
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t('jb.risk.add')}
          </Button>
        )}
      </div>

      {openBlocking > 0 && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--critical)]/50 bg-[var(--critical-bg)] px-3.5 py-3 text-sm text-[var(--critical)]">
          <Ban className="size-4.5 shrink-0" aria-hidden />
          <span>
            <b>{t('jb.risk.blockingCount', { count: openBlocking })}</b> {t('jb.risk.blockingTail')}
          </span>
        </div>
      )}

      {risksQuery.isLoading && <p className="mt-3 text-sm text-[var(--text-2)]">{t('common.loading')}</p>}
      {risksQuery.isError && (
        <Alert tone="error" className="mt-3">
          {localizeApiError(getApiError(risksQuery.error).code, t)}
        </Alert>
      )}

      {!risksQuery.isLoading && !risksQuery.isError && (
        <>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              {t('jb.risk.currentCycle', { cycle: job.cycle })}
            </p>
            {current.length === 0 ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-2)]">
                <ShieldCheck className="size-4 text-[var(--success-fg)]" aria-hidden />
                {t('jb.risk.noneThisCycle')}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {current.map((r) => (
                  <RiskRow
                    key={r.id}
                    risk={r}
                    canResolve={mayResolve && OPEN_STATUSES.has(r.status)}
                    canOverride={mayOverride && r.blocking && OPEN_STATUSES.has(r.status)}
                    onResolve={() => setResolveTarget(r)}
                    onOverride={() => setOverrideTarget(r)}
                  />
                ))}
              </ul>
            )}
          </div>

          {historical.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
                {t('jb.risk.prevCycles', { count: historical.length })}
              </summary>
              <ul className="mt-2 space-y-2">
                {historical.map((r) => (
                  <RiskRow key={r.id} risk={r} historical />
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      {createOpen && <CreateRiskModal job={job} onClose={() => setCreateOpen(false)} onDone={invalidate} />}
      {resolveTarget && (
        <ResolveRiskModal job={job} risk={resolveTarget} onClose={() => setResolveTarget(null)} onDone={invalidate} />
      )}
      {overrideTarget && (
        <OverrideRiskModal job={job} risk={overrideTarget} onClose={() => setOverrideTarget(null)} onDone={invalidate} />
      )}
    </section>
  );
}

function RiskRow({
  risk,
  historical,
  canResolve,
  canOverride,
  onResolve,
  onOverride,
}: {
  risk: RiskListItem;
  historical?: boolean;
  canResolve?: boolean;
  canOverride?: boolean;
  onResolve?: () => void;
  onOverride?: () => void;
}) {
  const t = useT();
  const fmtDt = useDateTime();
  const isCritical = LEVEL[risk.level]?.critical;
  const resolved = risk.status === 'RESOLVED';
  const statusKey = STATUS_LABEL_KEY[risk.status];
  const sourceKey = SOURCE_LABEL_KEY[risk.source];
  return (
    <li
      className={cn(
        'rounded-2xl border p-3.5',
        isCritical && !resolved ? 'border-[var(--critical)]/50 bg-[var(--critical-bg)]' : 'border-[var(--border-1)] bg-[var(--surface-2)]',
        historical && 'opacity-80',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <LevelBadge level={risk.level} />
        {risk.blocking ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--critical)] px-2 py-0.5 text-xs font-semibold text-white">
            <Ban className="size-3" aria-hidden /> {t('jb.risk.blocking')}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-3)]">{t('jb.risk.notBlocking')}</span>
        )}
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            resolved ? 'text-[var(--success-fg)]' : 'text-[var(--text-2)]',
          )}
        >
          {resolved && <CheckCircle2 className="size-3.5" aria-hidden />}
          {statusKey ? t(statusKey) : risk.status}
        </span>
        {risk.jobStepId != null && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-3)]">
            <Link2 className="size-3" aria-hidden /> {t('jb.risk.stepLink', { id: risk.jobStepId })}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-semibold text-[var(--text-1)]">{risk.hazard}</p>
      <p className="mt-0.5 text-sm text-[var(--text-2)]">{risk.description}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-3)]">
        <span>{t('jb.risk.source', { src: sourceKey ? t(sourceKey) : risk.source })}</span>
        <span>{t('jb.risk.matrix', { v: risk.matrixVersion })}</span>
        <span>{fmtDt(risk.createdAt)}</span>
      </div>

      {(canResolve || canOverride) && (
        <div className="mt-3 flex gap-2">
          {canResolve && (
            <Button variant="secondary" onClick={onResolve}>
              <CheckCircle2 className="size-4" />
              {t('jb.risk.resolve')}
            </Button>
          )}
          {canOverride && (
            <Button variant="danger-outline" onClick={onOverride}>
              <ShieldAlert className="size-4" />
              {t('jb.risk.override')}
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function CreateRiskModal({ job, onClose, onDone }: { job: Job; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [hazard, setHazard] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(1);
  const [likelihood, setLikelihood] = useState(1);
  const [errors, setErrors] = useState<RiskFormErrors>({});

  const mutation = useMutation({
    mutationFn: () => safety.createRisk(job.id, { hazard: hazard.trim(), description: description.trim(), severity, likelihood }),
    onSuccess: () => {
      toast.success(t('jb.risk.createdToast'));
      onDone();
      onClose();
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  const submit = () => {
    const { ok, errors: errs } = validateRiskInput({ hazard, description, severity, likelihood });
    setErrors(errs);
    if (ok) mutation.mutate();
  };

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title={t('jb.risk.add')} className="sm:max-w-md">
      <p className="text-xs text-[var(--text-2)]">{t('jb.risk.createDesc')}</p>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.risk.hazardType')}</span>
        <input
          value={hazard}
          onChange={(e) => setHazard(e.target.value)}
          maxLength={80}
          aria-invalid={!!errors.hazard}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        {errors.hazard && <p className="mt-1 text-xs text-[var(--danger-fg)]">{fieldError(errors.hazard, t)}</p>}
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.risk.descLabel')}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          aria-invalid={!!errors.description}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        {errors.description && <p className="mt-1 text-xs text-[var(--danger-fg)]">{fieldError(errors.description, t)}</p>}
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.risk.severity')}</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="h-11 w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          >
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.risk.likelihood')}</span>
          <select
            value={likelihood}
            onChange={(e) => setLikelihood(Number(e.target.value))}
            className="h-11 w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          >
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
        <Button onClick={submit} loading={mutation.isPending}>{t('jb.risk.addSubmit')}</Button>
      </div>
    </Modal>
  );
}

function ResolveRiskModal({ job, risk, onClose, onDone }: { job: Job; risk: RiskListItem; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [note, setNote] = useState('');
  const [mitigation, setMitigation] = useState('');

  const mutation = useMutation({
    mutationFn: () => safety.resolveRisk(job.id, risk.id, { note: note.trim(), mitigation: mitigation.trim() || undefined }),
    onSuccess: () => {
      toast.success(t('jb.risk.resolvedToast'));
      onDone();
      onClose();
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title={t('jb.risk.resolveTitle')} className="sm:max-w-md">
      <p className="text-sm text-[var(--text-2)]">
        <b className="text-[var(--text-1)]">{risk.hazard}</b> {t('jb.risk.resolveQuestion')}
      </p>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.risk.resolveNoteLabel')}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.risk.resolveMitigationLabel')}</span>
        <textarea
          value={mitigation}
          onChange={(e) => setMitigation(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </label>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={note.trim().length < 3}>
          {t('jb.risk.resolveConfirm')}
        </Button>
      </div>
    </Modal>
  );
}

function OverrideRiskModal({ job, risk, onClose, onDone }: { job: Job; risk: RiskListItem; onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => safety.overrideRisk(job.id, risk.id, reason.trim()),
    onSuccess: () => {
      toast.success(t('jb.risk.overrideToast'));
      onDone();
      onClose();
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title={t('jb.risk.overrideTitle')} className="sm:max-w-md">
      <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--critical)]/50 bg-[var(--critical-bg)] px-3.5 py-3 text-sm text-[var(--critical)]">
        <ShieldAlert className="size-4.5 shrink-0" aria-hidden />
        <span>{t('jb.risk.overrideWarn')}</span>
      </div>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">{t('jb.overrideReason')}</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--critical)] focus:ring-2 focus:ring-[var(--critical)]/25"
        />
      </label>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
        <Button variant="danger-outline" onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={reason.trim().length < 3}>
          {t('jb.risk.overrideConfirm')}
        </Button>
      </div>
    </Modal>
  );
}
