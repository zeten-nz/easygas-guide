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
export interface AssignmentHistoryItem {
  id: number;
  technicianId: number | null;
  assignedBy: number;
  provenance: string;
  reason: string | null;
  createdAt: string;
}
export async function assignmentHistory(jobId: number): Promise<{ history: AssignmentHistoryItem[] }> {
  const { data } = await api.get(`/jobs/${jobId}/assignment`);
  return data;
}
export interface AssignmentCandidate { id: number; name: string; role: string }
export async function assignmentCandidates(jobId: number): Promise<{ candidates: AssignmentCandidate[] }> {
  const { data } = await api.get(`/jobs/${jobId}/assignment/candidates`);
  return data;
}

// ---- Signable summary + snapshot ----
/** The server-built material summary the customer reviews and signs (§23). */
export interface SignableSummaryContent {
  schemaVersion: string;
  jobId: number;
  cycle: number;
  branchId: number;
  assignedTechnicianId: number | null;
  checklistTemplateId: number | null;
  checklistVersion: number | null;
  installation: { gasType: string | null; kit: string | null; ecu: string | null; cylinder: string | null; note: string | null };
  customer: { id: number; name: string; phoneMasked: string } | null;
  vehicle: { id: number; plate: string; vin: string | null; make: string | null; model: string | null; year: number | null } | null;
  steps: { id: number; stepId: number; name: string; status: string; isStop: boolean }[];
  stops: { jobStepId: number; attempt: number; status: string }[];
  openBlockingRiskIds: number[];
}
export interface SignableSummary {
  schemaVersion: string;
  cycle: number;
  digest: string;
  summary: SignableSummaryContent;
}
export async function getSignableSummary(jobId: number): Promise<SignableSummary> {
  const { data } = await api.get(`/jobs/${jobId}/signable-summary`);
  return data;
}

export interface CompletionSnapshot {
  cycle: number;
  digest: string;
  schemaVersion: string;
  provenance: string;
  content: {
    schemaVersion: string;
    provenance: string;
    summary: SignableSummaryContent;
    summaryDigest: string;
    assignment: { technicianId: number | null; status: string | null };
    signature: { id: number; sha256: string; sizeBytes: number; summaryDigest: string | null } | null;
    risks: { id: number; level: string; blocking: boolean; status: string; source: string; matrixVersion: string }[];
    [k: string]: unknown;
  };
}
export async function getCompletionSnapshot(jobId: number, cycle?: number): Promise<CompletionSnapshot | null> {
  try {
    const { data } = await api.get(`/jobs/${jobId}/completion-snapshot`, { params: cycle ? { cycle } : {} });
    return data;
  } catch {
    return null;
  }
}

// ---- Risk policy (matrix governance) ----
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskSource = 'MANUAL' | 'STOP_REJECTED' | 'MEASUREMENT_OUT_OF_RANGE' | 'CHECKLIST_FLAG';

export interface MatrixDefinition {
  algorithm: string;
  allowedSeverity: number[];
  allowedLikelihood: number[];
  thresholds: { min: number; level: RiskLevel }[];
  blockingLevels: RiskLevel[];
  sourceOverrides?: Partial<Record<RiskSource, RiskLevel>>;
  severity4MinLevel?: RiskLevel;
}

export interface MatrixVersion {
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'RETIRED';
  approvedBy: number | null;
  approvedByName: string | null;
  approvedAt: string | null;
  rationale: string | null;
  createdAt: string;
  supersededBy: number | null;
  definition: MatrixDefinition;
}

export interface MatrixCell {
  severity: number;
  likelihood: number;
  score: number;
  level: RiskLevel;
  blocking: boolean;
}

export interface MatrixVersionDetail extends MatrixVersion {
  isActive: boolean;
  cells: MatrixCell[];
  blockedOperations: string[];
}

export interface PreviewResult {
  version: string;
  status: string;
  severity: number;
  likelihood: number;
  source: RiskSource;
  score: number;
  level: RiskLevel;
  blocking: boolean;
  example: true;
}

export async function getRiskPolicyState(): Promise<{ active: boolean; version: string | null }> {
  const { data } = await api.get('/risk-policy');
  return data;
}
export async function listMatrixVersions(): Promise<{ versions: MatrixVersion[] }> {
  const { data } = await api.get('/risk-policy/versions');
  return data;
}
export async function getMatrixVersionDetail(version: string): Promise<MatrixVersionDetail> {
  const { data } = await api.get(`/risk-policy/versions/${encodeURIComponent(version)}`);
  return data.version;
}
export async function previewClassification(version: string, input: { severity: number; likelihood: number; source?: RiskSource }): Promise<PreviewResult> {
  const { data } = await api.get(`/risk-policy/versions/${encodeURIComponent(version)}/preview`, { params: input });
  return data.preview;
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
export interface GpsEvent {
  id: number;
  cycle: number;
  purpose: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  client_timestamp: string | null;
  server_received_at: string | null;
  provenance: string;
  actor_id: number;
}
export async function listGps(jobId: number): Promise<{ items: GpsEvent[]; total: number }> {
  const { data } = await api.get(`/jobs/${jobId}/gps`);
  return data;
}
