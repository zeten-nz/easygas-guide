import { ShieldCheck, ShieldAlert, AlertTriangle, OctagonAlert, type LucideIcon } from 'lucide-react';
import type { RiskLevel } from '../../api/safety.api';
import type { TFunc } from '../../i18n/i18n';
import type { MessageKey } from '../../i18n/types';

/**
 * Colour-supplemented styling for the four risk levels. Colour is NEVER the only
 * signal — every use pairs the tint with the text label (and, where shown, an
 * icon). Levels are rendered from the server-provided definition; these are
 * presentation only, not thresholds.
 *
 * Display LABELS are localized via i18n keys (`riskLevelLabel` / `statusLabel`);
 * the level and status CODES are stable and never change.
 */
export const LEVEL_META: Record<RiskLevel, { Icon: LucideIcon; cell: string; badge: string }> = {
  LOW: { Icon: ShieldCheck, cell: 'bg-[var(--success-bg)] text-[var(--success-fg)]', badge: 'bg-[var(--success-bg)] text-[var(--success-fg)]' },
  MEDIUM: { Icon: ShieldAlert, cell: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]', badge: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  HIGH: { Icon: AlertTriangle, cell: 'bg-[var(--danger-bg)] text-[var(--danger-fg)]', badge: 'bg-[var(--danger-bg)] text-[var(--danger-fg)]' },
  CRITICAL: { Icon: OctagonAlert, cell: 'bg-[var(--critical-bg)] text-[var(--critical)]', badge: 'bg-[var(--critical-bg)] text-[var(--critical)]' },
};

const LEVEL_LABEL_KEY: Record<RiskLevel, MessageKey> = {
  LOW: 'rp.level.LOW',
  MEDIUM: 'rp.level.MEDIUM',
  HIGH: 'rp.level.HIGH',
  CRITICAL: 'rp.level.CRITICAL',
};

/** Localized display label for a risk-level CODE (the code itself stays stable). */
export function riskLevelLabel(level: RiskLevel, t: TFunc): string {
  return t(LEVEL_LABEL_KEY[level]);
}

export type VersionStatusCode = 'DRAFT' | 'ACTIVE' | 'RETIRED';

const STATUS_LABEL_KEY: Record<VersionStatusCode, MessageKey> = {
  DRAFT: 'rp.status.DRAFT',
  ACTIVE: 'rp.status.ACTIVE',
  RETIRED: 'rp.status.RETIRED',
};

/** Localized display label for a matrix-version status CODE (the code stays stable). */
export function statusLabel(status: VersionStatusCode, t: TFunc): string {
  return t(STATUS_LABEL_KEY[status]);
}
