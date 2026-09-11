import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Car, ChevronLeft, ChevronRight, ChevronsRight, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import * as vehiclesApi from '../../api/vehicles.api';
import { getApiError } from '../../api/client';
import { displayPhone } from '../../lib/phone';
import { useT } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';

export function VehiclesPage() {
  const navigate = useNavigate();
  const t = useT();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params: vehiclesApi.ListVehiclesParams = {
    page,
    limit: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', 'list', params],
    queryFn: () => vehiclesApi.fetchVehicles(params),
    placeholderData: keepPreviousData,
  });

  const total = vehiclesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-1)]">{t('m.vehicles.title')}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">{t('m.vehicles.subtitle')}</p>
      </div>

      <div className="mt-5">
        <Input
          placeholder={t('m.vehicles.searchPlaceholder')}
          leftIcon={<Search className="size-[18px]" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('m.vehicles.searchAria')}
        />
      </div>

      <div className="mt-5 space-y-3">
        {vehiclesQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {vehiclesQuery.isError && <Alert tone="error">{localizeApiError(getApiError(vehiclesQuery.error).code, t)}</Alert>}

        {vehiclesQuery.data && vehiclesQuery.data.vehicles.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Car className="size-8" />
            <p className="text-sm">{debouncedSearch ? t('m.vehicles.notFound') : t('m.vehicles.empty')}</p>
          </div>
        )}

        {vehiclesQuery.data?.vehicles.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => navigate(`/app/customers/${v.customerId}`)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-brand-500/40"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[var(--text-1)]">
                  {v.plateNumber}
                </span>
                <p className="font-semibold text-[var(--text-1)]">
                  {v.make} {v.model}
                  {v.year ? ` · ${v.year}` : ''}
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--text-2)]">
                {v.customerName} · {displayPhone(v.customerPhone)}
              </p>
            </div>
            <ChevronsRight className="size-5 shrink-0 text-[var(--text-2)]" />
          </button>
        ))}
      </div>

      {total > 25 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[var(--text-2)]">{t('m.list.pageSummary', { total, page, totalPages })}</p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label={t('ui.pagination.prev')}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label={t('ui.pagination.next')}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
