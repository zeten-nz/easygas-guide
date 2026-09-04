import { ROLE_CODES, type Permission, type RoleCode, type User } from '../types/auth';

/**
 * UX-only permission check against the server-provided permission list.
 * Real authorization always happens on the backend.
 */
export function can(user: User | null, permission: Permission): boolean {
  return !!user && user.permissions.includes(permission);
}

/**
 * Mirrors the server policy (rbac/permissions.ts#getAssignableRoles) for form
 * options: full-role assigners see every role; branch-scoped creators (RAHBAR)
 * may only create technicians/masters. The server re-validates regardless.
 */
export function assignableRoles(user: User | null): readonly RoleCode[] {
  if (can(user, 'users.assign_role')) return ROLE_CODES;
  if (can(user, 'users.create')) return ['USTA', 'MASTER'];
  return [];
}
