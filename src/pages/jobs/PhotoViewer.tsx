import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import * as jobsApi from '../../api/jobs.api';
import type { JobPhoto } from '../../api/jobs.api';
import { useT } from '../../i18n/i18n';
import { EvidenceMeta } from './evidence-badges';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])';
const ZOOMS = [1, 2, 3];

/**
 * Accessible full-screen photo viewer (lightbox). Interactive controls live in the
 * TOP bar and vertically-centred side arrows — never a bottom-anchored footer —
 * because on the CI mobile emulation the layout viewport is taller than the visual
 * viewport, so bottom-flush controls fall below the clickable screen (the Phase 11B
 * modal lesson). Keyboard: ←/→ navigate, +/-/0 zoom, Esc closes; focus is trapped
 * and restored. Images stream from the authorized backend endpoint (no signed URLs),
 * so a load error means the object is unavailable — a bounded manual retry re-requests
 * it; there is no auto-reload loop.
 */
export function PhotoViewer({
  jobId,
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  jobId: number;
  photos: JobPhoto[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const t = useT();
  const overlayRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const photo = photos[index];
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const atStart = index <= 0;
  const atEnd = index >= photos.length - 1;

  const go = useCallback((delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= photos.length) return;
    onIndexChange(next);
  }, [index, photos.length, onIndexChange]);

  // Reset zoom/pan/load-state when the shown photo changes — done during render
  // (the app's established pattern) rather than in an effect, so there is no
  // cascading-render setState-in-effect.
  const [shownId, setShownId] = useState(photo?.id);
  if (photo && photo.id !== shownId) {
    setShownId(photo.id);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setState('loading');
    setReloadKey(0);
  }

  const zoomTo = useCallback((z: number) => { setZoom(z); if (z === 1) setPan({ x: 0, y: 0 }); }, []);
  const stepZoom = useCallback((dir: 1 | -1) => {
    setZoom((z) => {
      const i = ZOOMS.indexOf(z);
      const ni = Math.min(ZOOMS.length - 1, Math.max(0, (i === -1 ? 0 : i) + dir));
      const nz = ZOOMS[ni];
      if (nz === 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  }, []);

  // Focus trap + keyboard + scroll lock (mirrors the Modal's a11y contract).
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCloseRef.current(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); stepZoom(1); return; }
      if (e.key === '-') { e.preventDefault(); stepZoom(-1); return; }
      if (e.key === '0') { e.preventDefault(); zoomTo(1); return; }
      if (e.key !== 'Tab') return;
      const items = Array.from(overlayRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (items.length === 0) { e.preventDefault(); overlayRef.current?.focus(); return; }
      const first = items[0]; const last = items[items.length - 1]; const active = document.activeElement;
      if (e.shiftKey && (active === first || active === overlayRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    overlayRef.current?.querySelector<HTMLElement>('[data-viewer-close]')?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; previouslyFocused?.focus?.(); };
  }, [go, stepZoom, zoomTo]);

  if (!photo) return null;
  const src = `${jobsApi.stepPhotoUrl(jobId, photo.jobStepId, photo.id)}${reloadKey ? `?_r=${reloadKey}` : ''}`;

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom === 1) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('jb.viewer.dialogAria', { n: index + 1, total: photos.length, step: photo.stepName })}
      tabIndex={-1}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Top bar — all controls here (never bottom-flush). */}
      <div className="flex shrink-0 items-center justify-between gap-2 p-3 sm:p-4">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => stepZoom(-1)} disabled={zoom <= ZOOMS[0]} aria-label={t('jb.viewer.zoomOut')} className="rounded-lg bg-white/10 p-2 hover:bg-white/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><ZoomOut className="size-5" /></button>
          <button type="button" onClick={() => stepZoom(1)} disabled={zoom >= ZOOMS[ZOOMS.length - 1]} aria-label={t('jb.viewer.zoomIn')} className="rounded-lg bg-white/10 p-2 hover:bg-white/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><ZoomIn className="size-5" /></button>
          <button type="button" onClick={() => zoomTo(1)} disabled={zoom === 1} aria-label={t('jb.viewer.reset')} className="rounded-lg bg-white/10 p-2 hover:bg-white/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><RotateCcw className="size-5" /></button>
          <span className="ml-1 text-sm tabular-nums text-white/70" aria-live="polite">{Math.round(zoom * 100)}%</span>
        </div>
        <span className="text-sm font-medium tabular-nums" aria-live="polite">{index + 1} / {photos.length}</span>
        <button type="button" data-viewer-close onClick={onClose} aria-label={t('common.close')} className="rounded-lg bg-white/10 p-2 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><X className="size-5" /></button>
      </div>

      {/* Caption directly under the top bar (kept OFF the bottom edge). */}
      <div className="shrink-0 px-3 pb-2 sm:px-4">
        <p className="text-sm font-semibold">{photo.stepName}</p>
        <EvidenceMeta photo={photo} className="text-white/70" />
      </div>

      {/* Image stage */}
      <div className="relative min-h-0 flex-1 select-none overflow-hidden">
        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70"><Loader2 className="size-8 animate-spin" /></div>
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="size-10 text-[var(--warning)]" />
            <p className="max-w-sm text-sm text-white/80">{t('jb.viewer.loadError')}</p>
            <button type="button" onClick={() => { setState('loading'); setReloadKey((k) => k + 1); }} className="rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">{t('common.retry')}</button>
          </div>
        )}
        <img
          key={src}
          src={src}
          alt={t('jb.viewer.imgAlt', { step: photo.stepName, uploader: photo.uploadedByName, attempt: photo.attempt })}
          draggable={false}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          onDoubleClick={() => zoomTo(zoom === 1 ? 2 : 1)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="absolute inset-0 m-auto max-h-full max-w-full object-contain transition-transform duration-100"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'default', visibility: state === 'ready' ? 'visible' : 'hidden', touchAction: zoom > 1 ? 'none' : 'pan-y' }}
        />

        {/* Side navigation — vertically centred (reachable on mobile, off the bottom). */}
        {!atStart && (
          <button type="button" onClick={() => go(-1)} aria-label={t('jb.viewer.prev')} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><ChevronLeft className="size-6" /></button>
        )}
        {!atEnd && (
          <button type="button" onClick={() => go(1)} aria-label={t('jb.viewer.next')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"><ChevronRight className="size-6" /></button>
        )}
      </div>
    </div>
  );
}
