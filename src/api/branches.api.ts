import { api } from './client';
import type { Branch, BranchFull } from '../types/auth';

/** Minimal list for the sign-up form (public endpoint behavior). */
export async function fetchBranches(): Promise<Branch[]> {
  const { data } = await api.get('/branches');
  return data.branches;
}

/** Full management list — same endpoint; the server returns full data to authorized users. */
export async function fetchBranchesFull(): Promise<BranchFull[]> {
  const { data } = await api.get('/branches');
  return data.branches;
}

export interface BranchInput {
  name: string;
  region: string;
  address?: string | null;
  phone?: string | null;
}

export async function createBranch(input: BranchInput): Promise<BranchFull> {
  const { data } = await api.post('/branches', input);
  return data.branch;
}

export async function updateBranch(id: number, input: Partial<BranchInput>): Promise<BranchFull> {
  const { data } = await api.patch(`/branches/${id}`, input);
  return data.branch;
}

export async function activateBranch(id: number): Promise<BranchFull> {
  const { data } = await api.post(`/branches/${id}/activate`);
  return data.branch;
}

export async function deactivateBranch(id: number): Promise<BranchFull> {
  const { data } = await api.post(`/branches/${id}/deactivate`);
  return data.branch;
}
