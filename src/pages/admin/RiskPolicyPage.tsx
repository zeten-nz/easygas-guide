import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, ShieldAlert, Ban, Info, History, FlaskConical, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { RiskMatrixTable } from './RiskMatrixTable';
import { LEVEL_META, riskLevelLabel, statusLabel, type VersionStatusCode } from './risk-levels';
import {
  listMatrixVersions, getMatrixVersionDetail, previewClassification, activateMatrix, retireMatrix,
  type MatrixVersion, type MatrixVersionDetail, type RiskSource,
} from '../../api/safety.api';
import { getApiError } from '../../api/client';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { useT, useLocale, type TFunc } from '../../i18n/i18n';
import type { Locale, MessageKey } from '../../i18n/types';
import { formatDateTime } from '../../i18n/format';
import { localizeApiError } from '../../i18n/api-errors';

const SOURCE_LABEL_KEY: Record<RiskSource, MessageKey> = {
  MANUAL: 'rp.source.MANUAL',
  STOP_REJECTED: 'rp.source.STOP_REJECTED',
  MEASUREMENT_OUT_OF_RANGE: 'rp.source.MEASUREMENT_OUT_OF_RANGE',
  CHECKLIST_FLAG: 'rp.source.CHECKLIST_FLAG',
};
/** Localized display label for a risk-source CODE (unknown codes fall back to the raw code). */
function sourceLabel(src: string, t: TFunc): string {
  const key = SOURCE_LABEL_KEY[src as RiskSource];
  return key ? t(key) : src;
}

function fmtDate(iso: string | null, t: TFunc, locale: Locale): string {
  if (!iso) return t('rp.unknown');
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? t('rp.unknown') : formatDateTime(d, locale);
}
function approverText(v: { approvedByName: string | null; approvedBy: number | null }, t: TFunc): string {
  return v.approvedByName ?? (v.approvedBy != null ? t('rp.userNumber', { id: v.approvedBy }) : t('rp.unknown'));
}

/**
 * Phase 11C risk-policy screen (SIFAT/ADMIN). Explains the policy in plain Uzbek,
 * visualizes the REAL server-provided matrix (no hardcoded thresholds), offers an
 * illustrative preview backed by the server evaluator, shows version history with
 * a compare, and provides an explicit activation/retirement flow. The backend
 * enforces authorization, immutability, one-ACTIVE and fail-closed behaviour.
 */
export function RiskPolicyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const t = useT();
  const mayApprove = can(user, 'risk.matrix.approve');

  const versionsQuery = useQuery({ queryKey: ['risk-policy', 'versions'], queryFn: listMatrixVersions });
  const versions = versionsQuery.data?.versions ?? [];
  const active = versions.find((v) => v.status === 'ACTIVE') ?? null;
  const hasActive = !!active;

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const effectiveVersion = selectedVersion ?? active?.version ?? versions[0]?.version ?? null;

  const detailQuery = useQuery({
    queryKey: ['risk-policy', 'detail', effectiveVersion],
    queryFn: () => getMatrixVersionDetail(effectiveVersion!),
    enabled: !!effectiveVersion,
    placeholderData: keepPreviousData,
  });

  const [activateFor, setActivateFor] = useState<MatrixVersion | null>(null);
  const [retireFor, setRetireFor] = useState<MatrixVersion | null>(null);
  const [compareWith, setCompareWith] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-bold text-[var(--text-1)]">{t('rp.title')}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">{t('rp.subtitle')}</p>
      </header>

      {versionsQuery.isSuccess && !hasActive && (
        <Alert tone="error">
          <strong>{t('rp.noActive.strong')}</strong> {t('rp.noActive.body')}
        </Alert>
      )}

      <PolicyExplainer />

      {versionsQuery.isLoading && <div className="flex justify-center py-16" role="status" aria-label={t('rp.loadingAria')}><Spinner /></div>}
      {versionsQuery.isError && <Alert tone="error">{localizeApiError(getApiError(versionsQuery.error).code, t)}</Alert>}

      {versionsQuery.isSuccess && versions.length === 0 && (
        <Alert tone="info">{t('rp.noVersions')}</Alert>
      )}

      {versionsQuery.isSuccess && effectiveVersion && (
        <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="version-pick" className="text-sm font-medium text-[var(--text-2)]">{t('rp.versionLabel')}</label>
              <Select id="version-pick" value={effectiveVersion} onChange={(e) => setSelectedVersion(e.target.value)} className="w-auto">
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>{v.version} — {statusLabel(v.status, t)}</option>
                ))}
              </Select>
            </div>
            {detailQuery.data && <StatusPill status={detailQuery.data.status} />}
          </div>

          {detailQuery.isError && (
            <Alert tone="error">{t('rp.detailLoadError')}: {localizeApiError(getApiError(detailQuery.error).code, t)}</Alert>
          )}
          {detailQuery.isLoading && <div className="flex justify-center py-10"><Spinner /></div>}
          {detailQuery.data && (
            <VersionDetail
              detail={detailQuery.data}
              mayApprove={mayApprove}
              onActivate={() => { const v = versions.find((x) => x.version === detailQuery.data!.version); if (v) setActivateFor(v); }}
              onRetire={() => { const v = versions.find((x) => x.version === detailQuery.data!.version); if (v) setRetireFor(v); }}
            />
          )}
        </section>
      )}

      {versionsQuery.isSuccess && versions.length > 0 && (
        <PolicyHistory
          versions={versions}
          selected={effectiveVersion}
          onSelect={setSelectedVersion}
          compareWith={compareWith}
          onCompare={setCompareWith}
        />
      )}

      {activateFor && (
        <ActivateModal
          version={activateFor}
          hasActive={active}
          onClose={() => setActivateFor(null)}
          onDone={() => { setActivateFor(null); qc.invalidateQueries({ queryKey: ['risk-policy'] }); }}
        />
      )}
      {retireFor && (
        <RetireModal
          version={retireFor}
          isOnlyActive={retireFor.status === 'ACTIVE' && versions.filter((v) => v.status === 'ACTIVE').length === 1}
          onClose={() => setRetireFor(null)}
          onDone={() => { setRetireFor(null); qc.invalidateQueries({ queryKey: ['risk-policy'] }); }}
        />
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const t = useT();
  const isActive = status === 'ACTIVE';
  const Icon = isActive ? ShieldCheck : ShieldAlert;
  const cls = isActive ? 'bg-[var(--success-bg)] text-[var(--success-fg)]' : status === 'RETIRED' ? 'bg-[var(--surface-2)] text-[var(--text-2)]' : 'bg-[var(--warning-bg)] text-[var(--warning-fg)]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="size-4" aria-hidden /> {statusLabel(status as VersionStatusCode, t)}
    </span>
  );
}

function PolicyExplainer() {
  const t = useT();
  return (
    <details className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface-2)] p-5 open:pb-6" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-[var(--text-1)]">
        <Info className="size-5 text-[var(--text-2)]" aria-hidden /> {t('rp.explainer.title')}
        <ChevronRight className="ml-auto size-4 text-[var(--text-3)] transition-transform [details[open]_&]:rotate-90" aria-hidden />
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-2)]">
        <p>{t('rp.explainer.p1')}</p>
        <p><b>{t('rp.explainer.matrixTerm')}</b>{t('rp.explainer.matrixDesc')}</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><b>{t('rp.explainer.severityTerm')}</b>{t('rp.explainer.severityDesc')}</li>
          <li><b>{t('rp.explainer.likelihoodTerm')}</b>{t('rp.explainer.likelihoodDesc')}</li>
        </ul>
        <p><b>{t('rp.explainer.blockingTerm')}</b>{t('rp.explainer.blockingDesc')}</p>
        <p><b>{t('rp.explainer.approvedTerm')}</b>{t('rp.explainer.approvedDesc')}</p>
        <p className="text-xs text-[var(--text-3)]">{t('rp.explainer.disclaimer')}</p>
      </div>
    </details>
  );
}

function VersionDetail({ detail, mayApprove, onActivate, onRetire }: {
  detail: MatrixVersionDetail;
  mayApprove: boolean;
  onActivate: () => void;
  onRetire: () => void;
}) {
  const t = useT();
  const def = detail.definition;
  return (
    <div className="space-y-5">
      <RiskMatrixTable cells={detail.cells} definition={def} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard title={t('rp.calc.title')}>
          <p>{t('rp.calc.formula')}</p>
          <ul className="mt-1 space-y-0.5">
            {def.thresholds.map((th) => (
              <li key={`${th.min}-${th.level}`} className="flex items-center gap-2">
                <LevelChip level={th.level} /> <span className="text-[var(--text-2)]">{t('rp.calc.scoreGte', { min: th.min })}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title={t('rp.rules.title')}>
          <p className="flex flex-wrap items-center gap-1.5"><Ban className="size-4 text-[var(--critical)]" aria-hidden /> {t('rp.rules.blockingLevels')} {def.blockingLevels.map((l) => <LevelChip key={l} level={l} />)}</p>
          {def.severity4MinLevel && <p className="mt-1">{t('rp.rules.sev4Prefix')}<LevelChip level={def.severity4MinLevel} />{t('rp.rules.sev4Suffix')}</p>}
          {def.sourceOverrides && Object.keys(def.sourceOverrides).length > 0 && (
            <div className="mt-1">
              <p className="text-[var(--text-2)]">{t('rp.rules.sourceOverrides')}</p>
              <ul className="mt-0.5 space-y-0.5">
                {Object.entries(def.sourceOverrides).map(([src, lvl]) => (
                  <li key={src} className="flex items-center gap-1.5">{sourceLabel(src, t)} → <LevelChip level={lvl as never} /></li>
                ))}
              </ul>
            </div>
          )}
          {detail.blockedOperations.length > 0 && (
            <p className="mt-2 text-xs text-[var(--text-3)]">{t('rp.rules.blockedOps', { ops: detail.blockedOperations.join(', ') })}</p>
          )}
        </InfoCard>
      </div>

      <ProvenanceCard detail={detail} />

      <MatrixPreview detail={detail} />

      {mayApprove && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border-1)] pt-4">
          {detail.status === 'DRAFT' && <Button onClick={onActivate}><ShieldCheck className="size-4" /> {t('rp.activateBtn')}</Button>}
          {detail.status === 'ACTIVE' && <Button variant="danger-outline" onClick={onRetire}><Ban className="size-4" /> {t('rp.retireBtn')}</Button>}
        </div>
      )}
    </div>
  );
}

function ProvenanceCard({ detail }: { detail: MatrixVersionDetail }) {
  const t = useT();
  const { locale } = useLocale();
  const provisional = detail.version === 'v1';
  return (
    <InfoCard title={t('rp.prov.title')}>
      {/* Distinguish the DEFINITION's provenance (author-chosen "provisional" v1)
          from the lifecycle approval. An APPROVED provisional-origin version is NOT
          "unapproved". */}
      {provisional && (
        <p className="text-[var(--text-2)]">{t('rp.prov.provisionalPrefix')}<b>{t('rp.prov.provisionalTerm')}</b>{t('rp.prov.provisionalSuffix')}</p>
      )}
      {detail.status === 'ACTIVE' ? (
        <p className="mt-1">{t('rp.prov.approvedBy')}<b>{approverText(detail, t)}</b> · {fmtDate(detail.approvedAt, t, locale)}</p>
      ) : detail.status === 'RETIRED' ? (
        <p className="mt-1 text-[var(--text-2)]">{t('rp.prov.retired', { date: fmtDate(detail.createdAt, t, locale) })}</p>
      ) : (
        <p className="mt-1 text-[var(--text-2)]">{t('rp.prov.draft', { date: fmtDate(detail.createdAt, t, locale) })}</p>
      )}
      {detail.rationale && <p className="mt-1 text-xs text-[var(--text-3)]">{t('rp.prov.rationale', { text: detail.rationale })}</p>}
    </InfoCard>
  );
}

function MatrixPreview({ detail }: { detail: MatrixVersionDetail }) {
  const t = useT();
  const def = detail.definition;
  const [severity, setSeverity] = useState(def.allowedSeverity[def.allowedSeverity.length - 1]);
  const [likelihood, setLikelihood] = useState(def.allowedLikelihood[def.allowedLikelihood.length - 1]);
  const [source, setSource] = useState<RiskSource>('MANUAL');

  const preview = useQuery({
    queryKey: ['risk-policy', 'preview', detail.version, severity, likelihood, source],
    queryFn: () => previewClassification(detail.version, { severity, likelihood, source }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-1)] bg-[var(--surface-2)] p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]"><FlaskConical className="size-4 text-[var(--text-2)]" aria-hidden /> {t('rp.preview.title')}</p>
      <p className="mt-0.5 text-xs text-[var(--text-3)]">
        {t('rp.preview.desc', { version: detail.version })}
        {detail.status !== 'ACTIVE' && t('rp.preview.descProd')}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select label={t('rp.preview.severity')} value={severity} onChange={(e) => setSeverity(Number(e.target.value))}>
          {def.allowedSeverity.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label={t('rp.preview.likelihood')} value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value))}>
          {def.allowedLikelihood.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Select label={t('rp.preview.source')} value={source} onChange={(e) => setSource(e.target.value as RiskSource)}>
          {(Object.keys(SOURCE_LABEL_KEY) as RiskSource[]).map((s) => <option key={s} value={s}>{sourceLabel(s, t)}</option>)}
        </Select>
      </div>
      <div className="mt-3 min-h-[2.5rem]" aria-live="polite">
        {preview.isError ? (
          <Alert tone="error">{localizeApiError(getApiError(preview.error).code, t)}</Alert>
        ) : preview.data ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--text-2)]">{t('rp.preview.result')}</span>
            <LevelChip level={preview.data.level} />
            <span className="text-sm text-[var(--text-2)]">{t('rp.score')} {preview.data.score}</span>
            {preview.data.blocking && <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[var(--critical)]"><Ban className="size-3.5" /> {t('rp.blocking')}</span>}
          </div>
        ) : (
          <span className="text-sm text-[var(--text-3)]">{t('common.loading')}</span>
        )}
      </div>
    </div>
  );
}

function PolicyHistory({ versions, selected, onSelect, compareWith, onCompare }: {
  versions: MatrixVersion[];
  selected: string | null;
  onSelect: (v: string) => void;
  compareWith: string | null;
  onCompare: (v: string | null) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const base = versions.find((v) => v.version === selected) ?? null;
  const other = versions.find((v) => v.version === compareWith) ?? null;
  return (
    <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--text-1)]"><History className="size-5 text-[var(--text-2)]" aria-hidden /> {t('rp.history.title')}</h2>
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.version}>
            <button
              type="button"
              onClick={() => onSelect(v.version)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${v.version === selected ? 'border-blue-500/60 bg-blue-500/5' : 'border-[var(--border-1)] hover:bg-[var(--surface-2)]'}`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--text-1)]">{v.version}</span>
                  <span className="text-xs text-[var(--text-2)]">{statusLabel(v.status, t)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--text-3)]">
                  {v.status === 'ACTIVE'
                    ? t('rp.history.approvedLine', { who: approverText(v, t), date: fmtDate(v.approvedAt, t, locale) })
                    : t('rp.history.createdLine', { date: fmtDate(v.createdAt, t, locale) })}
                  {v.rationale ? ` · ${v.rationale}` : ''}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {versions.length > 1 && (
        <div className="mt-4 border-t border-[var(--border-1)] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-2)]">{t('rp.compare.label')}</span>
            <span className="text-sm text-[var(--text-1)]">{base?.version ?? '—'}</span>
            <span className="text-[var(--text-3)]">↔</span>
            <Select value={compareWith ?? ''} onChange={(e) => onCompare(e.target.value || null)} className="w-auto" aria-label={t('rp.compare.selectAria')}>
              <option value="">{t('rp.compare.pick')}</option>
              {versions.filter((v) => v.version !== selected).map((v) => <option key={v.version} value={v.version}>{v.version}</option>)}
            </Select>
          </div>
          {base && other && <CompareTable a={base} b={other} />}
        </div>
      )}
    </section>
  );
}

function CompareTable({ a, b }: { a: MatrixVersion; b: MatrixVersion }) {
  const t = useT();
  const rows: Array<{ label: string; av: string; bv: string }> = [
    { label: t('rp.compare.status'), av: statusLabel(a.status, t), bv: statusLabel(b.status, t) },
    { label: t('rp.compare.blockingLevels'), av: a.definition.blockingLevels.join(', '), bv: b.definition.blockingLevels.join(', ') },
    { label: t('rp.compare.thresholds'), av: a.definition.thresholds.map((th) => `${th.level}≥${th.min}`).join('  '), bv: b.definition.thresholds.map((th) => `${th.level}≥${th.min}`).join('  ') },
    { label: t('rp.compare.sourceOverrides'), av: fmtOverrides(a.definition.sourceOverrides), bv: fmtOverrides(b.definition.sourceOverrides) },
    { label: t('rp.compare.sev4Min'), av: a.definition.severity4MinLevel ?? '—', bv: b.definition.severity4MinLevel ?? '—' },
  ];
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[24rem] text-left text-sm">
        <thead>
          <tr className="text-xs text-[var(--text-3)]"><th className="p-2"></th><th className="p-2">{a.version}</th><th className="p-2">{b.version}</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const diff = r.av !== r.bv;
            return (
              <tr key={r.label} className={diff ? 'bg-[var(--warning-bg)]/40' : ''}>
                <th scope="row" className="p-2 font-medium text-[var(--text-2)]">{r.label}</th>
                <td className="p-2 text-[var(--text-1)]">{r.av}</td>
                <td className="p-2 text-[var(--text-1)]">{r.bv}{diff && <span className="ml-1 text-xs text-[var(--warning-fg)]">{t('rp.compare.diff')}</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function fmtOverrides(o?: Record<string, unknown>): string {
  if (!o || Object.keys(o).length === 0) return '—';
  return Object.entries(o).map(([k, v]) => `${k}→${v}`).join('  ');
}

function ActivateModal({ version, hasActive, onClose, onDone }: {
  version: MatrixVersion;
  hasActive: MatrixVersion | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const [rationale, setRationale] = useState('');
  const mutation = useMutation({
    mutationFn: () => activateMatrix(version.version, rationale.trim()),
    onSuccess: () => { toast.success(t('rp.activate.toastSuccess', { version: version.version })); onDone(); },
    onError: (err) => { toast.error(localizeApiError(getApiError(err).code, t)); },
  });
  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title={t('rp.activate.title')} className="sm:max-w-md">
      <p className="text-sm text-[var(--text-2)]">
        {t('rp.activate.bodyPrefix')}<b className="text-[var(--text-1)]">{version.version}</b>{t('rp.activate.bodySuffix')}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--text-2)]">
        <li className="flex gap-2"><ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" /> {t('rp.activate.point1')}</li>
        {hasActive && <li className="flex gap-2"><ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" /> {t('rp.activate.point2Prefix')}<b>{hasActive.version}</b>{t('rp.activate.point2Suffix')}</li>}
        <li className="flex gap-2"><ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" /> {t('rp.activate.point3')}</li>
      </ul>
      {mutation.isError && <Alert tone="error" className="mt-3">{localizeApiError(getApiError(mutation.error).code, t)}{t('rp.activate.errorSuffix')}</Alert>}
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="mt-4 space-y-3">
        <Input label={t('rp.activate.rationaleLabel')} value={rationale} onChange={(e) => setRationale(e.target.value)} required minLength={3} placeholder={t('rp.activate.rationalePlaceholder')} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
          <Button type="submit" loading={mutation.isPending} disabled={rationale.trim().length < 3}>{t('rp.activate.submit', { version: version.version })}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RetireModal({ version, isOnlyActive, onClose, onDone }: {
  version: MatrixVersion;
  isOnlyActive: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useT();
  const mutation = useMutation({
    mutationFn: () => retireMatrix(version.version),
    onSuccess: () => { toast.success(t('rp.retire.toastSuccess', { version: version.version })); onDone(); },
    onError: (err) => { toast.error(localizeApiError(getApiError(err).code, t)); },
  });
  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title={t('rp.retire.title')} className="sm:max-w-md">
      <p className="text-sm text-[var(--text-2)]">{t('rp.retire.bodyPrefix')}<b className="text-[var(--text-1)]">{version.version}</b>{t('rp.retire.bodySuffix')}</p>
      {isOnlyActive && (
        <Alert tone="error" className="mt-3">
          {t('rp.retire.onlyActiveWarn')}
        </Alert>
      )}
      {mutation.isError && <Alert tone="error" className="mt-3">{localizeApiError(getApiError(mutation.error).code, t)}</Alert>}
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>{t('common.cancel')}</Button>
        <Button variant="danger-outline" loading={mutation.isPending} onClick={() => mutation.mutate()}>{t('rp.retire.confirm')}</Button>
      </div>
    </Modal>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4 text-sm">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-2)]">{title}</p>
      <div className="text-[var(--text-1)]">{children}</div>
    </div>
  );
}

function LevelChip({ level }: { level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) {
  const t = useT();
  const m = LEVEL_META[level];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.badge}`}>
      <Icon className="size-3" aria-hidden /> {riskLevelLabel(level, t)}
    </span>
  );
}
