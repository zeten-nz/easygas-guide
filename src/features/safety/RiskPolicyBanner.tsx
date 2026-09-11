import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { getRiskPolicyState } from '../../api/safety.api';
import { useAuth } from '../auth/auth-context';
import { can } from '../../lib/permissions';
import { useT } from '../../i18n/i18n';

/**
 * Phase 10D: a persistent warning for approvers (SIFAT/ADMIN) when no risk
 * matrix is ACTIVE — safety operations are failing closed until one is approved.
 * Shown only to `risk.matrix.approve` holders; links to the approval screen.
 */
export function RiskPolicyBanner() {
  const { user } = useAuth();
  const t = useT();
  const mayApprove = can(user, 'risk.matrix.approve');
  const query = useQuery({ queryKey: ['risk-policy', 'state'], queryFn: getRiskPolicyState, enabled: mayApprove, staleTime: 60_000 });

  if (!mayApprove || !query.data || query.data.active) return null;

  return (
    <div role="alert" className="border-b border-[var(--danger-fg,#b91c1c)] bg-[var(--danger-bg,#fef2f2)] px-4 py-2 text-sm text-[var(--danger-fg,#b91c1c)]">
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <ShieldAlert className="size-4 shrink-0" aria-hidden />
        <span>
          {t('m.riskBanner.message')}{' '}
          <Link to="/app/admin/risk-policy" className="font-semibold underline">
            {t('m.riskBanner.approve')}
          </Link>
        </span>
      </div>
    </div>
  );
}
