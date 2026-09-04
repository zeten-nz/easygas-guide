import { api } from './client';
import type { ChecklistTemplate } from '../types/entities';

export interface StepInput {
  name: string;
  description?: string | null;
  requirements?: string | null;
  isStop?: boolean;
  riskWeight?: number;
  requiredPhotos?: number;
  measurements: {
    name: string;
    unit: string;
    minValue?: number | null;
    maxValue?: number | null;
    expectedValue?: number | null;
    required?: boolean;
  }[];
}

export async function fetchTemplates(): Promise<ChecklistTemplate[]> {
  const { data } = await api.get('/checklist-templates');
  return data.templates;
}

export async function fetchTemplate(id: number): Promise<ChecklistTemplate> {
  const { data } = await api.get(`/checklist-templates/${id}`);
  return data.template;
}

export async function fetchAssignableTemplates(): Promise<{ id: number; name: string; version: number }[]> {
  const { data } = await api.get('/checklist-templates/assignable');
  return data.templates;
}

export async function createTemplate(input: { name: string; description?: string | null }): Promise<ChecklistTemplate> {
  const { data } = await api.post('/checklist-templates', input);
  return data.template;
}

export async function createVersion(templateId: number): Promise<ChecklistTemplate> {
  const { data } = await api.post(`/checklist-templates/${templateId}/versions`);
  return data.template;
}

export async function addStep(templateId: number, versionId: number, input: StepInput): Promise<ChecklistTemplate> {
  const { data } = await api.post(`/checklist-templates/${templateId}/versions/${versionId}/steps`, input);
  return data.template;
}

export async function updateStep(
  templateId: number,
  versionId: number,
  stepId: number,
  input: StepInput,
): Promise<ChecklistTemplate> {
  const { data } = await api.patch(`/checklist-templates/${templateId}/versions/${versionId}/steps/${stepId}`, input);
  return data.template;
}

export async function deleteStep(templateId: number, versionId: number, stepId: number): Promise<ChecklistTemplate> {
  const { data } = await api.delete(`/checklist-templates/${templateId}/versions/${versionId}/steps/${stepId}`);
  return data.template;
}

export async function moveStep(
  templateId: number,
  versionId: number,
  stepId: number,
  direction: 'up' | 'down',
): Promise<ChecklistTemplate> {
  const { data } = await api.post(`/checklist-templates/${templateId}/versions/${versionId}/steps/${stepId}/move`, {
    direction,
  });
  return data.template;
}

export async function publishVersion(templateId: number, versionId: number): Promise<ChecklistTemplate> {
  const { data } = await api.post(`/checklist-templates/${templateId}/versions/${versionId}/publish`);
  return data.template;
}

export async function archiveVersion(templateId: number, versionId: number): Promise<ChecklistTemplate> {
  const { data } = await api.post(`/checklist-templates/${templateId}/versions/${versionId}/archive`);
  return data.template;
}
