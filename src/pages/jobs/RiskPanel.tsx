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
import { validateRiskInput, type RiskFormErrors } from '../../features/safety/risk-form';
import * as safety from '../../api/safety.api';
import type { RiskListItem } from '../../api/safety.api';
import type { Job } from '../../types/entities';
import { cn } from '../../lib/utils';

/** Server-computed level → UI treatment. Text label + icon, never colour alone. */
const LEVEL: Record<string, { label: string; Icon: typeof AlertTriangle; className: string; critical?: boolean }> = {
  LOW: { label: 'Past', Icon: Info, className: 'border-[var(--border-1)] bg-[var(--surface-2)] text-[var(--text-2)]' },
  MEDIUM: { label: "O'rta", Icon: AlertTriangle, className: 'border-[var(--warning-fg)]/30 bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  HIGH: { label: 'Yuqori', Icon: AlertOctagon, className: 'border-[var(--danger-fg)]/30 bg-[var(--danger-bg)] text-[var(--danger-fg)]' },
  CRITICAL: { label: 'KRITIK', Icon: ShieldAlert, className: 'border-[var(--critical)]/50 bg-[var(--critical-bg)] text-[var(--critical)] font-bold', critical: true },
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ochiq',
  MITIGATION_IN_PROGRESS: 'Chora ko\'rilmoqda',
  RESOLVED: 'Hal qilingan',
  REJECTED: 'Bekor qilingan (qayta baholangan)',
};

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: 'Qo\'lda kiritilgan',
  STOP_REJECTED: 'Rad etilgan STOP',
  CHECKLIST: 'Checklist',
};

const OPEN_STATUSES = new Set(['OPEN', 'MITIGATION_IN_PROGRESS']);

function LevelBadge({ level }: { level: string }) {
  const l = LEVEL[level] ?? LEVEL.LOW;
  const { Icon } = l;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', l.className)}>
      <Icon className="size-3.5" aria-hidden />
      {l.label}
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
    <section aria-label="Xavf registri" className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold text-[var(--text-1)]">
          <ShieldAlert className="size-4.5 text-[var(--accent)]" />
          Xavf registri
        </p>
        {mayCreate && !terminal && (
          <Button variant="secondary" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Xavf qo'shish
          </Button>
        )}
      </div>

      {openBlocking > 0 && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--critical)]/50 bg-[var(--critical-bg)] px-3.5 py-3 text-sm text-[var(--critical)]">
          <Ban className="size-4.5 shrink-0" aria-hidden />
          <span>
            <b>{openBlocking} ta hal qilinmagan bloklaydigan xavf.</b> Ular hal qilinmaguncha yoki override qilinmaguncha
            ish yakunlanmaydi.
          </span>
        </div>
      )}

      {risksQuery.isLoading && <p className="mt-3 text-sm text-[var(--text-2)]">Yuklanmoqda…</p>}
      {risksQuery.isError && <Alert tone="error" className="mt-3">{getApiError(risksQuery.error).message}</Alert>}

      {!risksQuery.isLoading && !risksQuery.isError && (
        <>
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">
              Joriy sikl (#{job.cycle})
            </p>
            {current.length === 0 ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-2)]">
                <ShieldCheck className="size-4 text-[var(--success-fg)]" aria-hidden />
                Bu siklda qayd etilgan xavf yo'q.
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
                Oldingi sikllar ({historical.length})
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
  const isCritical = LEVEL[risk.level]?.critical;
  const resolved = risk.status === 'RESOLVED';
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
            <Ban className="size-3" aria-hidden /> Bloklaydi
          </span>
        ) : (
          <span className="text-xs text-[var(--text-3)]">Bloklamaydi</span>
        )}
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium',
            resolved ? 'text-[var(--success-fg)]' : 'text-[var(--text-2)]',
          )}
        >
          {resolved && <CheckCircle2 className="size-3.5" aria-hidden />}
          {STATUS_LABEL[risk.status] ?? risk.status}
        </span>
        {risk.jobStepId != null && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-3)]">
            <Link2 className="size-3" aria-hidden /> Bosqich #{risk.jobStepId}
          </span>
        )}
      </div>

      <p className="mt-2 text-sm font-semibold text-[var(--text-1)]">{risk.hazard}</p>
      <p className="mt-0.5 text-sm text-[var(--text-2)]">{risk.description}</p>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-3)]">
        <span>Manba: {SOURCE_LABEL[risk.source] ?? risk.source}</span>
        <span>Matritsa: {risk.matrixVersion}</span>
        <span>{new Date(risk.createdAt).toLocaleString('uz-UZ')}</span>
      </div>

      {(canResolve || canOverride) && (
        <div className="mt-3 flex gap-2">
          {canResolve && (
            <Button variant="secondary" onClick={onResolve}>
              <CheckCircle2 className="size-4" />
              Hal qilish
            </Button>
          )}
          {canOverride && (
            <Button variant="danger-outline" onClick={onOverride}>
              <ShieldAlert className="size-4" />
              Override
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function CreateRiskModal({ job, onClose, onDone }: { job: Job; onClose: () => void; onDone: () => void }) {
  const [hazard, setHazard] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(1);
  const [likelihood, setLikelihood] = useState(1);
  const [errors, setErrors] = useState<RiskFormErrors>({});

  const mutation = useMutation({
    mutationFn: () => safety.createRisk(job.id, { hazard: hazard.trim(), description: description.trim(), severity, likelihood }),
    onSuccess: () => {
      toast.success('Xavf qayd etildi');
      onDone();
      onClose();
    },
    onError: (err) => toast.error(getApiError(err).message),
  });

  const submit = () => {
    const { ok, errors: errs } = validateRiskInput({ hazard, description, severity, likelihood });
    setErrors(errs);
    if (ok) mutation.mutate();
  };

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title="Xavf qo'shish" className="sm:max-w-md">
      <p className="text-xs text-[var(--text-2)]">
        Jiddiylik va ehtimollikni kiriting — daraja, ball va bloklash holati server tomonidan hisoblanadi.
      </p>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Xavf turi</span>
        <input
          value={hazard}
          onChange={(e) => setHazard(e.target.value)}
          maxLength={80}
          aria-invalid={!!errors.hazard}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        {errors.hazard && <p className="mt-1 text-xs text-[var(--danger-fg)]">{errors.hazard}</p>}
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Tavsif</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          aria-invalid={!!errors.description}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        {errors.description && <p className="mt-1 text-xs text-[var(--danger-fg)]">{errors.description}</p>}
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Jiddiylik (1–4)</span>
          <select
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="h-11 w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          >
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Ehtimollik (1–4)</span>
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
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
        <Button onClick={submit} loading={mutation.isPending}>Qo'shish</Button>
      </div>
    </Modal>
  );
}

function ResolveRiskModal({ job, risk, onClose, onDone }: { job: Job; risk: RiskListItem; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState('');
  const [mitigation, setMitigation] = useState('');

  const mutation = useMutation({
    mutationFn: () => safety.resolveRisk(job.id, risk.id, { note: note.trim(), mitigation: mitigation.trim() || undefined }),
    onSuccess: () => {
      toast.success('Xavf hal qilindi');
      onDone();
      onClose();
    },
    onError: (err) => toast.error(getApiError(err).message),
  });

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title="Xavfni hal qilish" className="sm:max-w-md">
      <p className="text-sm text-[var(--text-2)]">
        <b className="text-[var(--text-1)]">{risk.hazard}</b> — qanday chora ko'rildi?
      </p>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Izoh (majburiy)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </label>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Ko'rilgan chora (ixtiyoriy)</span>
        <textarea
          value={mitigation}
          onChange={(e) => setMitigation(e.target.value)}
          rows={2}
          maxLength={2000}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
      </label>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={note.trim().length < 3}>
          Hal qilindi
        </Button>
      </div>
    </Modal>
  );
}

function OverrideRiskModal({ job, risk, onClose, onDone }: { job: Job; risk: RiskListItem; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => safety.overrideRisk(job.id, risk.id, reason.trim()),
    onSuccess: () => {
      toast.success('Xavf override qilindi');
      onDone();
      onClose();
    },
    onError: (err) => toast.error(getApiError(err).message),
  });

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title="Xavfni override qilish" className="sm:max-w-md">
      <div role="alert" className="flex items-start gap-2 rounded-xl border border-[var(--critical)]/50 bg-[var(--critical-bg)] px-3.5 py-3 text-sm text-[var(--critical)]">
        <ShieldAlert className="size-4.5 shrink-0" aria-hidden />
        <span>
          Bloklaydigan xavfni override qilish uni hal qilmasdan yopadi. Bu amal audit jurnaliga yoziladi va faqat
          asosli hollarda ishlatilishi kerak.
        </span>
      </div>
      <label className="mt-3 block">
        <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Override sababi (majburiy)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none focus:border-[var(--critical)] focus:ring-2 focus:ring-[var(--critical)]/25"
        />
      </label>
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
        <Button variant="danger-outline" onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={reason.trim().length < 3}>
          Override qilish
        </Button>
      </div>
    </Modal>
  );
}
