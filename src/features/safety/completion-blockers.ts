/**
 * Phase 10D completion-readiness display (loyiha.md §22). The backend returns
 * the authoritative readiness (canComplete + reasons + conditions); this ONLY
 * maps it to labels for the UI — it never decides completion itself.
 */
import type { MessageKey } from '../../i18n/types';

export interface CompletionReadiness {
  canComplete: boolean;
  reasons: { code: string; message: string }[];
  conditions: {
    checklist: boolean;
    stops: boolean;
    photos: boolean;
    measurements: boolean;
    risks: boolean;
    signature: boolean;
  };
}

export interface BlockerRow {
  key: keyof CompletionReadiness['conditions'];
  /** @deprecated Uzbek-only fallback text — prefer `labelKey` + `t()` for locale-aware rendering. */
  label: string;
  labelKey: MessageKey;
  ok: boolean;
}

const CONDITION_LABELS: Record<keyof CompletionReadiness['conditions'], { label: string; labelKey: MessageKey }> = {
  checklist: { label: 'Barcha bosqichlar bajarilgan', labelKey: 'jb.blocker.checklist' },
  stops: { label: 'Barcha STOP tasdiqlangan', labelKey: 'jb.blocker.stops' },
  photos: { label: 'Kerakli fotolar yuklangan', labelKey: 'jb.blocker.photos' },
  measurements: { label: "O'lchovlar to'g'ri", labelKey: 'jb.blocker.measurements' },
  risks: { label: 'Hal qilinmagan kritik xavf yo\'q', labelKey: 'jb.blocker.risks' },
  signature: { label: 'Mijoz imzosi olingan', labelKey: 'jb.cond.signature' },
};

/** Ordered condition rows for the readiness checklist UI (✓/✗). */
export function readinessRows(readiness: CompletionReadiness): BlockerRow[] {
  return (Object.keys(CONDITION_LABELS) as (keyof CompletionReadiness['conditions'])[]).map((key) => ({
    key,
    label: CONDITION_LABELS[key].label,
    labelKey: CONDITION_LABELS[key].labelKey,
    ok: readiness.conditions[key],
  }));
}

/** The blocking reasons to surface (empty when ready). Server-provided messages. */
export function blockingReasons(readiness: CompletionReadiness): { code: string; message: string }[] {
  return readiness.canComplete ? [] : readiness.reasons;
}

/**
 * Whether a completion/signature error means the customer must RE-SIGN because
 * the accepted work summary is stale (Phase 10D §23). The UI should re-fetch the
 * signable summary and prompt a fresh signature rather than treating it as a
 * generic failure.
 */
const RESIGN_CODES = new Set(['SIGNATURE_STALE', 'SUMMARY_STALE']);
export function isReSignRequired(code: string | undefined): boolean {
  return code != null && RESIGN_CODES.has(code);
}
