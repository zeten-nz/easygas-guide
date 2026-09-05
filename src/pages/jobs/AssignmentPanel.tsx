import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserCog, History, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { getApiError } from '../../api/client';
import * as safety from '../../api/safety.api';
import type { Job } from '../../types/entities';

const PROVENANCE_LABEL: Record<string, string> = {
  SELF_AT_CREATION: 'Ochilishda biriktirildi',
  REASSIGNED: 'Qayta biriktirildi',
  UNASSIGNED: 'Biriktiruv bekor qilindi',
  SUPERVISOR_OVERRIDE: 'Rahbar tomonidan',
};

/**
 * Phase 10D assignment / responsibility (§12). Shows the responsible technician,
 * immutable assignment history, and — for `jobs.assign` holders — a reassign
 * control with branch-scoped candidates. Server is authoritative; a 409 conflict
 * refetches the true state. Actual step performers are shown by the checklist,
 * separately from the responsible technician.
 */
export function AssignmentPanel({ job, onChanged }: { job: Job; onChanged: () => void }) {
  const { user: actor } = useAuth();
  const qc = useQueryClient();
  const mayAssign = can(actor, 'jobs.assign');
  const terminal = job.status === 'COMPLETED' || job.status === 'CANCELLED';

  const [open, setOpen] = useState(false);
  const [technicianId, setTechnicianId] = useState('');
  const [reason, setReason] = useState('');

  const historyQuery = useQuery({ queryKey: ['jobs', 'detail', job.id, 'assignment'], queryFn: () => safety.assignmentHistory(job.id) });
  const candidatesQuery = useQuery({
    queryKey: ['jobs', 'detail', job.id, 'candidates'],
    queryFn: () => safety.assignmentCandidates(job.id),
    enabled: open && mayAssign,
  });

  const reassign = useMutation({
    mutationFn: () => safety.assignJob(job.id, Number(technicianId), reason.trim() || undefined),
    onSuccess: () => {
      toast.success('Texnik biriktirildi');
      setOpen(false);
      setTechnicianId('');
      setReason('');
      qc.invalidateQueries({ queryKey: ['jobs', 'detail', job.id] });
      onChanged();
    },
    onError: (err) => {
      const e = getApiError(err);
      toast.error(e.message);
      // Conflict / stale → refetch the authoritative assignment state.
      if (e.code === 'JOB_TERMINAL' || e.code === 'CROSS_BRANCH_ASSIGNMENT' || e.code === 'TECHNICIAN_INACTIVE') {
        qc.invalidateQueries({ queryKey: ['jobs', 'detail', job.id] });
      }
    },
  });

  const history = historyQuery.data?.history ?? [];

  return (
    <section aria-label="Mas'ul texnik" className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold text-[var(--text-1)]">
          <UserCog className="size-4.5 text-[var(--accent)]" />
          Mas'ul texnik
        </p>
        {mayAssign && !terminal && (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            {job.assignedTechnicianId ? 'Qayta biriktirish' : 'Biriktirish'}
          </Button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm">
        <UserCheck className="size-4 text-[var(--text-3)]" aria-hidden />
        {job.assignedTechnicianName ? (
          <span className="font-semibold text-[var(--text-1)]">{job.assignedTechnicianName}</span>
        ) : (
          <span className="text-[var(--text-2)]">Biriktirilmagan</span>
        )}
        {job.assignmentStatus === 'LEGACY_UNASSIGNED' && (
          <span className="rounded bg-[var(--warning-bg)] px-1.5 py-0.5 text-xs font-medium text-[var(--warning-fg)]">
            Eski yozuv
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--text-3)]">
        Bosqichlarni aslida bajargan texniklar checklistda alohida ko'rsatiladi.
      </p>

      {history.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[var(--text-2)]">
            <History className="size-3.5" aria-hidden /> Biriktiruv tarixi ({history.length})
          </summary>
          <ul className="mt-2 space-y-1.5 border-l border-[var(--border-1)] pl-3">
            {history.map((h) => (
              <li key={h.id} className="text-xs text-[var(--text-2)]">
                <span className="font-medium text-[var(--text-1)]">{PROVENANCE_LABEL[h.provenance] ?? h.provenance}</span>
                {h.reason ? ` — ${h.reason}` : ''} · {new Date(h.createdAt).toLocaleString('uz-UZ')}
              </li>
            ))}
          </ul>
        </details>
      )}

      <Modal open={open} onClose={reassign.isPending ? () => {} : () => setOpen(false)} title="Texnik biriktirish" className="sm:max-w-md">
        {candidatesQuery.isError && <Alert tone="error">{getApiError(candidatesQuery.error).message}</Alert>}
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Texnik (filial ichidan)</span>
          <Select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} disabled={candidatesQuery.isLoading}>
            <option value="">— Tanlang —</option>
            {(candidatesQuery.data?.candidates ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.role})
              </option>
            ))}
          </Select>
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Sabab (ixtiyoriy)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--field-placeholder)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
          />
        </label>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={reassign.isPending}>
            Bekor qilish
          </Button>
          <Button onClick={() => reassign.mutate()} loading={reassign.isPending} disabled={!technicianId}>
            Biriktirish
          </Button>
        </div>
      </Modal>
    </section>
  );
}
