import {
  Building2,
  Car,
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

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** null = always visible (Home). Otherwise gated by this permission (UX only). */
  permission: Permission | null;
  end?: boolean;
}

export interface NavGroup {
  /** null = an ungrouped leading item (Home). */
  label: string | null;
  items: NavItem[];
}

/**
 * Grouped, permission-driven navigation for the workspace sidebar. Groups render
 * only when the viewer can reach at least one item in them; items only when
 * authorized. The backend enforces every permission — these checks are UX only.
 */
export const NAV_GROUPS: NavGroup[] = [
  { label: null, items: [{ to: '/app', label: 'Bosh sahifa', icon: Home, permission: null, end: true }] },
  {
    label: 'Ish',
    items: [
      { to: '/app/my-jobs', label: 'Mening ishlarim', icon: Wrench, permission: 'checklist.execute' },
      { to: '/app/jobs', label: 'Ishlar', icon: ListChecks, permission: 'jobs.view' },
    ],
  },
  {
    label: 'Xodimlar',
    items: [
      { to: '/app/admin/users', label: 'Xodimlar', icon: Users, permission: 'users.view' },
      { to: '/app/admin/registration-requests', label: "So'rovlar", icon: UserPlus, permission: 'registration.review' },
    ],
  },
  {
    label: 'Amaliyot',
    items: [
      { to: '/app/customers', label: 'Mijozlar', icon: Contact, permission: 'customers.view' },
      { to: '/app/vehicles', label: 'Avtomobillar', icon: Car, permission: 'vehicles.view' },
      { to: '/app/admin/branches', label: 'Filiallar', icon: Building2, permission: 'branches.manage' },
      { to: '/app/admin/templates', label: 'Shablonlar', icon: ClipboardList, permission: 'templates.manage' },
    ],
  },
  {
    label: 'Katalog',
    items: [
      { to: '/app/catalog/products', label: 'Narx bazasi', icon: Tag, permission: 'catalog.view' },
      { to: '/app/reference', label: "Ma'lumotnomalar", icon: Library, permission: 'catalog.view' },
    ],
  },
  {
    label: 'Xavfsizlik',
    items: [{ to: '/app/admin/risk-policy', label: 'Xavf siyosati', icon: ShieldAlert, permission: 'risk.matrix.approve' }],
  },
];

/** Flat list for section matching. */
const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

/**
 * The label of the workspace section the pathname belongs to (longest-prefix
 * match), used for the top-bar page context. Detail routes resolve to their
 * section (e.g. /app/admin/users/5 → "Xodimlar"). Home matches only exactly.
 */
export function activeSectionLabel(pathname: string): string | null {
  if (pathname === '/app' || pathname === '/app/') return 'Bosh sahifa';
  let best: NavItem | null = null;
  for (const item of ALL_ITEMS) {
    if (item.end) continue;
    if (pathname === item.to || pathname.startsWith(item.to + '/')) {
      if (!best || item.to.length > best.to.length) best = item;
    }
  }
  if (pathname === '/app/profile') return 'Mening profilim';
  // Both price-base tabs (products/services) belong to the same "Narx bazasi" section.
  if (pathname.startsWith('/app/catalog')) return 'Narx bazasi';
  return best?.label ?? null;
}
