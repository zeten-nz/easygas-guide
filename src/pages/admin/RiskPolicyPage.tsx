import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import { listMatrixVersions, activateMatrix, type MatrixVersion } from '../../api/safety.api';
import { getApiError } from '../../api/client';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';

/**
 * Phase 10D risk-policy governance screen (SIFAT/ADMIN). Read + approve the
 * PROVISIONAL v1 matrix (or any DRAFT). The backend enforces authorization,
 * rationale, immutability and one-ACTIVE-at-a-time — this is a read/approve UI.
 */
export function RiskPolicyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const mayApprove = can(user, 'risk.matrix.approve');
  const query = useQuery({ queryKey: ['risk-policy', 'versions'], queryFn: listMatrixVersions });
  const [activating, setActivating] = useState<string | null>(null);
  const [rationale, setRationale] = useState('');

  const activate = useMutation({
    mutationFn: (version: string) => activateMatrix(version, rationale.trim()),
    onSuccess: () => {
      setActivating(null);
      setRationale('');
      qc.invalidateQueries({ queryKey: ['risk-policy'] });
    },
  });

  const versions = query.data?.versions ?? [];
  const hasActive = versions.some((v) => v.status === 'ACTIVE');

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[var(--text-1)]">Xavf matritsasi siyosati</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Xavf darajalari matritsasini ko'rish va tasdiqlash (§21)</p>
      </div>

      {query.isSuccess && !hasActive && (
        <Alert tone="error">
          <div>
            <strong>Faol tasdiqlangan xavf siyosati yo'q.</strong> Xavfsizlik amaliyotlari (ish boshlash, yakunlash)
            to'xtatilgan. v1 <em>vaqtinchalik</em> — mas'ul xavfsizlik mutaxassisi tomonidan tasdiqlanishi kerak.
          </div>
        </Alert>
      )}

      {query.isLoading && (
        <div className="flex justify-center py-16" role="status" aria-label="Yuklanmoqda">
          <Spinner />
        </div>
      )}
      {query.isError && <Alert tone="error">{getApiError(query.error).message}</Alert>}

      {query.isSuccess && (
        <ul className="mt-3 space-y-3">
          {versions.map((v) => (
            <MatrixCard
              key={v.version}
              v={v}
              mayApprove={mayApprove}
              activating={activating === v.version}
              rationale={rationale}
              onRationale={setRationale}
              onStartActivate={() => { setActivating(v.version); setRationale(''); }}
              onCancel={() => setActivating(null)}
              onConfirm={() => activate.mutate(v.version)}
              pending={activate.isPending}
              error={activating === v.version && activate.isError ? getApiError(activate.error).message : null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MatrixCard(props: {
  v: MatrixVersion;
  mayApprove: boolean;
  activating: boolean;
  rationale: string;
  onRationale: (s: string) => void;
  onStartActivate: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  error: string | null;
}) {
  const { v } = props;
  const statusStyle =
    v.status === 'ACTIVE'
      ? 'text-[var(--success-fg,#166534)]'
      : v.status === 'RETIRED'
        ? 'text-[var(--text-3)]'
        : 'text-[var(--warning-fg,#92400e)]';
  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {v.status === 'ACTIVE' ? <ShieldCheck className="size-4 text-[var(--success-fg,#166534)]" aria-hidden /> : <ShieldAlert className="size-4 text-[var(--text-3)]" aria-hidden />}
          <span className="font-semibold text-[var(--text-1)]">{v.version}</span>
          {/* status conveyed by text label, not color alone */}
          <span className={`text-xs font-semibold uppercase ${statusStyle}`}>{v.status}</span>
          {v.version === 'v1' && <span className="text-xs text-[var(--text-3)]">(vaqtinchalik / provisional)</span>}
        </div>
        {props.mayApprove && v.status === 'DRAFT' && !props.activating && (
          <Button onClick={props.onStartActivate}>Tasdiqlash</Button>
        )}
      </div>

      <div className="mt-2 text-sm text-[var(--text-2)]">
        Bloklovchi darajalar: <strong>{v.definition.blockingLevels.join(', ')}</strong>
        {v.approvedAt && <span> · Tasdiqladi: #{v.approvedBy} · {new Date(v.approvedAt).toLocaleString()}</span>}
      </div>
      {v.rationale && <p className="mt-1 text-xs text-[var(--text-3)]">Asos: {v.rationale}</p>}

      {props.activating && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => { e.preventDefault(); props.onConfirm(); }}
        >
          <label htmlFor={`rationale-${v.version}`} className="block text-sm font-medium text-[var(--text-1)]">
            Tasdiqlash asosi / havola (majburiy)
          </label>
          <Input
            id={`rationale-${v.version}`}
            value={props.rationale}
            onChange={(e) => props.onRationale(e.target.value)}
            placeholder="Masalan: Xavfsizlik mutaxassisi tasdig'i, hujjat #..."
            required
            minLength={3}
          />
          {props.error && <Alert tone="error">{props.error}</Alert>}
          <div className="flex gap-2">
            <Button type="submit" loading={props.pending} disabled={props.rationale.trim().length < 3}>
              Faollashtirish
            </Button>
            <Button type="button" variant="secondary" onClick={props.onCancel}>
              Bekor qilish
            </Button>
          </div>
        </form>
      )}
    </li>
  );
}
