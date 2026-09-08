import { useSearchParams } from 'react-router-dom';

const ALLOWED_PAGE_SIZES = [25, 50];

function clampPageSize(n: number, fallback: number): number {
  return ALLOWED_PAGE_SIZES.includes(n) ? n : fallback;
}

export interface TableParams {
  page: number;
  pageSize: number;
  /** Current value of each managed filter key ('' when unset). */
  filters: Record<string, string>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  /**
   * Set (or clear, when value is '') a filter and reset to page 1. Pass
   * replace=true for high-frequency updates (a debounced search box) so typing
   * does not flood the history; discrete controls (selects) push so Back undoes them.
   */
  setFilter: (key: string, value: string, replace?: boolean) => void;
}

/**
 * Keeps directory pagination + filters in the URL search params, so the view is
 * shareable, survives reload, and is restored by browser Back/Forward. Changing a
 * filter or the page size always resets to page 1 (so you never land on an
 * out-of-range page). The list of managed filter keys is passed in.
 */
export function useTableParams(filterKeys: string[], opts?: { defaultPageSize?: number }): TableParams {
  const [sp, setSp] = useSearchParams();
  const defaultPageSize = opts?.defaultPageSize ?? 25;

  const page = Math.max(1, Number(sp.get('page')) || 1);
  const pageSize = clampPageSize(Number(sp.get('pageSize')) || defaultPageSize, defaultPageSize);
  const filters: Record<string, string> = {};
  for (const k of filterKeys) filters[k] = sp.get(k) ?? '';

  const update = (mutate: (next: URLSearchParams) => void, replace: boolean) => {
    const next = new URLSearchParams(sp);
    mutate(next);
    setSp(next, { replace });
  };

  const setPage = (p: number) => update((n) => n.set('page', String(Math.max(1, p))), false);

  const setPageSize = (s: number) =>
    update((n) => {
      n.set('pageSize', String(clampPageSize(s, defaultPageSize)));
      n.set('page', '1');
    }, false);

  const setFilter = (key: string, value: string, replace = false) =>
    update((n) => {
      if (value) n.set(key, value);
      else n.delete(key);
      n.set('page', '1');
    }, replace);

  return { page, pageSize, filters, setPage, setPageSize, setFilter };
}
