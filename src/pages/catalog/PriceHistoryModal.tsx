import { useQuery } from '@tanstack/react-query';
import { History } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { getApiError } from '../../api/client';
import { getProductPriceHistory, getServicePriceHistory } from '../../api/catalog.api';
import { formatUZS } from '../../lib/money';

/**
 * Read-only price-change history for a product or service: newest first, with
 * the previous → new value, who changed it, when, the reason, and whether it
 * came from an import (provenance).
 */
export function PriceHistoryModal({
  kind,
  id,
  title,
  onClose,
}: {
  kind: 'product' | 'service';
  id: number;
  title: string;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['catalog', kind, 'price-history', id],
    queryFn: () => (kind === 'product' ? getProductPriceHistory(id) : getServicePriceHistory(id)),
  });

  return (
    <Modal open onClose={onClose} title="Narx tarixi">
      <p className="mb-3 text-sm text-[var(--text-2)]">{title}</p>
      {query.isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="size-6 text-blue-600" />
        </div>
      )}
      {query.isError && <Alert tone="error">{getApiError(query.error).message}</Alert>}
      {query.data && query.data.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-[var(--text-2)]">
          <History className="size-7 text-[var(--text-3)]" />
          <p className="text-sm">Narx hali o'zgartirilmagan</p>
        </div>
      )}
      {query.data && query.data.length > 0 && (
        <ol className="space-y-3">
          {query.data.map((h) => (
            <li key={h.id} className="rounded-xl border border-[var(--border-1)] bg-[var(--surface)] p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-[var(--text-1)]">
                  {formatUZS(h.oldPriceMinor)} → {formatUZS(h.newPriceMinor)}
                </span>
                {h.source === 'IMPORT' && (
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">Import</span>
                )}
              </div>
              <div className="mt-1 text-[var(--text-2)]">
                {new Date(h.createdAt).toLocaleString('uz-UZ')}
                {h.changedByName ? ` · ${h.changedByName}` : ''}
              </div>
              {h.reason && <div className="mt-1 text-[var(--text-2)]">Sabab: {h.reason}</div>}
            </li>
          ))}
        </ol>
      )}
    </Modal>
  );
}
