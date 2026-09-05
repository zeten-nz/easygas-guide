export const ROLE_CODES = ['USTA', 'MASTER', 'RAHBAR', 'SIFAT', 'ADMIN'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const ROLE_LABELS: Record<RoleCode, string> = {
  USTA: 'Service ustasi',
  MASTER: 'Service masteri',
  RAHBAR: 'Service rahbari',
  SIFAT: 'Sifat nazorati',
  ADMIN: 'Administrator',
};

/**
 * Permission keys mirrored from the server RBAC registry (server/src/rbac/permissions.ts).
 * The authoritative list arrives with the user payload (`user.permissions`);
 * this type only gives autocomplete for UX checks. UX only — backend enforces.
 */
export type Permission =
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.block'
  | 'users.assign_role'
  | 'branches.manage'
  | 'registration.review'
  | 'customers.view'
  | 'customers.manage'
  | 'vehicles.view'
  | 'vehicles.manage'
  | 'jobs.view'
  | 'jobs.create'
  | 'services.view_all'
  | 'checklist.execute'
  | 'templates.manage'
  | 'stops.approve'
  | 'jobs.close'
  | 'jobs.reopen'
  // Phase 10D — safety domain
  | 'risks.create'
  | 'risks.resolve'
  | 'risks.override'
  | 'risk.matrix.approve'
  | 'jobs.assign'
  | 'gps.override';

export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  branchId: number | null;
  role: RoleCode;
  status: UserStatus;
  avatarUrl: string | null;
  permissions: string[];
}

export interface Branch {
  id: number;
  name: string;
  region: string;
}

export interface BranchFull extends Branch {
  address: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  userCount?: number;
}

export interface UserDetail {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  role: RoleCode;
  branchId: number | null;
  branchName: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
}

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RegistrationRequest {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  branchId: number;
  branchName: string;
  comment: string | null;
  status: RegistrationStatus;
  rejectReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
