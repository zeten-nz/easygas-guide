import {
  Building2,
  Car,
  CheckCircle2,
  ClipboardList,
  Contact,
  Home,
  Library,
  ListChecks,
  ShieldAlert,
  Tag,
  UserPlus,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '../../types/auth';
import type { MessageKey } from '../../i18n/types';

export interface NavItem {
  to: string;
  /** i18n key for the visible label (translated at render time). */
  labelKey: MessageKey;
  icon: LucideIcon;
  /** null = always visible (Home). Otherwise gated by this permission (UX only). */
  permission: Permission | null;
  end?: boolean;
}

export interface NavGroup {
  /** null = an ungrouped leading item (Home). Otherwise an i18n key for the header. */
  labelKey: MessageKey | null;
  items: NavItem[];
}

/**
 * Grouped, permission-driven navigation for the workspace sidebar. Groups render
 * only when the viewer can reach at least one item in them; items only when
 * authorized. The backend enforces every permission — these checks are UX only.
 *
 * Labels are i18n KEYS, resolved with `t()` in the Sidebar / top bar so the whole
 * navigation switches language with the rest of the UI.
 */
export const NAV_GROUPS: NavGroup[] = [
  { labelKey: null, items: [{ to: '/app', labelKey: 'nav.home', icon: Home, permission: null, end: true }] },
  {
    labelKey: 'nav.group.work',
    items: [
      { to: '/app/my-jobs', labelKey: 'nav.myJobs', icon: Wrench, permission: 'checklist.execute' },
      { to: '/app/jobs', labelKey: 'nav.jobs', icon: ListChecks, permission: 'jobs.view' },
      { to: '/app/jobs?status=COMPLETED', labelKey: 'nav.completedJobs', icon: CheckCircle2, permission: 'jobs.view' },
    ],
  },
  {
    labelKey: 'nav.group.staff',
    items: [
      { to: '/app/admin/users', labelKey: 'nav.staff', icon: Users, permission: 'users.view' },
      { to: '/app/admin/registration-requests', labelKey: 'nav.requests', icon: UserPlus, permission: 'registration.review' },
    ],
  },
  {
    labelKey: 'nav.group.operations',
    items: [
      { to: '/app/customers', labelKey: 'nav.customers', icon: Contact, permission: 'customers.view' },
      { to: '/app/vehicles', labelKey: 'nav.vehicles', icon: Car, permission: 'vehicles.view' },
      { to: '/app/admin/branches', labelKey: 'nav.branches', icon: Building2, permission: 'branches.manage' },
      { to: '/app/admin/templates', labelKey: 'nav.templates', icon: ClipboardList, permission: 'templates.manage' },
    ],
  },
  {
    labelKey: 'nav.group.catalog',
    items: [
      { to: '/app/catalog/products', labelKey: 'nav.priceBase', icon: Tag, permission: 'catalog.view' },
      { to: '/app/reference', labelKey: 'nav.references', icon: Library, permission: 'catalog.view' },
    ],
  },
  {
    labelKey: 'nav.group.safety',
    items: [{ to: '/app/admin/risk-policy', labelKey: 'nav.riskPolicy', icon: ShieldAlert, permission: 'risk.matrix.approve' }],
  },
];

/** Flat list for section matching. */
const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/**
 * The i18n key of the workspace section the pathname belongs to (longest-prefix
 * match), used for the top-bar page context. Detail routes resolve to their
 * section (e.g. /app/admin/users/5 → nav.staff). Home matches only exactly.
 * The caller translates the returned key with `t()`.
 */
export function activeSectionLabel(pathname: string): MessageKey | null {
  if (pathname === '/app' || pathname === '/app/') return 'nav.home';
  let best: NavItem | null = null;
  for (const item of ALL_ITEMS) {
    if (item.end) continue;
    if (pathname === item.to || pathname.startsWith(item.to + '/')) {
      if (!best || item.to.length > best.to.length) best = item;
    }
  }
  if (pathname === '/app/profile') return 'nav.profile';
  // Both price-base tabs (products/services) belong to the same section.
  if (pathname.startsWith('/app/catalog')) return 'nav.priceBase';
  return best?.labelKey ?? null;
}
