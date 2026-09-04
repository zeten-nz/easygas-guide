import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Car, Gauge, Pencil, Phone as PhoneIcon, Plus, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { CustomerFormModal } from './CustomerFormModal';
import { VehicleFormModal } from './VehicleFormModal';
import { useAuth } from '../../features/auth/auth-context';
import * as customersApi from '../../api/customers.api';
import { getApiError } from '../../api/client';
import { can } from '../../lib/permissions';
import { displayPhone } from '../../lib/phone';
import type { Vehicle } from '../../types/entities';

export function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const { user: actor } = useAuth();

  const [editOpen, setEditOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const customerQuery = useQuery({
    queryKey: ['customers', 'detail', customerId],
    queryFn: () => customersApi.fetchCustomer(customerId),
    enabled: Number.isInteger(customerId) && customerId > 0,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['customers', 'detail', customerId, 'vehicles'],
    queryFn: () => customersApi.fetchCustomerVehicles(customerId),
    enabled: customerQuery.isSuccess && can(actor, 'vehicles.view'),
  });

  if (!Number.isInteger(customerId) || customerId <= 0) {
    return <Alert tone="error">Mijoz topilmadi</Alert>;
  }

  if (customerQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-7 text-brand-500" />
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert tone="error">{getApiError(customerQuery.error).message}</Alert>
        <Link to="/app/customers" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500">
          <ArrowLeft className="size-4" />
          Mijozlar ro'yxatiga qaytish
        </Link>
      </div>
    );
  }

  const customer = customerQuery.data!;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app/customers"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
      >
        <ArrowLeft className="size-4" />
        Mijozlar
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <UserRound className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">{customer.name}</h1>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-[var(--text-2)]">
              <PhoneIcon className="size-3.5" />
              {displayPhone(customer.phone)}
            </p>
          </div>
        </div>
        {can(actor, 'customers.manage') && (
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Tahrirlash
          </Button>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[var(--text-1)]">
            Avtomobillar
            <span className="ml-2 text-sm font-medium text-[var(--text-2)]">({customer.vehicleCount})</span>
          </h2>
          {can(actor, 'vehicles.manage') && (
            <Button
              onClick={() => {
                setEditVehicle(null);
                setVehicleFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              Avtomobil qo'shish
            </Button>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {vehiclesQuery.isLoading && (
            <div className="flex justify-center py-10">
              <Spinner className="size-6 text-brand-500" />
            </div>
          )}

          {vehiclesQuery.isError && <Alert tone="error">{getApiError(vehiclesQuery.error).message}</Alert>}

          {vehiclesQuery.data?.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-12 text-[var(--text-2)]">
              <Car className="size-8" />
              <p className="text-sm">Bu mijozda hali avtomobil yo'q</p>
            </div>
          )}

          {vehiclesQuery.data?.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4"
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
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-2)]">
                  {v.engine && <span>{v.engine}</span>}
                  {v.mileage != null && (
                    <span className="inline-flex items-center gap-1">
                      <Gauge className="size-3.5" />
                      {v.mileage.toLocaleString('uz-UZ')} km
                    </span>
                  )}
                  {v.vin && <span className="font-mono text-xs">VIN: {v.vin}</span>}
                </div>
              </div>
              {can(actor, 'vehicles.manage') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditVehicle(v);
                    setVehicleFormOpen(true);
                  }}
                  aria-label={`${v.plateNumber}ni tahrirlash`}
                >
                  <Pencil className="size-4" />
                  <span className="hidden sm:inline">Tahrirlash</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {editOpen && <CustomerFormModal editCustomer={customer} onClose={() => setEditOpen(false)} />}

      {vehicleFormOpen && (
        <VehicleFormModal
          key={editVehicle?.id ?? 'new'}
          customerId={customer.id}
          editVehicle={editVehicle}
          onClose={() => {
            setVehicleFormOpen(false);
            setEditVehicle(null);
          }}
        />
      )}
    </div>
  );
}
