import { Ban } from 'lucide-react';
import type { MatrixCell, MatrixDefinition } from '../../api/safety.api';
import { LEVEL_META } from './risk-levels';
import { cn } from '../../lib/utils';

/**
 * Accessible risk-matrix grid rendered ENTIRELY from the server-provided cells +
 * definition (no thresholds hardcoded in React). Rows = severity (og'irlik),
 * columns = likelihood (ehtimollik). Each cell states its level in words and marks
 * a blocking level with an icon + text — colour is a supplement, never the only
 * signal. Scrolls horizontally inside its own container on narrow screens.
 */
export function RiskMatrixTable({ cells, definition, highlight }: {
  cells: MatrixCell[];
  definition: MatrixDefinition;
  highlight?: { severity: number; likelihood: number } | null;
}) {
  const byKey = new Map(cells.map((c) => [`${c.severity}:${c.likelihood}`, c]));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] border-collapse text-center text-sm">
        <caption className="sr-only">Xavf matritsasi: og'irlik (qatorlar) × ehtimollik (ustunlar) bo'yicha daraja</caption>
        <thead>
          <tr>
            <th scope="col" className="p-2 text-xs font-semibold text-[var(--text-2)]">
              Og'irlik ↓ / Ehtimollik →
            </th>
            {definition.allowedLikelihood.map((l) => (
              <th key={l} scope="col" className="p-2 text-sm font-semibold text-[var(--text-1)]">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {definition.allowedSeverity.map((s) => (
            <tr key={s}>
              <th scope="row" className="p-2 text-sm font-semibold text-[var(--text-1)]">{s}</th>
              {definition.allowedLikelihood.map((l) => {
                const c = byKey.get(`${s}:${l}`);
                if (!c) return <td key={l} className="p-2 text-[var(--text-3)]">—</td>;
                const meta = LEVEL_META[c.level];
                const isHi = highlight && highlight.severity === s && highlight.likelihood === l;
                return (
                  <td key={l} className="p-1">
                    <div
                      className={cn('flex flex-col items-center gap-0.5 rounded-lg px-1.5 py-2', meta.cell, isHi && 'ring-2 ring-offset-1 ring-[var(--text-1)]')}
                      aria-label={`Og'irlik ${s}, ehtimollik ${l}: ${meta.label}${c.blocking ? ', bloklovchi' : ''}`}
                    >
                      <span className="font-semibold">{meta.label}</span>
                      <span className="text-xs opacity-80">ball {c.score}</span>
                      {c.blocking && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase">
                          <Ban className="size-3" aria-hidden /> Bloklovchi
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
