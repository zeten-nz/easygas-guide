import { api } from './client';
import type {
  AuditTimelineEntry,
  CompletionReadiness,
  GasType,
  Job,
  JobChecklist,
  JobStatus,
  SignatureDetail,
} from '../types/entities';

export interface ListJobsParams {
  search?: string;
  status?: JobStatus;
  branchId?: number;
  page?: number;
  limit?: number;
}

export interface ListJobsResult {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchJobs(params: ListJobsParams): Promise<ListJobsResult> {
  const { data } = await api.get('/jobs', { params });
  return data;
}

export async function fetchJob(id: number): Promise<Job> {
  const { data } = await api.get(`/jobs/${id}`);
  return data.job;
}

export async function createJob(customerId: number, vehicleId: number): Promise<Job> {
  const { data } = await api.post('/jobs', { customerId, vehicleId });
  return data.job;
}

export async function startJob(id: number): Promise<Job> {
  const { data } = await api.post(`/jobs/${id}/start`);
  return data.job;
}

export async function cancelJob(id: number, reason: string): Promise<Job> {
  const { data } = await api.post(`/jobs/${id}/cancel`, { reason });
  return data.job;
}

export interface InstallationInput {
  gasType?: GasType | null;
  kit?: string | null;
  ecu?: string | null;
  cylinder?: string | null;
  note?: string | null;
}

export async function updateInstallation(id: number, input: InstallationInput): Promise<Job> {
  const { data } = await api.patch(`/jobs/${id}/installation`, input);
  return data.job;
}

// --- Job checklist ---

export async function fetchJobChecklist(jobId: number): Promise<JobChecklist | null> {
  const { data } = await api.get(`/jobs/${jobId}/checklist`);
  return data.checklist;
}

export async function assignChecklist(jobId: number, templateId: number): Promise<JobChecklist> {
  const { data } = await api.post(`/jobs/${jobId}/checklist`, { templateId });
  return data.checklist;
}

export interface CompleteStepInput {
  note?: string | null;
  measurements: { measurementId: number; value: number }[];
}

export async function completeStep(jobId: number, stepId: number, input: CompleteStepInput): Promise<JobChecklist> {
  const { data } = await api.post(`/jobs/${jobId}/checklist/steps/${stepId}/complete`, input);
  return data.checklist;
}

// --- STOP approval (§17–18) ---

export async function approveStop(jobId: number): Promise<JobChecklist> {
  const { data } = await api.post(`/jobs/${jobId}/stop/approve`);
  return data.checklist;
}

export async function rejectStop(jobId: number, reason: string): Promise<JobChecklist> {
  const { data } = await api.post(`/jobs/${jobId}/stop/reject`, { reason });
  return data.checklist;
}

/** §3 correction: rejected STOP → rework (job back to IN_PROGRESS, step re-opens). */
export async function reworkStop(jobId: number): Promise<JobChecklist> {
  const { data } = await api.post(`/jobs/${jobId}/stop/rework`);
  return data.checklist;
}

// --- Photo evidence (§19) ---

export async function uploadStepPhoto(jobId: number, stepId: number, file: File): Promise<void> {
  const form = new FormData();
  form.append('photo', file);
  await api.post(`/jobs/${jobId}/checklist/steps/${stepId}/photos`, form);
}

export function stepPhotoUrl(jobId: number, stepId: number, photoId: number): string {
  return `${api.defaults.baseURL}/jobs/${jobId}/checklist/steps/${stepId}/photos/${photoId}/file`;
}

// --- Completion flow (§22–23) ---

export interface CompletionInfo {
  readiness: CompletionReadiness;
  signature: SignatureDetail | null;
  jobStatus: JobStatus;
}

export async function fetchCompletion(jobId: number): Promise<CompletionInfo> {
  const { data } = await api.get(`/jobs/${jobId}/completion`);
  return data;
}

/**
 * Phase 10D §23: the customer signs the server-built summary. The digest the UI
 * displayed is submitted so the server can reject a signature over a stale
 * summary (SIGNATURE_STALE / SUMMARY_STALE). The server recomputes the
 * authoritative digest; this value is never trusted, only compared.
 */
export async function uploadSignature(jobId: number, blob: Blob, summaryDigest?: string): Promise<SignatureDetail> {
  const form = new FormData();
  form.append('signature', blob, 'signature.png');
  if (summaryDigest) form.append('summaryDigest', summaryDigest);
  const { data } = await api.post(`/jobs/${jobId}/signature`, form);
  return data.signature;
}

export function signatureUrl(jobId: number): string {
  return `${api.defaults.baseURL}/jobs/${jobId}/signature/file`;
}

export async function completeJob(jobId: number): Promise<Job> {
  const { data } = await api.post(`/jobs/${jobId}/complete`);
  return data.job;
}

// --- Quality Control + reopen (§24–26) ---

export async function reopenJob(jobId: number, reason: string): Promise<Job> {
  const { data } = await api.post(`/jobs/${jobId}/reopen`, { reason });
  return data.job;
}

export async function confirmQuality(jobId: number): Promise<Job> {
  const { data } = await api.post(`/jobs/${jobId}/quality/confirm`);
  return data.job;
}

export async function fetchQualityTimeline(jobId: number): Promise<AuditTimelineEntry[]> {
  const { data } = await api.get(`/jobs/${jobId}/quality`);
  return data.timeline;
}

export async function redoStep(jobId: number, stepId: number): Promise<JobChecklist> {
  const { data } = await api.post(`/jobs/${jobId}/checklist/steps/${stepId}/redo`);
  return data.checklist;
}
