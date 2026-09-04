import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, CheckCircle2, Eraser, Flag, PenLine, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../features/auth/auth-context';
import * as jobsApi from '../../api/jobs.api';
import { getApiError, getUploadError } from '../../api/client';
import { can } from '../../lib/permissions';
import type { Job } from '../../types/entities';
import { cn } from '../../lib/utils';

const CONDITION_LABELS: { key: keyof jobsApi.CompletionInfo['readiness']['conditions']; label: string }[] = [
  { key: 'checklist', label: 'Checklist bosqichlari bajarildi' },
  { key: 'stops', label: 'Barcha STOP checkpointlar tasdiqlangan' },
  { key: 'measurements', label: "O'lchovlar talab doirasida" },
  { key: 'photos', label: 'Kerakli foto dalillar mavjud' },
  { key: 'signature', label: 'Mijoz imzosi olingan' },
];

/** §22–23 completion workspace: readiness, customer signature, Master close. */
export function CompletionSection({ job }: { job: Job }) {
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
      toast.success('Ish muvaffaqiyatli yakunlandi');
      invalidate();
      setCloseConfirmOpen(false);
    },
    onError: (err) => {
      const e = getApiError(err);
      toast.error(e.details?.length ? e.details.map((d) => d.message).join(' · ') : e.message);
      setCloseConfirmOpen(false);
      invalidate();
    },
  });

  if (job.status === 'COMPLETED') {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <p className="flex items-center gap-2 font-bold text-emerald-700">
          <CheckCircle2 className="size-5" />
          Ish yakunlangan
        </p>
        <p className="mt-1 text-sm text-[var(--text-2)]">
          {job.closedByName ? `Yopdi: ${job.closedByName}` : ''}
          {job.closedAt ? ` · ${new Date(job.closedAt).toLocaleString('uz-UZ')}` : ''}
        </p>
        {job.reopenedAt && (
          <p className="mt-1 text-xs text-[var(--text-2)]">
            Avval qayta ochilgan: {job.reopenedByName} · sabab: {job.reopenReason}
          </p>
        )}
        {completionQuery.data?.signature && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-[var(--text-2)]">Mijoz imzosi</p>
            <img
              src={jobsApi.signatureUrl(job.id)}
              alt="Mijoz imzosi"
              className="h-24 rounded-xl border border-[var(--border-1)] bg-white object-contain p-2"
            />
          </div>
        )}
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
    return <Alert tone="error">{completionQuery.error ? getApiError(completionQuery.error).message : 'Xatolik'}</Alert>;
  }

  const { readiness, signature } = completionQuery.data;
  const needSignature = !signature && readiness.conditions.checklist && readiness.conditions.stops;

  return (
    <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <p className="flex items-center gap-2 font-bold text-[var(--text-1)]">
        <Flag className="size-4.5 text-brand-500" />
        Ishni yakunlash
      </p>

      {job.status === 'REOPENED' && (
        <Alert tone="info" className="mt-3">
          Ish sifat nazorati tomonidan qayta ochilgan ({job.reopenedByName}). Sabab: {job.reopenReason}. Tuzatishdan
          so'ng ish sifat nazoratiga qayta yuboriladi.
        </Alert>
      )}

      {/* §22 condition checklist */}
      <div className="mt-3 space-y-2">
        {CONDITION_LABELS.map(({ key, label }) => {
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
              <span className={ok ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]'}>{label}</span>
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

      {/* §23 customer signature capture */}
      {needSignature && can(actor, 'checklist.execute') && <SignaturePad jobId={job.id} onSaved={invalidate} />}

      {signature && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold text-[var(--text-2)]">
            Mijoz imzosi · {new Date(signature.createdAt).toLocaleString('uz-UZ')}
          </p>
          <img
            src={jobsApi.signatureUrl(job.id)}
            alt="Mijoz imzosi"
            className="h-24 rounded-xl border border-[var(--border-1)] bg-white object-contain p-2"
          />
        </div>
      )}

      {/* §22 Master close — UX only; the server re-runs the full gate */}
      {can(actor, 'jobs.close') && (
        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={!readiness.canComplete}
          onClick={() => setCloseConfirmOpen(true)}
        >
          <CheckCircle2 className="size-5" />
          {job.status === 'REOPENED' ? 'Sifat nazoratiga yuborish' : 'Ishni yakunlash'}
        </Button>
      )}

      <ConfirmDialog
        open={closeConfirmOpen}
        title={job.status === 'REOPENED' ? 'Sifat nazoratiga yuborish' : 'Ishni yakunlash'}
        confirmLabel="Ha, davom etilsin"
        loading={closeMutation.isPending}
        onConfirm={() => closeMutation.mutate()}
        onCancel={() => setCloseConfirmOpen(false)}
      >
        <b>#{job.id}</b> — {job.plateNumber} bo'yicha{' '}
        {job.status === 'REOPENED'
          ? "tuzatilgan ish sifat nazoratiga yuboriladi. Sifat tasdiqlagach ish yakunlanadi."
          : 'ish yakunlanadi.'}{' '}
        Server barcha shartlarni qayta tekshiradi va qaror audit jurnaliga yoziladi.
      </ConfirmDialog>
    </div>
  );
}

/** §24: quality reopens a completed job with a mandatory reason. */
function ReopenPanel({ job, onDone }: { job: Job; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const reopenMutation = useMutation({
    mutationFn: () => jobsApi.reopenJob(job.id, reason.trim()),
    onSuccess: () => {
      toast.success('Ish qayta ochildi — tuzatish jarayoni boshlandi');
      onDone();
      setOpen(false);
    },
    onError: (err) => {
      toast.error(getApiError(err).message);
      setOpen(false);
    },
  });

  return (
    <div className="mt-4">
      <Button variant="danger-outline" onClick={() => setOpen(true)}>
        <RotateCcw className="size-4" />
        Ishni qayta ochish
      </Button>
      <Modal
        open={open}
        onClose={reopenMutation.isPending ? () => {} : () => setOpen(false)}
        title="Ishni qayta ochish"
        className="sm:max-w-md"
      >
        <p className="text-sm text-[var(--text-2)]">
          <b className="text-[var(--text-1)]">#{job.id}</b> — {job.plateNumber} bo'yicha yakunlangan ish qayta ochiladi
          va tuzatish ishlariga qaytadi. Asl yakunlash, imzo va barcha tarixiy ma'lumotlar saqlanib qoladi. Sabab
          majburiy.
        </p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">Qayta ochish sababi (majburiy)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Masalan: reduktor sozlamasi talabga mos emas"
            className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25"
          />
        </label>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={reopenMutation.isPending}>
            Bekor qilish
          </Button>
          <Button
            variant="danger-outline"
            onClick={() => reopenMutation.mutate()}
            loading={reopenMutation.isPending}
            disabled={reason.trim().length < 3}
          >
            Qayta ochishni tasdiqlash
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** §24: quality accepts the corrected work — the second completion. */
function QualityReviewPanel({ job, onDone }: { job: Job; onDone: () => void }) {
  const { user: actor } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: () => jobsApi.confirmQuality(job.id),
    onSuccess: () => {
      toast.success('Sifat nazorati tasdiqlandi — ish yakunlandi');
      onDone();
      setConfirmOpen(false);
    },
    onError: (err) => {
      const e = getApiError(err);
      toast.error(e.details?.length ? e.details.map((d) => d.message).join(' · ') : e.message);
      setConfirmOpen(false);
    },
  });

  return (
    <div className="rounded-3xl border border-teal-500/30 bg-teal-500/5 p-5">
      <p className="flex items-center gap-2 font-bold text-teal-700">
        <ShieldCheck className="size-5" />
        Sifat nazoratida
      </p>
      <p className="mt-1 text-sm text-[var(--text-2)]">
        Tuzatilgan ish sifat nazorati tasdig'ini kutmoqda.
        {job.reopenReason ? ` Qayta ochish sababi: ${job.reopenReason}` : ''}
      </p>
      {can(actor, 'jobs.reopen') && (
        <Button size="lg" className="mt-3 w-full sm:w-auto" onClick={() => setConfirmOpen(true)}>
          <ShieldCheck className="size-5" />
          Sifat nazoratidan o'tkazish
        </Button>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Sifat nazoratini tasdiqlash"
        confirmLabel="Tasdiqlash — ish yakunlansin"
        loading={confirmMutation.isPending}
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        <b>#{job.id}</b> — {job.plateNumber} bo'yicha tuzatilgan ish qabul qilinadi va yakunlanadi. Server yakunlash
        shartlarini qayta tekshiradi.
      </ConfirmDialog>
    </div>
  );
}

/** Mobile-first canvas signature capture — the customer signs on the device. */
function SignaturePad({ jobId, onSaved }: { jobId: number; onSaved: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: (blob: Blob) => jobsApi.uploadSignature(jobId, blob),
    onSuccess: () => {
      // Success only after the server confirms a READY signature.
      toast.success('Mijoz imzosi saqlandi');
      onSaved();
    },
    onError: (err) => {
      const { message, retryable } = getUploadError(err);
      // The canvas ink is preserved (we never clear on failure) so a retry needs no re-signing.
      toast.error(message, retryable ? { description: 'Imzo saqlanmadi — qaytadan urinishingiz mumkin.' } : undefined);
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
    // Guard the async toBlob gap so a double tap cannot start two uploads.
    if (uploadMutation.isPending) return;
    canvasRef.current!.toBlob((blob) => {
      if (blob && !uploadMutation.isPending) uploadMutation.mutate(blob);
    }, 'image/png');
  };

  return (
    <div className="mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
        <PenLine className="size-4" />
        Mijoz tasdig'i va imzosi
      </p>
      <p className="mt-1 text-xs text-[var(--text-2)]">
        Mijoz bajarilgan ish bilan tanishib, quyida imzo qo'yadi. Imzo saqlangach o'zgartirib bo'lmaydi.
      </p>
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
          Tozalash
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          onClick={save}
          disabled={!hasInk}
          loading={uploadMutation.isPending}
        >
          <Check className="size-5" strokeWidth={3} />
          Imzoni saqlash
        </Button>
      </div>
    </div>
  );
}
