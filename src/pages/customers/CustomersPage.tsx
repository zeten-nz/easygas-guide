import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Car, ChevronLeft, ChevronRight, ChevronsRight, Plus, Search, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { CustomerFormModal } from './CustomerFormModal';
import { useAuth } from '../../features/auth/auth-context';
import * as customersApi from '../../api/customers.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';

export function CustomersPage() {
  const { user: actor } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const params: customersApi.ListCustomersParams = {
    page,
    limit: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const customersQuery = useQuery({
    queryKey: ['customers', 'list', params],
    queryFn: () => customersApi.fetchCustomers(params),
    placeholderData: keepPreviousData,
  });

  const total = customersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-1)]">Mijozlar</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">Mijozlar va ularning avtomobillari</p>
        </div>
        {can(actor, 'customers.manage') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Yangi mijoz
          </Button>
        )}
      </div>

      <div className="mt-5">
        <Input
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          leftIcon={<Search className="size-[18px]" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Mijoz qidirish"
        />
      </div>

      <div className="mt-5 space-y-3">
        {customersQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {customersQuery.isError && <Alert tone="error">{getApiError(customersQuery.error).message}</Alert>}

        {customersQuery.data && customersQuery.data.customers.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Users className="size-8" />
            <p className="text-sm">{debouncedSearch ? 'Mijoz topilmadi' : "Hozircha mijozlar yo'q"}</p>
          </div>
        )}

        {customersQuery.data?.customers.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(`/app/customers/${c.id}`)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 text-left transition-colors hover:border-brand-500/40"
          >
            <div className="min-w-0">
              <p className="font-semibold text-[var(--text-1)]">{c.name}</p>
              <p className="mt-0.5 text-sm text-[var(--text-2)]">{displayPhone(c.phone)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-2)]">
                <Car className="size-3.5" />
                {c.vehicleCount}
              </span>
              <ChevronsRight className="size-5 text-[var(--text-2)]" />
            </div>
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

      {createOpen && (
        <CustomerFormModal
          editCustomer={null}
          onClose={() => setCreateOpen(false)}
          onCreated={(customer) => navigate(`/app/customers/${customer.id}`)}
        />
      )}
    </div>
  );
}
