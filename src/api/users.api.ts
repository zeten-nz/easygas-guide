import { api } from './client';
import type { RoleCode, UserDetail, UserStatus } from '../types/auth';

export interface ListUsersParams {
  search?: string;
  role?: RoleCode;
  branchId?: number;
  status?: UserStatus;
  page?: number;
  limit?: number;
  /** Employee directory only: exclude the current caller from the results. */
  excludeSelf?: boolean;
}

export interface ListUsersResult {
  users: UserDetail[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  branchId: number | null;
  roleCode: RoleCode;
  password: string;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  region?: string;
  branchId?: number | null;
  roleCode?: RoleCode;
}

export async function fetchUsers(params: ListUsersParams): Promise<ListUsersResult> {
  const { data } = await api.get('/users', { params });
  return data;
}

export async function fetchUser(id: number): Promise<UserDetail> {
  const { data } = await api.get(`/users/${id}`);
  return data.user;
}

/** §C own profile — self-scoped (no users.view needed). Returns the caller's UserDetail. */
export async function fetchOwnProfile(): Promise<UserDetail> {
  const { data } = await api.get('/users/me');
  return data.user;
}

export async function createUser(input: CreateUserInput): Promise<UserDetail> {
  const { data } = await api.post('/users', input);
  return data.user;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserDetail> {
  const { data } = await api.patch(`/users/${id}`, input);
  return data.user;
}

export async function blockUser(id: number): Promise<UserDetail> {
  const { data } = await api.post(`/users/${id}/block`);
  return data.user;
}

export async function unblockUser(id: number): Promise<UserDetail> {
  const { data } = await api.post(`/users/${id}/unblock`);
  return data.user;
}

export interface ResetPasswordResult {
  user: UserDetail;
  /** One-time secret — display to the admin once; never persist it. */
  temporaryPassword: string;
  expiresAt: string;
  message: string;
}

/**
 * ADMIN manual recovery: issue a one-time temporary password for `id`. The admin
 * re-confirms their OWN current password and gives a mandatory reason. The
 * temporary password is returned ONCE and must never be stored/logged client-side.
 */
export async function resetUserPassword(
  id: number,
  input: { currentPassword: string; reason: string },
): Promise<ResetPasswordResult> {
  const { data } = await api.post(`/users/${id}/reset-password`, input);
  return data;
}
