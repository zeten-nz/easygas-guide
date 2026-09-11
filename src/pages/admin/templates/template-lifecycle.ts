import type { ChecklistTemplate, VersionStatus } from '../../../types/entities';
import type { TFunc } from '../../../i18n/i18n';
import type { MessageKey } from '../../../i18n/types';

/** Message key for each version/template lifecycle state (§D). Codes are stable. */
const STATUS_KEY: Record<VersionStatus, MessageKey> = {
  DRAFT: 'tpl.status.draft',
  PUBLISHED: 'tpl.status.published',
  ARCHIVED: 'tpl.status.archived',
};

/** Localized label for a version/template lifecycle state (§D). */
export function statusLabel(status: VersionStatus, t: TFunc): string {
  return t(STATUS_KEY[status]);
}

/**
 * A template's headline state: active if any version is published, else retired
 * if any is archived, else a draft. Used for the list badge + status filter.
 */
export function templateStatus(t: ChecklistTemplate): VersionStatus {
  if (t.versions.some((v) => v.status === 'PUBLISHED')) return 'PUBLISHED';
  if (t.versions.some((v) => v.status === 'ARCHIVED')) return 'ARCHIVED';
  return 'DRAFT';
}
