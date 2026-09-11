/**
 * Phase 10D risk-form validation (client-side UX only). The SERVER computes
 * score/level/blocking — this just guards required inputs before submit so the
 * technician sees inline errors; it NEVER derives a level or blocking status.
 *
 * Errors are returned as i18n message KEYS (not pre-translated strings) so the
 * UI can render them via `fieldError()` / `t()` in the active locale.
 */
import type { MessageKey } from '../../i18n/types';

export interface RiskFormInput {
  hazard: string;
  description: string;
  severity: number;
  likelihood: number;
}

export interface RiskFormErrors {
  hazard?: MessageKey;
  description?: MessageKey;
  severity?: MessageKey;
  likelihood?: MessageKey;
}

export function validateRiskInput(input: Partial<RiskFormInput>): { ok: boolean; errors: RiskFormErrors } {
  const errors: RiskFormErrors = {};
  if (!input.hazard || input.hazard.trim().length < 2) errors.hazard = 'jb.riskform.hazardMin';
  if (!input.description || input.description.trim().length < 3) errors.description = 'jb.riskform.descriptionMin';
  const inRange = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 4;
  if (!inRange(input.severity)) errors.severity = 'jb.riskform.severityRange';
  if (!inRange(input.likelihood)) errors.likelihood = 'jb.riskform.likelihoodRange';
  return { ok: Object.keys(errors).length === 0, errors };
}
