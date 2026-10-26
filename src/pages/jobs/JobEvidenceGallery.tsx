import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Camera, ImageOff, Loader2, RefreshCw } from 'lucide-react';
import * as jobsApi from '../../api/jobs.api';
import type { JobPhoto } from '../../api/jobs.api';
import { getApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { RoleBadge, EvidenceMeta } from './evidence-badges';
import { isAccessible } from './evidence-labels';
import { PhotoViewer } from './PhotoViewer';

/**
 * Phase 11C — the "Fotolar" evidence gallery embedded in a job's detail. It reads
 * the job-level evidence listing (truthful per-photo provenance) and groups photos
 * by COMPLETED cycle (authoritative snapshot history) then step; current/other
 * evidence is a separate group. Thumbnails reserve their box (aspect-square) and
 * lazy-load; only READY photos are viewable — unverified/pending/failed rows show
 * their state honestly and are not clickable. Loading/empty/error/retry states are
 * all handled; the total count comes from the server, and more rows load
 * incrementally (real jobs are small, so one page usually suffices).
 */
interface Group {
  key: string;
  title: string;
  subtitle?: string;
  photos: JobPhoto[];
}

export function JobEvidenceGallery({ jobId }: { jobId: number }) {
  const [limit, setLimit] = useState(60);
  const [viewer, setViewer] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['jobs', 'detail', jobId, 'photos', limit],
    queryFn: () => jobsApi.fetchJobPhotos(jobId, { limit }),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const photos = useMemo(() => data?.photos ?? [], [data?.photos]);

  // Accessible photos in display order = the viewer's navigation context.
  const grouped = useMemo(() => groupPhotos(photos, data?.cycles ?? []), [photos, data?.cycles]);
  const accessible = useMemo(() => grouped.flatMap((g) => g.photos).filter(isAccessible), [grouped]);
  const accessibleIndex = useMemo(() => new Map(accessible.map((p, i) => [p.id, i])), [accessible]);

  return (
    <section className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-5 sm:p-6" aria-labelledby="evidence-heading">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="evidence-heading" className="flex items-center gap-2 text-lg font-bold text-[var(--text-1)]">
          <Camera className="size-5 text-[var(--text-2)]" aria-hidden /> Fotolar
        </h2>
        {data && data.total > 0 && <span className="text-sm text-[var(--text-3)]">Jami {data.total} ta</span>}
      </div>

      {query.isLoading && (
        <div className="flex items-center justify-center gap-2 py-10 text-[var(--text-3)]"><Loader2 className="size-5 animate-spin" /> Yuklanmoqda…</div>
      )}

      {query.isError && (
        <Alert tone="error">
          <div className="flex items-center justify-between gap-3">
            <span>Fotolarni yuklab bo'lmadi: {getApiError(query.error).message}</span>
            <Button size="sm" variant="secondary" onClick={() => query.refetch()}><RefreshCw className="size-4" /> Qayta urinish</Button>
          </div>
        </Alert>
      )}

      {query.isSuccess && photos.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10 text-center text-[var(--text-3)]">
          <ImageOff className="size-8" aria-hidden />
          <p>Bu ish uchun foto dalillar mavjud emas.</p>
        </div>
      )}

      {query.isSuccess && grouped.map((group) => (
        <div key={group.key} className="mb-6 last:mb-0">
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-1)]">{group.title}</h3>
            {group.subtitle && <span className="text-xs text-[var(--text-3)]">{group.subtitle}</span>}
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {group.photos.map((photo) => (
              <li key={photo.id} className="overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                <PhotoTile photo={photo} jobId={jobId} onOpen={() => { const i = accessibleIndex.get(photo.id); if (i != null) setViewer(i); }} />
                <div className="p-2">
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-medium text-[var(--text-2)]" title={photo.stepName}>{photo.stepName}</span>
                    <RoleBadge role={photo.role} />
                  </div>
                  <EvidenceMeta photo={photo} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {query.isSuccess && data && data.total > photos.length && (
        <div className="mt-2 flex justify-center">
          <Button variant="secondary" size="sm" loading={query.isFetching} onClick={() => setLimit((l) => l + 60)}>
            Yana yuklash ({photos.length} / {data.total})
          </Button>
        </div>
      )}

      {viewer != null && accessible.length > 0 && (
        <PhotoViewer jobId={jobId} photos={accessible} index={Math.min(viewer, accessible.length - 1)} onIndexChange={setViewer} onClose={() => setViewer(null)} />
      )}
    </section>
  );
}

function PhotoTile({ photo, jobId, onOpen }: { photo: JobPhoto; jobId: number; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  if (!isAccessible(photo)) {
    // Not real, accessible evidence — show the state honestly; not clickable.
    return (
      <div className="flex aspect-square items-center justify-center bg-[var(--surface-2)] text-center text-[var(--text-3)]" aria-label={`Ko'rib bo'lmaydi: ${photo.role}`}>
        <ImageOff className="size-7" aria-hidden />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Rasmni ochish — ${photo.stepName}, urinish ${photo.attempt}`}
      className="relative block aspect-square w-full overflow-hidden bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
    >
      {!loaded && !failed && <span className="absolute inset-0 flex items-center justify-center text-[var(--text-3)]"><Loader2 className="size-5 animate-spin" /></span>}
      {failed ? (
        <span className="absolute inset-0 flex items-center justify-center text-[var(--text-3)]"><ImageOff className="size-6" /></span>
      ) : (
        <img
          src={jobsApi.stepPhotoUrl(jobId, photo.jobStepId, photo.id)}
          alt={`${photo.stepName} — urinish ${photo.attempt}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className="size-full object-cover transition-opacity"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      )}
    </button>
  );
}

/** Groups by completed cycle (snapshot history) then a current/other bucket. */
function groupPhotos(photos: JobPhoto[], cycles: { cycle: number }[]): Group[] {
  const byCycle = new Map<number, JobPhoto[]>();
  const other: JobPhoto[] = [];
  for (const p of photos) {
    if (p.cycle != null) { (byCycle.get(p.cycle) ?? byCycle.set(p.cycle, []).get(p.cycle)!).push(p); }
    else other.push(p);
  }
  const sortStep = (a: JobPhoto, b: JobPhoto) => a.stepOrder - b.stepOrder || a.attempt - b.attempt || a.id - b.id;
  const groups: Group[] = [];
  if (other.length > 0) {
    other.sort(sortStep);
    groups.push({ key: 'current', title: 'Joriy va boshqa dalillar', subtitle: 'joriy tsikl / eskirgan urinishlar', photos: other });
  }
  const completedCycles = [...byCycle.keys()].sort((a, b) => b - a); // latest completed first
  const total = cycles.length;
  for (const cyc of completedCycles) {
    const list = byCycle.get(cyc)!.sort(sortStep);
    groups.push({ key: `cycle-${cyc}`, title: `${cyc}-tsikl (yakunlangan)`, subtitle: total > 1 ? `${total} tsikldan biri` : undefined, photos: list });
  }
  return groups;
}
