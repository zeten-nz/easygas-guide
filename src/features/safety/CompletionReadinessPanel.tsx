import { Check, X } from 'lucide-react';
import { readinessRows, blockingReasons, type CompletionReadiness } from './completion-blockers';

/**
 * Phase 10D completion-readiness panel (§22). Renders the SERVER's authoritative
 * readiness — condition rows (✓/✗ with a text status, never color alone) and the
 * server-provided blocking reasons. The frontend never recomputes the gate.
 */
export function CompletionReadinessPanel({ readiness }: { readiness: CompletionReadiness }) {
  const rows = readinessRows(readiness);
  const reasons = blockingReasons(readiness);
  return (
    <section aria-label="Yakunlash tayyorligi" className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <h3 className="text-sm font-semibold text-[var(--text-1)]">
        {readiness.canComplete ? 'Yakunlashga tayyor' : 'Yakunlash uchun bajarilishi kerak'}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2 text-sm">
            {r.ok ? (
              <Check className="size-4 text-[var(--success-fg,#166534)]" aria-hidden />
            ) : (
              <X className="size-4 text-[var(--danger-fg,#b91c1c)]" aria-hidden />
            )}
            <span className="text-[var(--text-2)]">{r.label}</span>
            {/* status also as text, so it never relies on colour alone */}
            <span className="ml-auto text-xs font-medium text-[var(--text-3)]">{r.ok ? 'OK' : 'kerak'}</span>
          </li>
        ))}
      </ul>
      {reasons.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-[var(--border)] pt-3" aria-label="To'siqlar">
          {reasons.map((reason, i) => (
            <li key={`${reason.code}-${i}`} className="text-sm text-[var(--danger-fg,#b91c1c)]" data-code={reason.code}>
              {reason.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
