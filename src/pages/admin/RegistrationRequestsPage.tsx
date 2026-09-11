import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Inbox, MapPin, Phone as PhoneIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import * as adminApi from '../../api/admin.api';
import { getApiError } from '../../api/client';
import { displayPhone } from '../../lib/phone';
import {
  ROLE_CODES,
  type RegistrationRequest,
  type RegistrationStatus,
  type RoleCode,
} from '../../types/auth';
import { cn } from '../../lib/utils';
import { useT, useLocale, type TFunc } from '../../i18n/i18n';
import { localizeApiError } from '../../i18n/api-errors';
import { roleLabel, regionLabel } from '../../i18n/labels';

const STATUS_TABS: RegistrationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

/** Localized label for a registration request status (codes stay stable). */
function registrationStatusLabel(status: RegistrationStatus, t: TFunc): string {
  switch (status) {
    case 'PENDING':
      return t('au.regStatus.pending');
    case 'APPROVED':
      return t('au.regStatus.approved');
    case 'REJECTED':
      return t('au.regStatus.rejected');
  }
}

export function RegistrationRequestsPage() {
  const t = useT();
  const [status, setStatus] = useState<RegistrationStatus>('PENDING');
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['admin', 'registration-requests', status],
    queryFn: () => adminApi.fetchRegistrationRequests(status),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'registration-requests'] });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-[var(--text-1)]">{t('au.reg.title')}</h1>
      <p className="mt-1 text-sm text-[var(--text-2)]">{t('au.reg.subtitle')}</p>

      <div className="mt-5 flex gap-1 rounded-xl bg-[var(--surface-2)] p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              status === tab
                ? 'bg-[var(--surface)] text-[var(--text-1)] shadow-sm'
                : 'text-[var(--text-2)] hover:text-[var(--text-1)]',
            )}
          >
            {registrationStatusLabel(tab, t)}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        {requestsQuery.isLoading && (
          <div className="flex justify-center py-16">
            <Spinner className="size-7 text-brand-500" />
          </div>
        )}

        {requestsQuery.isError && <Alert tone="error">{localizeApiError(getApiError(requestsQuery.error).code, t)}</Alert>}

        {requestsQuery.data?.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border-1)] py-16 text-[var(--text-2)]">
            <Inbox className="size-8" />
            <p className="text-sm">{t('au.reg.empty')}</p>
          </div>
        )}

        {requestsQuery.data?.map((request) => (
          <RequestCard key={request.id} request={request} onChanged={invalidate} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ request, onChanged }: { request: RegistrationRequest; onChanged: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const [roleCode, setRoleCode] = useState<RoleCode>('USTA');
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveRegistrationRequest(request.id, roleCode),
    onSuccess: () => {
      toast.success(t('au.reg.approvedToast', { name: `${request.firstName} ${request.lastName}` }));
      onChanged();
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectRegistrationRequest(request.id, rejectReason.trim()),
    onSuccess: () => {
      toast.success(t('au.reg.rejectedToast'));
      onChanged();
    },
    onError: (err) => toast.error(localizeApiError(getApiError(err).code, t)),
  });

  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--text-1)]">
            {request.firstName} {request.lastName}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-2)]">
            <span className="inline-flex items-center gap-1.5">
              <PhoneIcon className="size-3.5" />
              {displayPhone(request.phone)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {regionLabel(request.region, locale)} · {request.branchName}
            </span>
          </div>
          {request.comment && <p className="mt-2 text-sm text-[var(--text-2)]">«{request.comment}»</p>}
        </div>
        <StatusBadge status={request.status} />
      </div>

      {request.status === 'REJECTED' && request.rejectReason && (
        <p className="mt-3 text-sm text-brand-700">{t('au.reg.reasonShown', { reason: request.rejectReason })}</p>
      )}

      {request.status === 'PENDING' && !rejecting && (
        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-[var(--border-1)] pt-4">
          <div className="w-48">
            <Select label={t('au.userForm.role')} value={roleCode} onChange={(e) => setRoleCode(e.target.value as RoleCode)}>
              {ROLE_CODES.map((code) => (
                <option key={code} value={code}>
                  {roleLabel(code, t)}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={() => approveMutation.mutate()} loading={approveMutation.isPending}>
            {t('common.confirm')}
          </Button>
          <Button variant="danger-outline" onClick={() => setRejecting(true)} disabled={approveMutation.isPending}>
            {t('au.reg.reject')}
          </Button>
        </div>
      )}

      {request.status === 'PENDING' && rejecting && (
        <div className="mt-4 space-y-3 border-t border-[var(--border-1)] pt-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">
              {t('au.reg.rejectReasonLabel')}
            </span>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={t('au.reg.rejectReasonPlaceholder')}
              className="w-full rounded-xl border border-[var(--field-border)] bg-[var(--field-bg)] px-3.5 py-2.5 text-sm text-[var(--text-1)] outline-none transition-colors placeholder:text-[var(--field-placeholder)] focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25"
            />
          </label>
          <div className="flex gap-3">
            <Button
              variant="danger-outline"
              onClick={() => rejectMutation.mutate()}
              loading={rejectMutation.isPending}
              disabled={rejectReason.trim().length < 3}
            >
              {t('au.reg.confirmReject')}
            </Button>
            <Button variant="ghost" onClick={() => setRejecting(false)} disabled={rejectMutation.isPending}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const t = useT();
  const classNameMap: Record<RegistrationStatus, string> = {
    PENDING: 'bg-amber-500/15 text-amber-700',
    APPROVED: 'bg-emerald-500/15 text-emerald-700',
    REJECTED: 'bg-brand-500/15 text-brand-700',
  };
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', classNameMap[status])}>
      {registrationStatusLabel(status, t)}
    </span>
  );
}
