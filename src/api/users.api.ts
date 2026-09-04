import { api } from './client';
import type { RoleCode, UserDetail, UserStatus } from '../types/auth';

export interface ListUsersParams {
  search?: string;
  role?: RoleCode;
  branchId?: number;
  status?: UserStatus;
  page?: number;
  limit?: number;
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
