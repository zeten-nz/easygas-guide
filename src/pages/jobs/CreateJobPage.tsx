import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Car,
  Check,
  ChevronsRight,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { VehicleFormModal } from '../customers/VehicleFormModal';
import { useAuth } from '../../features/auth/auth-context';
import * as customersApi from '../../api/customers.api';
import * as jobsApi from '../../api/jobs.api';
import { fetchBranches } from '../../api/branches.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import { cn } from '../../lib/utils';
import type { Customer, Vehicle } from '../../types/entities';

type Step = 1 | 2 | 3;

const STEP_TITLES: Record<Step, string> = {
  1: 'Mijozni tanlang',
  2: 'Avtomobilni tanlang',
  3: "Ma'lumotlarni tekshiring",
};

export function CreateJobPage() {
  const { user: actor } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newVehicleOpen, setNewVehicleOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const customersQuery = useQuery({
    queryKey: ['customers', 'job-search', debouncedSearch],
    queryFn: () => customersApi.fetchCustomers({ search: debouncedSearch || undefined, limit: 10 }),
    enabled: step === 1,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['customers', 'detail', customer?.id, 'vehicles'],
    queryFn: () => customersApi.fetchCustomerVehicles(customer!.id),
    enabled: step === 2 && !!customer,
  });

  // The job's branch is the authenticated user's branch (server-enforced);
  // the public branches list is only used to display its name in the review.
  const branchesQuery = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
  const branchName = branchesQuery.data?.find((b) => b.id === actor?.branchId)?.name ?? '—';

  const createMutation = useMutation({
    mutationFn: () => jobsApi.createJob(customer!.id, vehicle!.id),
    onSuccess: (job) => {
      toast.success(`Ish #${job.id} ochildi`);
      navigate(`/app/jobs/${job.id}`, { replace: true });
    },
    onError: (err) => {
      setConfirmOpen(false);
      toast.error(getApiError(err).message);
    },
  });

  const selectCustomer = (c: Customer) => {
    setCustomer(c);
    setVehicle(null);
    setStep(2);
  };

  if (!actor?.branchId) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert tone="error">Sizga filial biriktirilmagan — ish ochish uchun administrator bilan bog'laning.</Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/app/jobs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
      >
        <ArrowLeft className="size-4" />
        Ishlar
      </Link>

      <h1 className="mt-3 text-xl font-bold text-[var(--text-1)]">Yangi ish ochish</h1>

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                s < step && 'bg-emerald-500 text-white',
                s === step && 'bg-brand-500 text-white',
                s > step && 'bg-[var(--surface-2)] text-[var(--text-2)]',
              )}
            >
              {s < step ? <Check className="size-4" /> : s}
            </span>
            <span
              className={cn('hidden text-xs font-medium sm:block', s === step ? 'text-[var(--text-1)]' : 'text-[var(--text-2)]')}
            >
              {STEP_TITLES[s]}
            </span>
            {s < 3 && <div className="h-px flex-1 bg-[var(--border-1)]" />}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-[var(--text-1)] sm:hidden">{STEP_TITLES[step]}</p>

      {/* Step 1 — find customer */}
      {step === 1 && (
        <div className="mt-5 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              leftIcon={<Search className="size-[18px]" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Mijoz qidirish"
            />
            {can(actor, 'customers.manage') && (
              <Button variant="secondary" onClick={() => setNewCustomerOpen(true)} className="shrink-0">
                <Plus className="size-4" />
                <span className="hidden sm:inline">Yangi mijoz</span>
              </Button>
            )}
          </div>

          {customersQuery.isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="size-6 text-brand-500" />
            </div>
          )}
          {customersQuery.isError && <Alert tone="error">{getApiError(customersQuery.error).message}</Alert>}
          {customersQuery.data?.customers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--border-1)] py-10 text-center text-sm text-[var(--text-2)]">
              Mijoz topilmadi — yangi mijoz yarating
            </div>
          )}
          {customersQuery.data?.customers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCustomer(c)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-brand-500/40"
            >
              <div>
                <p className="font-semibold text-[var(--text-1)]">{c.name}</p>
                <p className="mt-0.5 text-sm text-[var(--text-2)]">
                  {displayPhone(c.phone)} · {c.vehicleCount} ta avtomobil
                </p>
              </div>
              <ChevronsRight className="size-5 shrink-0 text-[var(--text-2)]" />
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — select vehicle */}
      {step === 2 && customer && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-2)] p-3.5">
            <div className="flex items-center gap-2.5 text-sm">
              <UserRound className="size-4 text-[var(--text-2)]" />
              <span className="font-semibold text-[var(--text-1)]">{customer.name}</span>
              <span className="text-[var(--text-2)]">{displayPhone(customer.phone)}</span>
            </div>
            <Button variant="ghost" size="md" onClick={() => setStep(1)}>
              O'zgartirish
            </Button>
          </div>

          {can(actor, 'vehicles.manage') && (
            <Button variant="secondary" onClick={() => setNewVehicleOpen(true)} className="w-full">
              <Plus className="size-4" />
              Avtomobil qo'shish
            </Button>
          )}

          {vehiclesQuery.isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="size-6 text-brand-500" />
            </div>
          )}
          {vehiclesQuery.isError && <Alert tone="error">{getApiError(vehiclesQuery.error).message}</Alert>}
          {vehiclesQuery.data?.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border-1)] py-10 text-[var(--text-2)]">
              <Car className="size-7" />
              <p className="text-sm">Bu mijozda hali avtomobil yo'q — avval avtomobil qo'shing</p>
            </div>
          )}
          {vehiclesQuery.data?.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setVehicle(v);
                setStep(3);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-brand-500/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-[var(--border-1)] bg-[var(--surface-2)] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[var(--text-1)]">
                  {v.plateNumber}
                </span>
                <span className="font-semibold text-[var(--text-1)]">
                  {v.make} {v.model}
                  {v.year ? ` · ${v.year}` : ''}
                </span>
              </div>
              <ChevronsRight className="size-5 shrink-0 text-[var(--text-2)]" />
            </button>
          ))}
        </div>
      )}

      {/* Step 3 — review + confirm */}
      {step === 3 && customer && vehicle && (
        <div className="mt-5 space-y-4">
          <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
            <ReviewRow icon={<UserRound className="size-4" />} label="Mijoz" value={`${customer.name} · ${displayPhone(customer.phone)}`} />
            <ReviewRow
              icon={<Car className="size-4" />}
              label="Avtomobil"
              value={`${vehicle.make} ${vehicle.model}${vehicle.year ? ` · ${vehicle.year}` : ''}`}
            />
            <ReviewRow icon={<span className="font-mono text-xs font-bold">№</span>} label="Davlat raqami" value={vehicle.plateNumber} mono />
            <ReviewRow icon={<Building2 className="size-4" />} label="Filial" value={branchName} last />
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
              Orqaga
            </Button>
            <Button onClick={() => setConfirmOpen(true)} className="flex-[2]" size="lg">
              Ish ochish
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Yangi ish"
        confirmLabel="Ha, ish ochilsin"
        loading={createMutation.isPending}
        onConfirm={() => createMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      >
        Ushbu avtomobil uchun yangi ish ochilsinmi?
        <span className="mt-2 block font-mono font-bold text-[var(--text-1)]">{vehicle?.plateNumber}</span>
      </ConfirmDialog>

      {newCustomerOpen && (
        <CustomerFormModal
          editCustomer={null}
          onClose={() => setNewCustomerOpen(false)}
          onCreated={(created) => selectCustomer(created)}
        />
      )}

      {newVehicleOpen && customer && (
        <VehicleFormModal customerId={customer.id} editVehicle={null} onClose={() => setNewVehicleOpen(false)} />
      )}
    </div>
  );
}

function ReviewRow({
  icon,
  label,
  value,
  mono = false,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-3', !last && 'border-b border-[var(--border-1)]')}>
      <span className="inline-flex items-center gap-2 text-sm text-[var(--text-2)]">
        {icon}
        {label}
      </span>
      <span className={cn('text-sm font-semibold text-[var(--text-1)]', mono && 'font-mono tracking-wider')}>{value}</span>
    </div>
  );
}
