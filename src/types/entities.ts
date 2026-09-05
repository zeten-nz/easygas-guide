export interface Customer {
  id: number;
  name: string;
  phone: string;
  vehicleCount: number;
  createdAt: string;
}

export interface Vehicle {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  plateNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  engine: string | null;
  mileage: number | null;
  createdAt: string;
}

export const JOB_STATUSES = [
  'DRAFT',
  'IN_PROGRESS',
  'WAITING_STOP_APPROVAL',
  'REJECTED',
  'QUALITY_REVIEW',
  'COMPLETED',
  'REOPENED',
  'CANCELLED',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  DRAFT: 'Yangi',
  IN_PROGRESS: 'Jarayonda',
  WAITING_STOP_APPROVAL: 'STOP tasdiqlashda',
  REJECTED: 'Rad etilgan',
  QUALITY_REVIEW: 'Sifat nazoratida',
  COMPLETED: 'Yakunlangan',
  REOPENED: 'Qayta ochilgan',
  CANCELLED: 'Bekor qilingan',
};

export type GasType = 'LPG' | 'CNG';

export interface JobInstallation {
  gasType: GasType | null;
  kit: string | null;
  ecu: string | null;
  cylinder: string | null;
  note: string | null;
}

export interface Job {
  id: number;
  status: JobStatus;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  plateNumber: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  branchId: number;
  branchName: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  startedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelledByName: string | null;
  closedAt: string | null;
  closedByName: string | null;
  reopenReason: string | null;
  reopenedAt: string | null;
  reopenedByName: string | null;
  assignedTechnicianId: number | null;
  assignedTechnicianName: string | null;
  assignmentStatus: string;
  cycle: number;
  installation: JobInstallation;
}

export interface AuditTimelineEntry {
  action: string;
  actorName: string | null;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
}

// --- Completion (§22–23) ---

export interface CompletionReadiness {
  canComplete: boolean;
  reasons: { code: string; message: string }[];
  conditions: {
    checklist: boolean;
    stops: boolean;
    photos: boolean;
    measurements: boolean;
    risks: boolean;
    signature: boolean;
  };
}

export interface SignatureDetail {
  id: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

// --- Checklist (Phase 5) ---

export type VersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  DRAFT: 'Qoralama',
  PUBLISHED: 'Faol',
  ARCHIVED: 'Arxivlangan',
};

export interface MeasurementDef {
  id: number;
  name: string;
  unit: string;
  minValue: number | null;
  maxValue: number | null;
  expectedValue: number | null;
  required: boolean;
}

export interface TemplateStep {
  id: number;
  sortOrder: number;
  name: string;
  description: string | null;
  requirements: string | null;
  isStop: boolean;
  riskWeight: number;
  requiredPhotos: number;
  measurements: MeasurementDef[];
}

export interface TemplateVersion {
  id: number;
  version: number;
  status: VersionStatus;
  publishedAt: string | null;
  stepCount: number;
  steps?: TemplateStep[];
}

export interface ChecklistTemplate {
  id: number;
  name: string;
  description: string | null;
  versions: TemplateVersion[];
}

export interface JobStepMeasurement extends MeasurementDef {
  submittedValue: number | null;
  isWithinRange: boolean | null;
}

export type JobStepStatus = 'PENDING' | 'COMPLETED' | 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface StepStopApproval {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  attempt: number;
  submittedByName: string;
  submittedAt: string;
  decidedByName: string | null;
  decidedAt: string | null;
  rejectReason: string | null;
}

export interface StepPhoto {
  id: number;
  attempt: number;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string;
  createdAt: string;
}

export interface JobStep {
  id: number;
  templateStepId: number;
  sortOrder: number;
  name: string;
  description: string | null;
  requirements: string | null;
  isStop: boolean;
  riskWeight: number;
  requiredPhotos: number;
  measurements: JobStepMeasurement[];
  status: JobStepStatus;
  note: string | null;
  completedByName: string | null;
  completedAt: string | null;
  isCurrent: boolean;
  stopApproval: StepStopApproval | null;
  currentAttempt: number;
  photos: StepPhoto[];
  photoProgress: { have: number; need: number };
}

export interface JobChecklist {
  id: number;
  templateName: string;
  version: number;
  assignedAt: string;
  completedAt: string | null;
  progress: { completed: number; total: number };
  currentStepId: number | null;
  steps: JobStep[];
}
