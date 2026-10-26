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
import { JobStatusBadge, jobStatusLabel } from './JobStatusBadge';
import { TechnicianFilter } from './TechnicianFilter';
import { useAuth } from '../../features/auth/auth-context';
import { useTableParams } from '../../lib/useTableParams';
import * as jobsApi from '../../api/jobs.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { JOB_STATUSES, type JobStatus } from '../../types/entities';
import { useT, useDate } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';

export function JobsPage() {
  const t = useT();
  const fmtD = useDate();
  const { user: actor } = useAuth();
  const navigate = useNavigate();
  const { page, pageSize, filters, setPage, setPageSize, setFilter } = useTableParams(
    ['search', 'status', 'branchId', 'technicianId', 'dateFrom', 'dateTo'],
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
    ...(filters.technicianId ? { technicianId: Number(filters.technicianId) } : {}),
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
          <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('ja.jobs.title')}</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            {seesAllBranches ? t('ja.jobs.subtitleAll') : t('ja.jobs.subtitleOwn')}
          </p>
        </div>
        {can(actor, 'jobs.create') && (
          <Button onClick={() => navigate('/app/jobs/new')}>
            <Plus className="size-4" />
            {t('ja.jobs.newJob')}
          </Button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder={t('ja.jobs.searchPlaceholder')}
          leftIcon={<Search className="size-[18px]" />}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          aria-label={t('ja.jobs.searchAria')}
        />
        <Select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} aria-label={t('ja.jobs.statusFilterAria')}>
          <option value="">{t('ja.jobs.allStatuses')}</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {jobStatusLabel(s, t)}
            </option>
          ))}
        </Select>
        {seesAllBranches && (
          <Select value={filters.branchId} onChange={(e) => setFilter('branchId', e.target.value)} aria-label={t('ja.jobs.branchFilterAria')}>
            <option value="">{t('ja.jobs.allBranches')}</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
        <TechnicianFilter
          value={filters.technicianId ? Number(filters.technicianId) : null}
          onChange={(id) => setFilter('technicianId', id != null ? String(id) : '')}
        />
        <Input type="date" value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} aria-label={t('ja.jobs.dateFromAria')} label={t('ja.jobs.dateFrom')} />
        <Input type="date" value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} aria-label={t('ja.jobs.dateToAria')} label={t('ja.jobs.dateTo')} />
      </div>

      <div className="mt-5 space-y-3">
        {jobsQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-blue-600" />
          </div>
        ) : jobsQuery.isError ? (
          <Alert tone="error">{localizeApiError(getApiError(jobsQuery.error).code, t)}</Alert>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Briefcase className="size-8 text-[var(--text-3)]" />
            <p className="text-sm">{filters.search || filters.status ? t('ja.jobs.notFound') : t('ja.jobs.empty')}</p>
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
                  {job.branchName} · {fmtD(job.createdAt)}
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
