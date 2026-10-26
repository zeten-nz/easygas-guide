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
import { LEVEL_META, STATUS_LABEL } from './risk-levels';
import {
  listMatrixVersions, getMatrixVersionDetail, previewClassification, activateMatrix, retireMatrix,
  type MatrixVersion, type MatrixVersionDetail, type RiskSource,
} from '../../api/safety.api';
import { getApiError } from '../../api/client';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';

const SOURCE_LABEL: Record<RiskSource, string> = {
  MANUAL: "Qo'lda kiritilgan",
  STOP_REJECTED: 'STOP rad etilgan',
  MEASUREMENT_OUT_OF_RANGE: "O'lchov chegaradan tashqari",
  CHECKLIST_FLAG: 'Checklist belgisi',
};

function fmtDate(iso: string | null): string {
  if (!iso) return "noma'lum";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "noma'lum" : d.toLocaleString('uz-UZ');
}
function approverText(v: { approvedByName: string | null; approvedBy: number | null }): string {
  return v.approvedByName ?? (v.approvedBy != null ? `Foydalanuvchi #${v.approvedBy}` : "noma'lum");
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
        <h1 className="text-xl font-bold text-[var(--text-1)]">Xavf siyosati</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Xavf matritsasini tushunish, ko'rish va tasdiqlash (§21)</p>
      </header>

      {versionsQuery.isSuccess && !hasActive && (
        <Alert tone="error">
          <strong>Faol tasdiqlangan xavf siyosati yo'q.</strong> Xavfsizlik amaliyotlari (ish boshlash, yakunlash,
          sifat tasdiqlash) to'xtatilgan. Quyidagi qoralamani mas'ul mutaxassis tasdiqlashi kerak.
        </Alert>
      )}

      <PolicyExplainer />

      {versionsQuery.isLoading && <div className="flex justify-center py-16" role="status" aria-label="Yuklanmoqda"><Spinner /></div>}
      {versionsQuery.isError && <Alert tone="error">{getApiError(versionsQuery.error).message}</Alert>}

      {versionsQuery.isSuccess && versions.length === 0 && (
        <Alert tone="info">Hozircha xavf matritsasi versiyalari mavjud emas.</Alert>
      )}

      {versionsQuery.isSuccess && effectiveVersion && (
        <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="version-pick" className="text-sm font-medium text-[var(--text-2)]">Versiya:</label>
              <Select id="version-pick" value={effectiveVersion} onChange={(e) => setSelectedVersion(e.target.value)} className="w-auto">
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>{v.version} — {STATUS_LABEL[v.status]}</option>
                ))}
              </Select>
            </div>
            {detailQuery.data && <StatusPill status={detailQuery.data.status} />}
          </div>

          {detailQuery.isError && (
            <Alert tone="error">Versiya ma'lumotini yuklab bo'lmadi: {getApiError(detailQuery.error).message}</Alert>
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
  const isActive = status === 'ACTIVE';
  const Icon = isActive ? ShieldCheck : ShieldAlert;
  const cls = isActive ? 'bg-[var(--success-bg)] text-[var(--success-fg)]' : status === 'RETIRED' ? 'bg-[var(--surface-2)] text-[var(--text-2)]' : 'bg-[var(--warning-bg)] text-[var(--warning-fg)]';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      <Icon className="size-4" aria-hidden /> {STATUS_LABEL[status as 'DRAFT']}
    </span>
  );
}

function PolicyExplainer() {
  return (
    <details className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface-2)] p-5 open:pb-6" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-[var(--text-1)]">
        <Info className="size-5 text-[var(--text-2)]" aria-hidden /> Xavf siyosati nima?
        <ChevronRight className="ml-auto size-4 text-[var(--text-3)] transition-transform [details[open]_&]:rotate-90" aria-hidden />
      </summary>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-2)]">
        <p>Har bir <b>xavf hodisasi</b> aniq bir <b>ishga</b> tegishli bo'ladi.</p>
        <p><b>Xavf matritsasi</b> — xavflarni tasniflash uchun ishlatiladigan qoida. U ikki o'lchamga tayanadi:</p>
        <ul className="ml-4 list-disc space-y-1">
          <li><b>Og'irlik (severity)</b> — oqibat qanchalik jiddiy bo'lishi mumkinligi.</li>
          <li><b>Ehtimollik (likelihood)</b> — bu holat yuz berish ehtimoli.</li>
        </ul>
        <p><b>Bloklovchi darajalar</b> tegishli ishni yakunlash va sifat tasdiqlashni xavf hal etilmaguncha to'sadi.</p>
        <p><b>Tasdiqlangan (faol) siyosat</b> — mavjud xavfsizlik jarayoni talab qiladigan shart: faol siyosatsiz ish boshlash va yakunlash to'xtatiladi.</p>
        <p className="text-xs text-[var(--text-3)]">Bu sahifa yuridik sertifikat yoki ishning xavfsizligining isboti emas; namunalar haqiqiy xavfsizlik bahosini bermaydi. Batafsil: loyiha hujjatlari §21.</p>
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
  const def = detail.definition;
  return (
    <div className="space-y-5">
      <RiskMatrixTable cells={detail.cells} definition={def} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard title="Hisoblash qoidasi">
          <p>Ball = og'irlik × ehtimollik. Darajalar (yuqoridan pastga birinchi mos keladi):</p>
          <ul className="mt-1 space-y-0.5">
            {def.thresholds.map((t) => (
              <li key={`${t.min}-${t.level}`} className="flex items-center gap-2">
                <LevelChip level={t.level} /> <span className="text-[var(--text-2)]">ball ≥ {t.min}</span>
              </li>
            ))}
          </ul>
        </InfoCard>
        <InfoCard title="Bloklovchi va maxsus qoidalar">
          <p className="flex flex-wrap items-center gap-1.5"><Ban className="size-4 text-[var(--critical)]" aria-hidden /> Bloklovchi darajalar: {def.blockingLevels.map((l) => <LevelChip key={l} level={l} />)}</p>
          {def.severity4MinLevel && <p className="mt-1">Og'irlik 4 kamida <LevelChip level={def.severity4MinLevel} /> darajasida.</p>}
          {def.sourceOverrides && Object.keys(def.sourceOverrides).length > 0 && (
            <div className="mt-1">
              <p className="text-[var(--text-2)]">Manba bo'yicha ustuvorlik:</p>
              <ul className="mt-0.5 space-y-0.5">
                {Object.entries(def.sourceOverrides).map(([src, lvl]) => (
                  <li key={src} className="flex items-center gap-1.5">{SOURCE_LABEL[src as RiskSource] ?? src} → <LevelChip level={lvl as never} /></li>
                ))}
              </ul>
            </div>
          )}
          {detail.blockedOperations.length > 0 && (
            <p className="mt-2 text-xs text-[var(--text-3)]">Bloklovchi xavf quyidagilarni to'sadi: {detail.blockedOperations.join(', ')}.</p>
          )}
        </InfoCard>
      </div>

      <ProvenanceCard detail={detail} />

      <MatrixPreview detail={detail} />

      {mayApprove && (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border-1)] pt-4">
          {detail.status === 'DRAFT' && <Button onClick={onActivate}><ShieldCheck className="size-4" /> Bu versiyani faollashtirish</Button>}
          {detail.status === 'ACTIVE' && <Button variant="danger-outline" onClick={onRetire}><Ban className="size-4" /> Chiqarish (retire)</Button>}
        </div>
      )}
    </div>
  );
}

function ProvenanceCard({ detail }: { detail: MatrixVersionDetail }) {
  const provisional = detail.version === 'v1';
  return (
    <InfoCard title="Kelib chiqishi va tasdiq">
      {/* Distinguish the DEFINITION's provenance (author-chosen "provisional" v1)
          from the lifecycle approval. An APPROVED provisional-origin version is NOT
          "unapproved". */}
      {provisional && (
        <p className="text-[var(--text-2)]">Ta'rif kelib chiqishi: <b>vaqtinchalik (provisional)</b> — dastlab ishlab chiqishda tanlangan. Bu lifecycle (tasdiq) holatidan alohida: tasdiqlangan versiya "tasdiqlanmagan" degani emas.</p>
      )}
      {detail.status === 'ACTIVE' ? (
        <p className="mt-1">Tasdiqladi: <b>{approverText(detail)}</b> · {fmtDate(detail.approvedAt)}</p>
      ) : detail.status === 'RETIRED' ? (
        <p className="mt-1 text-[var(--text-2)]">Bu versiya chiqarilgan (tarixiy). Yaratilgan: {fmtDate(detail.createdAt)}</p>
      ) : (
        <p className="mt-1 text-[var(--text-2)]">Hali tasdiqlanmagan (qoralama). Yaratilgan: {fmtDate(detail.createdAt)}</p>
      )}
      {detail.rationale && <p className="mt-1 text-xs text-[var(--text-3)]">Asos/havola: {detail.rationale}</p>}
    </InfoCard>
  );
}

function MatrixPreview({ detail }: { detail: MatrixVersionDetail }) {
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
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--text-1)]"><FlaskConical className="size-4 text-[var(--text-2)]" aria-hidden /> Namuna baholash</p>
      <p className="mt-0.5 text-xs text-[var(--text-3)]">
        Bu <b>{detail.version}</b> matritsasi bo'yicha <b>namuna</b> — saqlangan baho emas, hech qanday xavf hodisasi yaratmaydi.
        {detail.status !== 'ACTIVE' && ' Ishlab chiqarish bahosi hamon FAOL siyosatni talab qiladi.'}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Select label="Og'irlik" value={severity} onChange={(e) => setSeverity(Number(e.target.value))}>
          {def.allowedSeverity.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select label="Ehtimollik" value={likelihood} onChange={(e) => setLikelihood(Number(e.target.value))}>
          {def.allowedLikelihood.map((l) => <option key={l} value={l}>{l}</option>)}
        </Select>
        <Select label="Manba" value={source} onChange={(e) => setSource(e.target.value as RiskSource)}>
          {(Object.keys(SOURCE_LABEL) as RiskSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </Select>
      </div>
      <div className="mt-3 min-h-[2.5rem]" aria-live="polite">
        {preview.isError ? (
          <Alert tone="error">{getApiError(preview.error).message}</Alert>
        ) : preview.data ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[var(--text-2)]">Natija (namuna):</span>
            <LevelChip level={preview.data.level} />
            <span className="text-sm text-[var(--text-2)]">ball {preview.data.score}</span>
            {preview.data.blocking && <span className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[var(--critical)]"><Ban className="size-3.5" /> Bloklovchi</span>}
          </div>
        ) : (
          <span className="text-sm text-[var(--text-3)]">Yuklanmoqda…</span>
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
  const base = versions.find((v) => v.version === selected) ?? null;
  const other = versions.find((v) => v.version === compareWith) ?? null;
  return (
    <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--text-1)]"><History className="size-5 text-[var(--text-2)]" aria-hidden /> Versiyalar tarixi</h2>
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
                  <span className="text-xs text-[var(--text-2)]">{STATUS_LABEL[v.status]}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[var(--text-3)]">
                  {v.status === 'ACTIVE' ? `Tasdiqladi: ${approverText(v)} · ${fmtDate(v.approvedAt)}` : `Yaratilgan: ${fmtDate(v.createdAt)}`}
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
            <span className="text-sm font-medium text-[var(--text-2)]">Taqqoslash:</span>
            <span className="text-sm text-[var(--text-1)]">{base?.version ?? '—'}</span>
            <span className="text-[var(--text-3)]">↔</span>
            <Select value={compareWith ?? ''} onChange={(e) => onCompare(e.target.value || null)} className="w-auto" aria-label="Taqqoslash versiyasi">
              <option value="">Versiya tanlang</option>
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
  const rows: Array<{ label: string; av: string; bv: string }> = [
    { label: 'Holat', av: STATUS_LABEL[a.status], bv: STATUS_LABEL[b.status] },
    { label: 'Bloklovchi darajalar', av: a.definition.blockingLevels.join(', '), bv: b.definition.blockingLevels.join(', ') },
    { label: 'Chegaralar', av: a.definition.thresholds.map((t) => `${t.level}≥${t.min}`).join('  '), bv: b.definition.thresholds.map((t) => `${t.level}≥${t.min}`).join('  ') },
    { label: 'Manba ustuvorligi', av: fmtOverrides(a.definition.sourceOverrides), bv: fmtOverrides(b.definition.sourceOverrides) },
    { label: 'Og\'irlik 4 min', av: a.definition.severity4MinLevel ?? '—', bv: b.definition.severity4MinLevel ?? '—' },
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
                <td className="p-2 text-[var(--text-1)]">{r.bv}{diff && <span className="ml-1 text-xs text-[var(--warning-fg)]">(farq)</span>}</td>
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
  const [rationale, setRationale] = useState('');
  const mutation = useMutation({
    mutationFn: () => activateMatrix(version.version, rationale.trim()),
    onSuccess: () => { toast.success(`${version.version} faollashtirildi`); onDone(); },
    onError: (err) => { toast.error(getApiError(err).message); },
  });
  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title="Xavf siyosatini faollashtirish" className="sm:max-w-md">
      <p className="text-sm text-[var(--text-2)]">
        <b className="text-[var(--text-1)]">{version.version}</b> versiyasi <b>FAOL (tasdiqlangan)</b> siyosatga aylanadi.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-[var(--text-2)]">
        <li className="flex gap-2"><ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" /> Bu ishlab chiqarishdagi barcha yangi xavf baholariga qo'llaniladi.</li>
        {hasActive && <li className="flex gap-2"><ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" /> Joriy faol <b>{hasActive.version}</b> avtomatik chiqariladi.</li>}
        <li className="flex gap-2"><ChevronRight className="size-4 shrink-0 text-[var(--text-3)]" /> Bloklovchi darajadagi xavf ish yakunlash va sifat tasdiqlashni to'sadi.</li>
      </ul>
      {mutation.isError && <Alert tone="error" className="mt-3">{getApiError(mutation.error).message}. Holat yangilandi — qayta ko'ring.</Alert>}
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="mt-4 space-y-3">
        <Input label="Tasdiqlash asosi / havola (majburiy)" value={rationale} onChange={(e) => setRationale(e.target.value)} required minLength={3} placeholder="Masalan: xavfsizlik mutaxassisi tasdig'i, hujjat #..." />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
          <Button type="submit" loading={mutation.isPending} disabled={rationale.trim().length < 3}>{version.version}ni faollashtirish</Button>
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
  const mutation = useMutation({
    mutationFn: () => retireMatrix(version.version),
    onSuccess: () => { toast.success(`${version.version} chiqarildi`); onDone(); },
    onError: (err) => { toast.error(getApiError(err).message); },
  });
  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title="Versiyani chiqarish" className="sm:max-w-md">
      <p className="text-sm text-[var(--text-2)]"><b className="text-[var(--text-1)]">{version.version}</b> versiyasi chiqariladi (tarixiy holatga o'tadi).</p>
      {isOnlyActive && (
        <Alert tone="error" className="mt-3">
          Bu yagona <b>faol</b> siyosat. Uni chiqarsangiz, <b>faol siyosat qolmaydi</b> — ish boshlash va yakunlash to'xtaydi (fail-closed).
        </Alert>
      )}
      {mutation.isError && <Alert tone="error" className="mt-3">{getApiError(mutation.error).message}</Alert>}
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Bekor qilish</Button>
        <Button variant="danger-outline" loading={mutation.isPending} onClick={() => mutation.mutate()}>Chiqarishni tasdiqlash</Button>
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
  const m = LEVEL_META[level];
  const Icon = m.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.badge}`}>
      <Icon className="size-3" aria-hidden /> {m.label}
    </span>
  );
}
