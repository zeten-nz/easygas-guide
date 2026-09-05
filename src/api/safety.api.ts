import { api } from './client';

/**
 * Phase 10D safety-domain API. The client NEVER computes risk scores, blocking
 * status, completion readiness, or digests — every value here is the server's
 * authoritative response. The UI only renders it.
 */

// ---- Risk ----
export interface RiskListItem {
  id: number;
  cycle: number;
  hazard: string;
  description: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  blocking: boolean;
  status: string;
  matrixVersion: string;
  source: string;
  jobStepId: number | null;
  createdAt: string;
}

export async function listRisks(jobId: number, params: { cycle?: number; page?: number } = {}): Promise<{ items: RiskListItem[]; total: number; page: number; pageSize: number }> {
  const { data } = await api.get(`/jobs/${jobId}/risks`, { params });
  return data;
}
export async function createRisk(jobId: number, input: { hazard: string; description: string; severity: number; likelihood: number; jobStepId?: number }): Promise<{ id: number }> {
  const { data } = await api.post(`/jobs/${jobId}/risks`, input);
  return data.risk;
}
export async function resolveRisk(jobId: number, riskId: number, input: { note: string; mitigation?: string }): Promise<void> {
  await api.post(`/jobs/${jobId}/risks/${riskId}/resolve`, input);
}
export async function overrideRisk(jobId: number, riskId: number, reason: string): Promise<void> {
  await api.post(`/jobs/${jobId}/risks/${riskId}/override`, { reason });
}

// ---- Assignment ----
export async function myJobs(params: { page?: number } = {}): Promise<{ items: unknown[]; total: number }> {
  const { data } = await api.get('/jobs/mine', { params });
  return data;
}
export async function assignJob(jobId: number, technicianId: number, reason?: string): Promise<void> {
  await api.post(`/jobs/${jobId}/assign`, { technicianId, reason });
}
export async function assignmentHistory(jobId: number): Promise<{ history: unknown[] }> {
  const { data } = await api.get(`/jobs/${jobId}/assignment`);
  return data;
}

// ---- Signable summary + snapshot ----
export interface SignableSummary {
  schemaVersion: string;
  cycle: number;
  digest: string;
  summary: Record<string, unknown>;
}
export async function getSignableSummary(jobId: number): Promise<SignableSummary> {
  const { data } = await api.get(`/jobs/${jobId}/signable-summary`);
  return data;
}
export async function getCompletionSnapshot(jobId: number, cycle?: number): Promise<{ cycle: number; digest: string; content: unknown; schemaVersion: string; provenance: string } | null> {
  try {
    const { data } = await api.get(`/jobs/${jobId}/completion-snapshot`, { params: cycle ? { cycle } : {} });
    return data;
  } catch {
    return null;
  }
}

// ---- Risk policy (matrix governance) ----
export interface MatrixVersion {
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  approvedBy: number | null;
  approvedAt: string | null;
  rationale: string | null;
  createdAt: string;
  definition: { thresholds: { min: number; level: string }[]; blockingLevels: string[]; [k: string]: unknown };
}
export async function getRiskPolicyState(): Promise<{ active: boolean; version: string | null }> {
  const { data } = await api.get('/risk-policy');
  return data;
}
export async function listMatrixVersions(): Promise<{ versions: MatrixVersion[] }> {
  const { data } = await api.get('/risk-policy/versions');
  return data;
}
export async function activateMatrix(version: string, rationale: string): Promise<void> {
  await api.post(`/risk-policy/${encodeURIComponent(version)}/activate`, { rationale });
}
export async function retireMatrix(version: string): Promise<void> {
  await api.post(`/risk-policy/${encodeURIComponent(version)}/retire`);
}

// ---- GPS ----
export interface GpsCapturePayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  clientTimestamp: string;
  purpose?: 'JOB_START' | 'CHECKLIST_COMPLETE' | 'CUSTOMER_SIGNATURE' | 'JOB_COMPLETE' | 'RISK_STOP_EVENT';
}
export async function captureGps(jobId: number, payload: GpsCapturePayload): Promise<{ id: number }> {
  const { data } = await api.post(`/jobs/${jobId}/gps`, payload);
  return data.gps;
}
export async function overrideGps(jobId: number, reason: string, purpose?: GpsCapturePayload['purpose']): Promise<{ id: number }> {
  const { data } = await api.post(`/jobs/${jobId}/gps/override`, { reason, purpose });
  return data.gps;
}
