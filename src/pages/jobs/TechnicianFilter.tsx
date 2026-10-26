import { useEffect, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronsUpDown, Loader2, X, UserRound } from 'lucide-react';
import { fetchTechnicians } from '../../api/jobs.api';
import { cn } from '../../lib/utils';

/**
 * Phase 11C — a BOUNDED, server-backed, debounced searchable selector for the
 * "responsible technician" job filter. It never fetches the whole user list: the
 * dropdown queries GET /jobs/technicians?search= (branch-scoped, ≤20), and the
 * selected id is resolved by id so its name shows after a reload even if it is not
 * on the first page. This is the RESPONSIBLE technician (jobs.assigned_technician_id),
 * NOT the photo uploader / step performer.
 */
export function TechnicianFilter({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Resolve the selected technician's display name by id (survives reload).
  const selected = useQuery({
    queryKey: ['jobs', 'technicians', 'byId', value],
    queryFn: () => fetchTechnicians({ id: value! }),
    enabled: value != null,
    staleTime: 60_000,
  });
  const selectedName = value != null ? (selected.data?.items[0]?.name ?? `#${value}`) : '';

  const list = useQuery({
    queryKey: ['jobs', 'technicians', 'search', debounced],
    queryFn: () => fetchTechnicians({ search: debounced || undefined, limit: 20 }),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const options = list.data?.items ?? [];

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (id: number | null) => { onChange(id); setOpen(false); setSearch(''); };

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Mas'ul texnik bo'yicha filtr"
          className="flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--field-bg)] px-3.5 text-left text-sm text-[var(--text-1)] focus:outline-none focus:ring-2 focus:ring-blue-500/25"
        >
          <span className={cn('flex items-center gap-2 truncate', value == null && 'text-[var(--field-placeholder)]')}>
            <UserRound className="size-4 shrink-0 text-[var(--text-3)]" aria-hidden />
            {value != null ? selectedName : "Mas'ul texnik"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-[var(--text-3)]" aria-hidden />
        </button>
        {value != null && (
          <button type="button" onClick={() => pick(null)} aria-label="Texnik filtrini tozalash" className="rounded-xl border border-[var(--border-1)] px-2 text-[var(--text-2)] hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-blue-500/25">
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface)] shadow-lg">
          <div className="p-2">
            <input
              autoFocus
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
                else if (e.key === 'Enter') { e.preventDefault(); const o = options[active]; if (o) pick(o.id); }
                else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
              }}
              placeholder="Qidiruv…"
              aria-label="Texnik qidirish"
              className="h-9 w-full rounded-lg border border-[var(--border-1)] bg-[var(--field-bg)] px-3 text-sm text-[var(--text-1)] outline-none placeholder:text-[var(--field-placeholder)] focus:ring-2 focus:ring-blue-500/25"
            />
          </div>
          <ul role="listbox" className="max-h-56 overflow-y-auto pb-1">
            {list.isFetching && options.length === 0 ? (
              <li className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-3)]"><Loader2 className="size-4 animate-spin" /> Yuklanmoqda…</li>
            ) : options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[var(--text-3)]">Texnik topilmadi</li>
            ) : (
              options.map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.id === value}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(o.id)}
                    className={cn('block w-full px-3 py-2 text-left text-sm text-[var(--text-1)]', (i === active || o.id === value) && 'bg-[var(--surface-2)]')}
                  >
                    {o.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
