import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, MapPinOff } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { GpsCaptureButton } from '../../features/safety/GpsCaptureButton';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { getApiError } from '../../api/client';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import * as safety from '../../api/safety.api';
import * as jobsApi from '../../api/jobs.api';
import type { GpsReading } from '../../features/safety/gps';

/**
 * Phase 10D §20: GPS capture is embedded into the job-start action. Location is
 * requested ONLY on an explicit click, the reading is sent to the server (which
 * re-validates and is authoritative), and an authorized role may record an
 * OVERRIDE with a reason when GPS is unavailable. GPS is evidence, NOT a
 * completion gate — start is never blocked on it, but it is captured here as the
 * natural moment of installation.
 */
export function StartJobModal({
  jobId,
  plateNumber,
  open,
  onClose,
  onStarted,
}: {
  jobId: number;
  plateNumber: string;
  open: boolean;
  onClose: () => void;
  onStarted: () => void;
}) {
  const t = useT();
  const { user: actor } = useAuth();
  const mayOverride = can(actor, 'gps.override');
  const [gpsState, setGpsState] = useState<'none' | 'captured' | 'overridden'>('none');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const captureMutation = useMutation({
    mutationFn: (r: GpsReading) =>
      safety.captureGps(jobId, {
        latitude: r.latitude,
        longitude: r.longitude,
        accuracy: r.accuracy,
        clientTimestamp: r.clientTimestamp,
        purpose: 'JOB_START',
      }),
    onSuccess: () => {
      setGpsState('captured');
      toast.success(t('jb.start.gpsCapturedToast'));
    },
    onError: (err) => {
      toast.error(localizeApiError(getApiError(err).code, t));
    },
  });

  const overrideMutation = useMutation({
    mutationFn: () => safety.overrideGps(jobId, overrideReason.trim(), 'JOB_START'),
    onSuccess: () => {
      setGpsState('overridden');
      setOverrideOpen(false);
      toast.success(t('jb.start.gpsOverrideToast'));
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  const startMutation = useMutation({
    mutationFn: () => jobsApi.startJob(jobId),
    onSuccess: () => {
      toast.success(t('jb.start.startedToast'));
      onStarted();
      reset();
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  const reset = () => {
    setGpsState('none');
    setOverrideOpen(false);
    setOverrideReason('');
  };

  const busy = startMutation.isPending || captureMutation.isPending;

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : () => { onClose(); reset(); }}
      title={t('jb.start.title')}
      className="sm:max-w-md"
    >
      <p className="text-sm text-[var(--text-2)]">
        <b className="text-[var(--text-1)]">#{jobId}</b> {t('jb.start.intro', { plate: plateNumber })}
      </p>

      <div className="mt-4 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-3.5">
        {gpsState === 'captured' ? (
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--success-fg)]">
            <CheckCircle2 className="size-4.5" aria-hidden />
            {t('jb.start.gpsCaptured')}
          </p>
        ) : gpsState === 'overridden' ? (
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--warning-fg)]">
            <MapPinOff className="size-4.5" aria-hidden />
            {t('jb.start.gpsOverridden')}
          </p>
        ) : (
          <>
            <GpsCaptureButton onCaptured={(r) => captureMutation.mutate(r)} />
            {mayOverride && !overrideOpen && (
              <button
                type="button"
                onClick={() => setOverrideOpen(true)}
                className="mt-2 text-xs font-medium text-[var(--text-2)] underline hover:text-[var(--text-1)]"
              >
                {t('jb.start.overrideOpen')}
              </button>
            )}
            {mayOverride && overrideOpen && (
              <div className="mt-2">
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder={t('jb.overrideReason')}
                  className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3 py-2 text-sm text-[var(--text-1)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
                />
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={() => overrideMutation.mutate()}
                  loading={overrideMutation.isPending}
                  disabled={overrideReason.trim().length < 3}
                >
                  {t('jb.start.overrideSave')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={() => { onClose(); reset(); }} disabled={busy}>
          {t('common.cancel')}
        </Button>
        <Button onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
          {t('jb.start.title')}
        </Button>
      </div>
    </Modal>
  );
}
