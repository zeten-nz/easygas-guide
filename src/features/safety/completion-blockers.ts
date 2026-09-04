/**
 * Phase 10D completion-readiness display (loyiha.md §22). The backend returns
 * the authoritative readiness (canComplete + reasons + conditions); this ONLY
 * maps it to labels for the UI — it never decides completion itself.
 */

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
  label: string;
  ok: boolean;
}

const CONDITION_LABELS: Record<keyof CompletionReadiness['conditions'], string> = {
  checklist: 'Barcha bosqichlar bajarilgan',
  stops: 'Barcha STOP tasdiqlangan',
  photos: 'Kerakli fotolar yuklangan',
  measurements: "O'lchovlar to'g'ri",
  risks: 'Hal qilinmagan kritik xavf yo\'q',
  signature: 'Mijoz imzosi olingan',
};

/** Ordered condition rows for the readiness checklist UI (✓/✗). */
export function readinessRows(readiness: CompletionReadiness): BlockerRow[] {
  return (Object.keys(CONDITION_LABELS) as (keyof CompletionReadiness['conditions'])[]).map((key) => ({
    key,
    label: CONDITION_LABELS[key],
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
