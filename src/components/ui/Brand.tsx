import { cn } from '../../lib/utils';

/**
 * EASY GAS brand mark. Renders the REAL logo assets from /public (never
 * regenerated, redrawn, recolored or distorted). Three inspected variants:
 *
 *  - 'wordmark' (easygas-side-text.png, 729×207) — horizontal lockup: the eG
 *     monogram + "easy gas". Contains the company name → never add text beside it.
 *  - 'stacked'  (easygas-bottom-text.png, 1024×1024) — monogram over "easy gas".
 *  - 'mark'     (easygas-none-text.png, 1024×1024) — the monogram alone (icon).
 *
 * Intrinsic width/height are set from each asset's real aspect ratio so there is
 * no cumulative layout shift. Above-the-fold uses (`priority`) load eagerly; the
 * rest lazy-load. All three are transparent PNGs suited to LIGHT surfaces.
 */
export type BrandVariant = 'wordmark' | 'stacked' | 'mark';

const ASSETS: Record<BrandVariant, { src: string; ratio: number }> = {
  wordmark: { src: '/easygas-side-text.png', ratio: 729 / 207 },
  stacked: { src: '/easygas-bottom-text.png', ratio: 1 },
  mark: { src: '/easygas-none-text.png', ratio: 1 },
};

export function Brand({
  variant = 'wordmark',
  height = 32,
  className,
  priority = false,
  decorative = false,
}: {
  variant?: BrandVariant;
  /** Rendered height in px; width follows the asset's real aspect ratio. */
  height?: number;
  className?: string;
  /** Eager-load an above-the-fold logo (e.g. header, login). */
  priority?: boolean;
  /** true when a nearby text label already names the brand → empty alt. */
  decorative?: boolean;
}) {
  const { src, ratio } = ASSETS[variant];
  const width = Math.round(height * ratio);
  return (
    <img
      src={src}
      width={width}
      height={height}
      alt={decorative ? '' : 'EASY GAS'}
      aria-hidden={decorative || undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      className={cn('block select-none object-contain', className)}
      style={{ height, width }}
    />
  );
}
