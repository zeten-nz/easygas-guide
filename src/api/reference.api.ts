import { api } from './client';
import type { ForcedInduction, InjectionReference, InjectionTechnology, Paginated, ReferenceItem, ReferenceKind } from '../types/catalog';

// --------------------------- Simple reference data ---------------------------

export interface ListReferenceParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export async function listReference(kind: ReferenceKind, params: ListReferenceParams): Promise<Paginated<ReferenceItem>> {
  const { data } = await api.get(`/reference/${kind}`, { params });
  return data;
}
export async function createReference(kind: ReferenceKind, input: { name: string; code?: string }): Promise<ReferenceItem> {
  const { data } = await api.post(`/reference/${kind}`, input);
  return data.item;
}
export async function updateReference(kind: ReferenceKind, id: number, input: { name?: string; code?: string }): Promise<ReferenceItem> {
  const { data } = await api.patch(`/reference/${kind}/${id}`, input);
  return data.item;
}
export async function archiveReference(kind: ReferenceKind, id: number): Promise<ReferenceItem> {
  const { data } = await api.post(`/reference/${kind}/${id}/archive`);
  return data.item;
}
export async function reactivateReference(kind: ReferenceKind, id: number): Promise<ReferenceItem> {
  const { data } = await api.post(`/reference/${kind}/${id}/reactivate`);
  return data.item;
}
export async function deleteReference(kind: ReferenceKind, id: number): Promise<void> {
  await api.delete(`/reference/${kind}/${id}`);
}

// ----------------------------- Injection reference -----------------------------

export interface ListInjectionParams extends ListReferenceParams {
  technology?: InjectionTechnology;
}
export interface InjectionInput {
  designation: string;
  technology?: InjectionTechnology;
  forcedInduction?: ForcedInduction;
  description?: string | null;
}

export async function listInjection(params: ListInjectionParams): Promise<Paginated<InjectionReference>> {
  const { data } = await api.get('/injection-reference', { params });
  return data;
}
export async function createInjection(input: InjectionInput): Promise<InjectionReference> {
  const { data } = await api.post('/injection-reference', input);
  return data.item;
}
export async function updateInjection(id: number, input: InjectionInput): Promise<InjectionReference> {
  const { data } = await api.patch(`/injection-reference/${id}`, input);
  return data.item;
}
export async function archiveInjection(id: number): Promise<InjectionReference> {
  const { data } = await api.post(`/injection-reference/${id}/archive`);
  return data.item;
}
export async function reactivateInjection(id: number): Promise<InjectionReference> {
  const { data } = await api.post(`/injection-reference/${id}/reactivate`);
  return data.item;
}
export async function deleteInjection(id: number): Promise<void> {
  await api.delete(`/injection-reference/${id}`);
}
