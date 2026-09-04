import { api } from './client';
import type { RegistrationRequest, RegistrationStatus, RoleCode } from '../types/auth';

export async function fetchRegistrationRequests(status?: RegistrationStatus): Promise<RegistrationRequest[]> {
  const { data } = await api.get('/admin/registration-requests', { params: status ? { status } : {} });
  return data.requests;
}

export async function approveRegistrationRequest(id: number, roleCode: RoleCode): Promise<{ userId: number }> {
  const { data } = await api.post(`/admin/registration-requests/${id}/approve`, { roleCode });
  return data;
}

export async function rejectRegistrationRequest(id: number, reason: string): Promise<void> {
  await api.post(`/admin/registration-requests/${id}/reject`, { reason });
}
