import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';
import * as templatesApi from '../../../api/templates.api';
import { getApiError } from '../../../api/client';
import { useT } from '../../../i18n/i18n';
import { localizeApiError } from '../../../i18n/api-errors';
import type { ChecklistTemplate } from '../../../types/entities';

/**
 * §D permanent-delete confirmation. Names the template, explains that this is a
 * PERMANENT deletion (only possible for an unused draft — otherwise the version
 * is archived instead), and never pretends success: on a server conflict it shows
 * the reason and refetches the list so the eligibility is up to date.
 */
export function DeleteTemplateDialog({
  template,
  onClose,
  onDeleted,
}: {
  template: ChecklistTemplate;
  onClose: () => void;
  /** Fired after a successful delete (e.g. to navigate away from a now-gone detail page). */
  onDeleted?: () => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => templatesApi.deleteTemplate(template.id),
    onSuccess: () => {
      toast.success(t('tpl.toast.templateDeleted', { name: template.name }));
      // Drop the now-gone template's detail query (so it never refetches → 404) and
      // refresh the LIST only. Navigate away first when on the detail page.
      queryClient.removeQueries({ queryKey: ['templates', 'detail', template.id] });
      queryClient.invalidateQueries({ queryKey: ['templates', 'list'] });
      if (onDeleted) onDeleted();
      else onClose();
    },
    onError: (err) => {
      // Do NOT pretend success. Surface the conflict and refetch eligibility.
      setServerError(localizeApiError(getApiError(err).code, t));
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  return (
    <Modal open onClose={mutation.isPending ? () => {} : onClose} title={t('tpl.deleteTemplate')} className="sm:max-w-md">
      <div className="space-y-4">
        {serverError && <Alert tone="error">{serverError}</Alert>}

        <div className="flex items-start gap-2.5 rounded-2xl border border-brand-500/25 bg-brand-50 p-3.5">
          <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-brand-600" />
          <p className="text-[13px] leading-relaxed text-[var(--text-2)]">
            <b className="text-[var(--text-1)]">"{template.name}"</b> {t('tpl.deleteTemplate.warning')}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[var(--text-2)]">
          {t('tpl.deleteTemplate.explainA')}
          <b className="text-[var(--text-1)]">{t('tpl.deleteTemplate.explainBold')}</b>
          {t('tpl.deleteTemplate.explainB')}
        </p>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={() => mutation.mutate()} loading={mutation.isPending}>
            {t('tpl.action.delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
