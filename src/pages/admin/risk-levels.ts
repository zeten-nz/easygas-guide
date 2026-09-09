import { ShieldCheck, ShieldAlert, AlertTriangle, OctagonAlert, type LucideIcon } from 'lucide-react';
import type { RiskLevel } from '../../api/safety.api';

/**
 * Uzbek labels + colour-supplemented styling for the four risk levels. Colour is
 * NEVER the only signal — every use pairs the tint with the text label (and, where
 * shown, an icon). Levels are rendered from the server-provided definition; these
 * are presentation only, not thresholds.
 */
export const LEVEL_META: Record<RiskLevel, { label: string; Icon: LucideIcon; cell: string; badge: string }> = {
  LOW: { label: 'Past', Icon: ShieldCheck, cell: 'bg-[var(--success-bg)] text-[var(--success-fg)]', badge: 'bg-[var(--success-bg)] text-[var(--success-fg)]' },
  MEDIUM: { label: "O'rta", Icon: ShieldAlert, cell: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]', badge: 'bg-[var(--warning-bg)] text-[var(--warning-fg)]' },
  HIGH: { label: 'Yuqori', Icon: AlertTriangle, cell: 'bg-[var(--danger-bg)] text-[var(--danger-fg)]', badge: 'bg-[var(--danger-bg)] text-[var(--danger-fg)]' },
  CRITICAL: { label: 'Kritik', Icon: OctagonAlert, cell: 'bg-[var(--critical-bg)] text-[var(--critical)]', badge: 'bg-[var(--critical-bg)] text-[var(--critical)]' },
};

export const STATUS_LABEL: Record<'DRAFT' | 'ACTIVE' | 'RETIRED', string> = {
  DRAFT: 'Qoralama (tasdiqlanmagan)',
  ACTIVE: 'Faol (tasdiqlangan)',
  RETIRED: 'Chiqarilgan (tarixiy)',
};
