import { FileCheck2, Fingerprint } from 'lucide-react';
import type { SignableSummaryContent } from '../../api/safety.api';
import { useT } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/types';

const GAS_LABEL: Record<string, MessageKey> = { LPG: 'jb.summary.gasLpg', CNG: 'jb.summary.gasCng' };

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-[var(--text-2)]">{label}</span>
      <span className="text-right font-medium text-[var(--text-1)]">{value}</span>
    </div>
  );
}

/**
 * Phase 10D §23 signable completion summary. Renders the SERVER-built material
 * summary the customer reviews before signing, and shows the canonical digest the
 * signature is bound to. The digest is computed and verified server-side; this
 * only displays it so the customer signs a specific, identifiable summary.
 */
export function SignableSummaryCard({
  content,
  digest,
}: {
  content: SignableSummaryContent;
  digest: string;
}) {
  const t = useT();
  const stopCount = content.stops.length;
  const openRisks = content.openBlockingRiskIds.length;
  return (
    <section aria-label={t('jb.summary.aria')} className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]">
        <FileCheck2 className="size-4 text-[var(--accent)]" aria-hidden />
        {t('jb.summary.title')}
      </p>

      <div className="mt-2 divide-y divide-[var(--border-1)]">
        {content.customer && <Row label={t('jb.summary.customer')} value={content.customer.name} />}
        {content.customer && <Row label={t('jb.summary.phone')} value={content.customer.phoneMasked} />}
        {content.vehicle && (
          <Row
            label={t('jb.summary.vehicle')}
            value={`${content.vehicle.plate} · ${[content.vehicle.make, content.vehicle.model].filter(Boolean).join(' ')}${content.vehicle.year ? ` (${content.vehicle.year})` : ''}`}
          />
        )}
        {content.installation.gasType && (
          <Row label={t('jb.inst.gasType')} value={GAS_LABEL[content.installation.gasType] ? t(GAS_LABEL[content.installation.gasType]) : content.installation.gasType} />
        )}
        {content.installation.kit && <Row label={t('jb.summary.kit')} value={content.installation.kit} />}
        {content.installation.ecu && <Row label={t('jb.inst.ecu')} value={content.installation.ecu} />}
        {content.installation.cylinder && <Row label={t('jb.inst.cylinder')} value={content.installation.cylinder} />}
        <Row label={t('jb.summary.checklistVersion')} value={content.checklistVersion != null ? `v${content.checklistVersion}` : '—'} />
        <Row label={t('jb.summary.steps')} value={t('jb.count', { count: content.steps.length })} />
        <Row label={t('jb.summary.stops')} value={t('jb.count', { count: stopCount })} />
        <Row
          label={t('jb.summary.openBlockingRisk')}
          value={openRisks > 0 ? <span className="text-[var(--critical)]">{t('jb.count', { count: openRisks })}</span> : t('jb.none')}
        />
        <Row label={t('jb.summary.cycle')} value={`#${content.cycle}`} />
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-[var(--border-1)] bg-[var(--surface)] px-3 py-2">
        <Fingerprint className="mt-0.5 size-4 shrink-0 text-[var(--text-3)]" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-2)]">{t('jb.summary.digestLabel')}</p>
          <p className="break-all font-mono text-[11px] text-[var(--text-3)]" title={digest}>
            {digest}
          </p>
        </div>
      </div>
    </section>
  );
}
