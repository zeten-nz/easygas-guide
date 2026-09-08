import { useEffect, useId, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getApiError } from '../../api/client';
import { getReferenceById, listReference } from '../../api/reference.api';
import type { ReferenceItem, ReferenceKind } from '../../types/catalog';

const PAGE = 20;

interface Props {
  kind: ReferenceKind;
  value: number | null;
  onChange: (id: number | null) => void;
  label?: string;
  placeholder?: string;
  /** Filters: render a clear (×) affordance and an "all" empty state. */
  allowClear?: boolean;
  error?: string;
  /** aria-label when there is no visible label (e.g. table filters). */
  ariaLabel?: string;
}

/**
 * Bounded, server-backed reference selector. It NEVER fetches the whole list:
 * results are paged (20 at a time via useInfiniteQuery) behind a debounced
 * search, with "load more" to reach entries past the first page. The selected
 * value is loaded BY ID (getReferenceById) so it displays correctly even when it
 * is archived or lies beyond the current results — but the search list itself
 * only offers ACTIVE values, so an archived value can be shown (on edit) yet
 * never NEWLY selected. Keyboard: ↑/↓ move, Enter selects, Esc closes;
 * loading/empty/error states are surfaced.
 */
export function RefCombobox({ kind, value, onChange, label, placeholder = 'Tanlang', allowClear = false, error, ariaLabel }: Props) {
  const queryClient = useQueryClient();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load the selected value by id (works for archived / off-page values).
  const selected = useQuery({
    queryKey: ['reference', kind, 'byId', value],
    queryFn: () => getReferenceById(kind, value!),
    enabled: value != null,
    staleTime: 60_000,
  });

  // Debounce the search (setState is inside the timeout — asynchronous).
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Paged, bounded results — a new `debounced` term starts a fresh query at page 1.
  const list = useInfiniteQuery({
    queryKey: ['reference', kind, 'combobox', debounced],
    queryFn: ({ pageParam }) => listReference(kind, { status: 'ACTIVE', ...(debounced ? { search: debounced } : {}), limit: PAGE, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (all.reduce((n, p) => n + p.items.length, 0) < last.total ? all.length + 1 : undefined),
    enabled: open,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const openMenu = () => {
    setSearch('');
    setDebounced('');
    setActive(0);
    setOpen(true);
  };

  const pick = (item: ReferenceItem) => {
    // Prime the by-id cache so the label shows instantly (no refetch flash).
    queryClient.setQueryData(['reference', kind, 'byId', item.id], item);
    onChange(item.id);
    setOpen(false);
    setSearch('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[active]) pick(items[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  const selectedLabel = value == null ? '' : selected.data ? refLabel(selected.data) : selected.isLoading ? '…' : `#${value}`;
  const isArchived = selected.data?.status === 'ARCHIVED';

  return (
    <div className="w-full" ref={rootRef}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--text-1)]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          onClick={() => (open ? setOpen(false) : openMenu())}
          className={cn(
            'flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-[var(--field-bg)] px-3.5 text-left text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/25',
            error ? 'border-red-500/60' : 'border-[var(--border-1)] focus:border-blue-500/70',
          )}
        >
          <span className={cn('truncate', !value && 'text-[var(--text-3)]')}>
            {value ? selectedLabel : placeholder}
            {isArchived && <span className="ml-2 text-xs text-amber-600">(arxivlangan)</span>}
          </span>
          <span className="flex items-center gap-1">
            {allowClear && value != null && (
              <X
                className="size-4 text-[var(--text-3)] hover:text-[var(--text-1)]"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                role="button"
                aria-label="Tozalash"
              />
            )}
            <ChevronsUpDown className="size-4 text-[var(--text-3)]" />
          </span>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface)] shadow-xl">
            <div className="border-b border-[var(--border-1)] p-2">
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Qidiruv…"
                aria-controls={`${id}-listbox`}
                aria-autocomplete="list"
                className="h-9 w-full rounded-lg border border-[var(--border-1)] bg-[var(--field-bg)] px-3 text-sm focus:border-blue-500/70 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
              />
            </div>
            <ul id={`${id}-listbox`} role="listbox" className="max-h-60 overflow-y-auto py-1">
              {list.isLoading ? (
                <li className="flex items-center justify-center gap-2 py-6 text-sm text-[var(--text-2)]">
                  <Loader2 className="size-4 animate-spin" /> Yuklanmoqda…
                </li>
              ) : list.isError ? (
                <li className="px-3 py-4 text-sm text-red-600">
                  {getApiError(list.error).message}{' '}
                  <button type="button" className="underline" onClick={() => list.refetch()}>
                    Qayta urinish
                  </button>
                </li>
              ) : items.length === 0 ? (
                <li className="py-6 text-center text-sm text-[var(--text-2)]">Topilmadi</li>
              ) : (
                items.map((it, i) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={it.id === value}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => pick(it)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm',
                        i === active ? 'bg-[var(--surface-2)]' : '',
                      )}
                    >
                      <span className="truncate">{refLabel(it)}</span>
                      {it.id === value && <Check className="size-4 text-blue-600" />}
                    </button>
                  </li>
                ))
              )}
              {list.hasNextPage && (
                <li className="p-1">
                  <button
                    type="button"
                    onClick={() => list.fetchNextPage()}
                    disabled={list.isFetchingNextPage}
                    className="w-full rounded-lg py-2 text-center text-sm font-medium text-blue-700 hover:bg-[var(--surface-2)] disabled:opacity-50"
                  >
                    {list.isFetchingNextPage ? 'Yuklanmoqda…' : `Yana yuklash (${items.length}/${total})`}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function refLabel(it: ReferenceItem): string {
  return it.code ? `${it.code} — ${it.name}` : it.name;
}
