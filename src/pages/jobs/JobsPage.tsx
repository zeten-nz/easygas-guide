import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Briefcase, ChevronLeft, ChevronRight, ChevronsRight, Plus, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { JobStatusBadge } from './JobStatusBadge';
import { useAuth } from '../../features/auth/auth-context';
import * as jobsApi from '../../api/jobs.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from '../../types/entities';

export function JobsPage() {
  const { user: actor } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<JobStatus | ''>('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // Branch filter is meaningful only for all-branch viewers (SIFAT/ADMIN);
  // for everyone else the backend confines results to their own branch anyway.
  const seesAllBranches = can(actor, 'services.view_all');
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches, enabled: seesAllBranches });

  const params: jobsApi.ListJobsParams = {
    page,
    limit: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
    ...(branchId ? { branchId: Number(branchId) } : {}),
  };

  const jobsQuery = useQuery({
    queryKey: ['jobs', 'list', params],
    queryFn: () => jobsApi.fetchJobs(params),
    placeholderData: keepPreviousData,
  });

  const total = jobsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Ishlar</h1>
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

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          placeholder="№, davlat raqami, mijoz..."
          leftIcon={<Search className="size-[18px]" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Ish qidirish"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as JobStatus | '');
            setPage(1);
          }}
          aria-label="Holat bo'yicha filtr"
        >
          <option value="">Barcha holatlar</option>
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        {seesAllBranches && (
          <Select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPage(1);
            }}
            aria-label="Filial bo'yicha filtr"
          >
            <option value="">Barcha filiallar</option>
            {(branchesQuery.data ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {jobsQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {jobsQuery.isError && <Alert tone="error">{getApiError(jobsQuery.error).message}</Alert>}

        {jobsQuery.data && jobsQuery.data.jobs.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Briefcase className="size-8" />
            <p className="text-sm">
              {debouncedSearch || status ? 'Ish topilmadi' : "Hozircha ishlar yo'q"}
            </p>
          </div>
        )}

        {jobsQuery.data?.jobs.map((job) => (
          <button
            key={job.id}
            type="button"
            onClick={() => navigate(`/app/jobs/${job.id}`)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-brand-500/40"
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
            <ChevronsRight className="size-5 shrink-0 text-[var(--text-2)]" />
          </button>
        ))}
      </div>

      {total > 25 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-[var(--text-2)]">
            Jami {total} ta · {page}/{totalPages}-sahifa
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Oldingi sahifa">
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
