import { test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { renderWithProviders } from '../../../test/utils';
import { I18nProvider } from '../../../i18n/i18n';

vi.mock('../../../api/templates.api', () => ({ deleteTemplate: vi.fn() }));
import { deleteTemplate } from '../../../api/templates.api';
import { DeleteTemplateDialog } from './DeleteTemplateDialog';
import type { ChecklistTemplate } from '../../../types/entities';

const mockDelete = deleteTemplate as unknown as ReturnType<typeof vi.fn>;
beforeEach(() => mockDelete.mockReset());

const template: ChecklistTemplate = {
  id: 9,
  name: 'LPG tekshiruvi',
  description: null,
  versions: [{ id: 1, version: 1, status: 'DRAFT', publishedAt: null, stepCount: 2 }],
  deletable: true,
  deletableReason: null,
};

function conflict(): AxiosError {
  return new AxiosError('conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
    status: 409,
    data: { error: { code: 'TEMPLATE_HAS_HISTORY', message: 'Nashr qilingan shablonni o\'chirib bo\'lmaydi' } },
  } as never);
}

test('names the template and explains permanent-delete vs archive', () => {
  mockDelete.mockResolvedValue({ id: 9, name: 'LPG tekshiruvi' });
  renderWithProviders(
    <I18nProvider>
      <DeleteTemplateDialog template={template} onClose={() => {}} />
    </I18nProvider>,
  );
  expect(screen.getByText(/"LPG tekshiruvi"/)).toBeInTheDocument();
  expect(screen.getByText(/arxivlang/i)).toBeInTheDocument();
});

test('a server conflict shows the reason and does NOT pretend success', async () => {
  mockDelete.mockRejectedValueOnce(conflict());
  const onClose = vi.fn();
  const onDeleted = vi.fn();
  renderWithProviders(
    <I18nProvider>
      <DeleteTemplateDialog template={template} onClose={onClose} onDeleted={onDeleted} />
    </I18nProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: "O'chirish" }));
  expect(await screen.findByText(/Nashr qilingan shablonni/)).toBeInTheDocument();
  expect(onDeleted).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

test('a successful delete fires onDeleted', async () => {
  mockDelete.mockResolvedValueOnce({ id: 9, name: 'LPG tekshiruvi' });
  const onDeleted = vi.fn();
  renderWithProviders(
    <I18nProvider>
      <DeleteTemplateDialog template={template} onClose={() => {}} onDeleted={onDeleted} />
    </I18nProvider>,
  );
  await userEvent.click(screen.getByRole('button', { name: "O'chirish" }));
  await waitFor(() => expect(onDeleted).toHaveBeenCalled());
});
