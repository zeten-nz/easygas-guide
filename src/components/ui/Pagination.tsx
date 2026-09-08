import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  /** Uzbek noun for the counted rows, e.g. "xodim", "ish", "shablon". */
  noun: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

/**
 * Shared directory pagination. Shows a PERSISTENT summary (even for a single
 * page): "Jami N xodim · a–b ko'rsatilmoqda", a page-size selector (25 / 50), and
 * previous/next with the current page. Renders nothing when there are no rows —
 * the caller owns the empty state. All page/size changes are driven by the caller
 * (which keeps them in the URL), so Back/Forward restores the view.
 */
export function Pagination({
  page,
  pageSize,
  total,
  noun,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50],
}: PaginationProps) {
  if (total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border-1)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-2)]">
        Jami <span className="font-semibold text-[var(--text-1)]">{total}</span> {noun} ·{' '}
        <span className="tabular-nums">
          {start}–{end}
        </span>{' '}
        ko'rsatilmoqda
      </p>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
          <span className="hidden sm:inline">Sahifada</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Sahifadagi qatorlar soni"
            className="h-9 rounded-lg border border-[var(--border-1)] bg-[var(--surface)] px-2 text-sm text-[var(--text-1)] focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <PageButton
            aria-label="Oldingi sahifa"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </PageButton>
          <span className="min-w-[104px] text-center text-sm tabular-nums text-[var(--text-2)]">
            Sahifa <span className="font-semibold text-[var(--text-1)]">{page}</span> / {totalPages}
          </span>
          <PageButton
            aria-label="Keyingi sahifa"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="size-4" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  disabled,
  onClick,
  children,
  ...rest
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg border border-[var(--border-1)] bg-[var(--surface)] text-[var(--text-2)] transition-colors',
        'hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--surface)]',
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
