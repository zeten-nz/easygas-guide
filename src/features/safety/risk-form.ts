/**
 * Phase 10D risk-form validation (client-side UX only). The SERVER computes
 * score/level/blocking — this just guards required inputs before submit so the
 * technician sees inline errors; it NEVER derives a level or blocking status.
 */

export interface RiskFormInput {
  hazard: string;
  description: string;
  severity: number;
  likelihood: number;
}

export interface RiskFormErrors {
  hazard?: string;
  description?: string;
  severity?: string;
  likelihood?: string;
}

export function validateRiskInput(input: Partial<RiskFormInput>): { ok: boolean; errors: RiskFormErrors } {
  const errors: RiskFormErrors = {};
  if (!input.hazard || input.hazard.trim().length < 2) errors.hazard = "Xavf turini kiriting (kamida 2 belgi)";
  if (!input.description || input.description.trim().length < 3) errors.description = "Tavsif kiriting (kamida 3 belgi)";
  const inRange = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 4;
  if (!inRange(input.severity)) errors.severity = "Jiddiylik 1–4 oralig'ida bo'lishi kerak";
  if (!inRange(input.likelihood)) errors.likelihood = "Ehtimollik 1–4 oralig'ida bo'lishi kerak";
  return { ok: Object.keys(errors).length === 0, errors };
}
