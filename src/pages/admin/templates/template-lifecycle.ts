import type { ChecklistTemplate, VersionStatus } from '../../../types/entities';

/** Uzbek labels for a version/template lifecycle state (§D). */
export const STATUS_LABEL: Record<VersionStatus, string> = {
  DRAFT: 'Qoralama',
  PUBLISHED: 'Faol',
  ARCHIVED: 'Arxivlangan',
};

/**
 * A template's headline state: active if any version is published, else retired
 * if any is archived, else a draft. Used for the list badge + status filter.
 */
export function templateStatus(t: ChecklistTemplate): VersionStatus {
  if (t.versions.some((v) => v.status === 'PUBLISHED')) return 'PUBLISHED';
  if (t.versions.some((v) => v.status === 'ARCHIVED')) return 'ARCHIVED';
  return 'DRAFT';
}
