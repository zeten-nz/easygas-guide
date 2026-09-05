import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { JobStatusBadge } from './JobStatusBadge';
import { myJobs } from '../../api/safety.api';
import { getApiError } from '../../api/client';

interface MyJob {
  id: number;
  status: string;
  cycle: number;
  assignment_status: string;
  plate_number: string;
  customer_name: string;
}

/**
 * Phase 10D "My assigned jobs" — the technician's responsibility queue
 * (GET /jobs/mine). Server-scoped: a technician sees only jobs assigned to them
 * (no cross-branch data). Loading / empty / error+retry states.
 */
export function MyJobsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const query = useQuery({
    queryKey: ['jobs', 'mine', page],
    queryFn: () => myJobs({ page }),
    placeholderData: keepPreviousData,
  });

  const items = (query.data?.items ?? []) as MyJob[];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--text-1)]">Menga biriktirilgan ishlar</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Siz mas'ul texnik sifatida biriktirilgan ishlar</p>
      </div>

      {query.isLoading && (
        <div className="flex justify-center py-16" data-testid="my-jobs-loading">
          <Spinner />
        </div>
      )}

      {query.isError && (
        <Alert tone="error">
          <div className="flex items-center justify-between gap-3">
            <span>{getApiError(query.error).message}</span>
            <Button variant="secondary" onClick={() => query.refetch()}>
              Qayta urinish
            </Button>
          </div>
        </Alert>
      )}

      {query.isSuccess && items.length === 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] py-16 text-center">
          <Briefcase className="mx-auto size-8 text-[var(--text-3)]" aria-hidden />
          <p className="mt-3 text-sm text-[var(--text-2)]">Sizga hali ish biriktirilmagan.</p>
        </div>
      )}

      {query.isSuccess && items.length > 0 && (
        <ul className="space-y-2" aria-label="Biriktirilgan ishlar">
          {items.map((j) => (
            <li key={j.id}>
              <button
                type="button"
                onClick={() => navigate(`/app/jobs/${j.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4 text-left transition hover:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-1)]">{j.plate_number}</span>
                    {j.assignment_status === 'LEGACY_UNASSIGNED' && (
                      <span className="rounded bg-[var(--warning-bg,#fef3c7)] px-1.5 py-0.5 text-xs font-medium text-[var(--warning-fg,#92400e)]">
                        Eski (biriktirilmagan)
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm text-[var(--text-2)]">{j.customer_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <JobStatusBadge status={j.status as never} />
                  <ChevronRight className="size-4 text-[var(--text-3)]" aria-hidden />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Oldingi">
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm text-[var(--text-2)]">
            {page} / {totalPages}
          </span>
          <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Keyingi">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
