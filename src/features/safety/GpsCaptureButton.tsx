import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { captureLocation, gpsErrorMessageKey, isLowAccuracy, GpsError, type GpsReading } from './gps';
import { useT } from '../../i18n/i18n';

type State =
  | { kind: 'idle' }
  | { kind: 'requesting' }
  | { kind: 'success'; reading: GpsReading; lowAccuracy: boolean }
  | { kind: 'error'; message: string };

/**
 * Phase 10D GPS capture control (§20). Requests the browser location ONLY after
 * an explicit click (never on mount), explains why first, shows every outcome
 * (requesting/success/denied/unavailable/timeout/low-accuracy), allows retry,
 * shows accuracy, and never fabricates a coordinate. `geo` is injectable for
 * tests. The server re-validates and is authoritative.
 */
export function GpsCaptureButton({
  onCaptured,
  maxAccuracyMeters = 100,
  geo,
}: {
  onCaptured: (r: GpsReading) => void;
  maxAccuracyMeters?: number;
  geo?: Geolocation;
}) {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const t = useT();

  async function capture() {
    setState({ kind: 'requesting' });
    try {
      const reading = await captureLocation(geo);
      const lowAccuracy = isLowAccuracy(reading, maxAccuracyMeters);
      setState({ kind: 'success', reading, lowAccuracy });
      if (!lowAccuracy) onCaptured(reading);
    } catch (err) {
      const message = err instanceof GpsError ? t(gpsErrorMessageKey(err.kind)) : t('m.gps.detectFailed');
      setState({ kind: 'error', message });
    }
  }

  return (
    <div>
      <p className="text-sm text-[var(--text-2)]">{t('m.gps.intro')}</p>
      <div className="mt-2">
        <Button type="button" onClick={capture} loading={state.kind === 'requesting'}>
          <MapPin className="size-4" />
          {state.kind === 'idle' ? t('m.gps.capture') : t('common.retry')}
        </Button>
      </div>

      {state.kind === 'success' && (
        <p className="mt-2 text-sm" role="status">
          {t('m.gps.captured', { accuracy: Math.round(state.reading.accuracy) })}
          {state.lowAccuracy && (
            <span className="ml-1 text-[var(--danger-fg,#b91c1c)]">{t('m.gps.lowAccuracy')}</span>
          )}
        </p>
      )}
      {state.kind === 'error' && (
        <p className="mt-2 text-sm text-[var(--danger-fg,#b91c1c)]" role="alert">
          {state.message}
        </p>
      )}
    </div>
  );
}
