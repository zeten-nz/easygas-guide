import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useT } from '../../i18n/i18n';

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
 * Shared directory pagination. Shows a PERSISTENT, count-agnostic summary
 * (even for a single page) — the caller's `noun` is intentionally not used in
 * the sentence, since it cannot be correctly declined for every locale — plus
 * a page-size selector (25 / 50) and previous/next with the current page.
 * Renders nothing when there are no rows — the caller owns the empty state.
 * All page/size changes are driven by the caller (which keeps them in the
 * URL), so Back/Forward restores the view.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50],
}: PaginationProps) {
  const t = useT();
  if (total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border-1)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-2)]">{t('m.pagination.summary', { total, from: start, to: end })}</p>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[var(--text-2)]">
          <span className="hidden sm:inline">{t('m.pagination.perPage')}</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label={t('ui.pagination.rowsPerPage')}
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
            aria-label={t('ui.pagination.prev')}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="size-4" />
          </PageButton>
          <span className="min-w-[104px] text-center text-sm tabular-nums text-[var(--text-2)]">
            {t('m.pagination.page', { page, total: totalPages })}
          </span>
          <PageButton
            aria-label={t('ui.pagination.next')}
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
