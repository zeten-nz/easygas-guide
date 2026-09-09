import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Briefcase, ChevronsRight, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/ui/Pagination';
import { JobStatusBadge } from './JobStatusBadge';
import { useAuth } from '../../features/auth/auth-context';
import { useTableParams } from '../../lib/useTableParams';
import * as jobsApi from '../../api/jobs.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from '../../types/entities';

export function JobsPage() {
  const { user: actor } = useAuth();
  const navigate = useNavigate();
  const { page, pageSize, filters, setPage, setPageSize, setFilter } = useTableParams(
    ['search', 'status', 'branchId', 'dateFrom', 'dateTo'],
    { defaultPageSize: 25 },
  );

  const [searchInput, setSearchInput] = useState(filters.search);
  // Adjust the input when the URL search changes externally (e.g. browser Back).
  const [prevUrlSearch, setPrevUrlSearch] = useState(filters.search);
  if (filters.search !== prevUrlSearch) {
    setPrevUrlSearch(filters.search);
    setSearchInput(filters.search);
  }
  useEffect(() => {
    if (searchInput === filters.search) return;
    const t = setTimeout(() => setFilter('search', searchInput.trim(), true), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Branch filter is meaningful only for all-branch viewers (SIFAT/ADMIN);
  // for everyone else the backend confines results to their own branch anyway.
  const seesAllBranches = can(actor, 'services.view_all');
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, enabled: seesAllBranches });

  const params: jobsApi.ListJobsParams = {
    page,
    limit: pageSize,
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.status ? { status: filters.status as JobStatus } : {}),
    ...(filters.branchId ? { branchId: Number(filters.branchId) } : {}),
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
  };

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'list', params],
    queryFn: () => jobsApi.fetchJobs(params),
    placeholderData: keepPreviousData,
  });

  const total = jobsQuery.data?.total ?? 0;
  const jobs = jobsQuery.data?.jobs ?? [];

  useEffect(() => {
    if (jobsQuery.isPlaceholderData) return;
    if (total > 0 && jobs.length === 0 && page > 1) setPage(Math.max(1, Math.ceil(total / pageSize)));
  }, [jobsQuery.isPlaceholderData, total, jobs.length, page, pageSize, setPage]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-1)]">Ishlar</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {seesAllBranches ? 'Barcha filiallardagi ishlar' : "O'z filialingizdagi ishlar"}
          </p>
        </div>
        {can(actor, 'jobs.create') && (
          <Button onClick={() => navigate('/app/jobs/new')}>
            <Plus className="size-4" />
            Yangi ish ochish
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder="№, davlat raqami, mijoz…"
          leftIcon={<Search className="size-[18px]" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label="Ish qidirish"
        />
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label="Holat bo'yicha filtr">
          <option value="">Barcha holatlar</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        {seesAllBranches && (
          <Select value={filters.branchId} onChange={(e) => setFilter('branchId', e.target.value)} aria-label="Filial bo'yicha filtr">
            <option value="">Barcha filiallar</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
        <Input type="date" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} aria-label="Sanadan (yaratilgan)" label="Sanadan" />
        <Input type="date" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} aria-label="Sanagacha (yaratilgan)" label="Sanagacha" />
      </div>

      <div className="mt-5 space-y-3">
        {jobsQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : jobsQuery.isError ? (
          <Alert tone="error">{getApiError(jobsQuery.error).message}</Alert>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Briefcase className="size-8 text-[var(--text-3)]" />
            <p className="text-sm">{filters.search || filters.status ? 'Ish topilmadi' : "Hozircha ishlar yo'q"}</p>
          </div>
        ) : (
          jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              onClick={() => navigate(`/app/jobs/${job.id}`)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-blue-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[var(--text-1)]">#{job.id}</span>
                  <span className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[var(--text-1)]">
                    {job.plateNumber}
                  </span>
                  <JobStatusBadge status={job.status} />
                </div>
                <p className="mt-1.5 text-sm text-[var(--text-2)]">
                  {job.make} {job.model} · {job.customerName} · {displayPhone(job.customerPhone)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-2)]">
                  {job.branchName} · {new Date(job.createdAt).toLocaleDateString('uz-UZ')}
                </p>
              </div>
              <ChevronsRight className="size-5 shrink-0 text-[var(--text-3)]" />
            </button>
          ))
        )}
      </div>

      {total > 0 && (
        <div className="mt-4">
          <Pagination page={page} pageSize={pageSize} total={total} noun="ish" onPageChange={setPage} onPageSizeChange={setPageSize} />
        </div>
      )}
    </div>
  );
}
