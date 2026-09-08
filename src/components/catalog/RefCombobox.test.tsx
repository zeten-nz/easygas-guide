import { test, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';

vi.mock('../../api/reference.api', () => ({ listReference: vi.fn(), getReferenceById: vi.fn() }));
import * as refApi from '../../api/reference.api';
import { RefCombobox } from './RefCombobox';

const list = refApi.listReference as unknown as ReturnType<typeof vi.fn>;
const byId = refApi.getReferenceById as unknown as ReturnType<typeof vi.fn>;

const item = (over: Partial<{ id: number; name: string; status: string }> = {}) => ({
  id: 5,
  name: 'Bosch',
  code: null,
  status: 'ACTIVE',
  inUseCount: 0,
  deletable: true,
  createdAt: '',
  updatedAt: '',
  ...over,
});

beforeEach(() => {
  list.mockReset();
  byId.mockReset();
  list.mockResolvedValue({ items: [item()], total: 1, page: 1, limit: 20 });
});

test('opens on click, lists ACTIVE options (bounded), and selecting calls onChange', async () => {
  const onChange = vi.fn();
  renderWithProviders(<RefCombobox kind="brands" ariaLabel="Brend" value={null} onChange={onChange} />);
  await userEvent.click(screen.getByRole('button', { name: 'Brend' }));
  // The list request is bounded (limit 20, ACTIVE only) — never a fetch-all.
  await waitFor(() => expect(list).toHaveBeenCalledWith('brands', expect.objectContaining({ status: 'ACTIVE', limit: 20 })));
  await userEvent.click(await screen.findByRole('option', { name: /Bosch/ }));
  expect(onChange).toHaveBeenCalledWith(5);
});

test('a selected value is loaded BY ID and an ARCHIVED selection shows a readable marker', async () => {
  byId.mockResolvedValue(item({ id: 9, name: 'Eski brend', status: 'ARCHIVED' }));
  renderWithProviders(<RefCombobox kind="brands" ariaLabel="Brend" value={9} onChange={() => {}} />);
  await waitFor(() => expect(byId).toHaveBeenCalledWith('brands', 9));
  expect(await screen.findByText('Eski brend')).toBeInTheDocument();
  expect(screen.getByText('(arxivlangan)')).toBeInTheDocument();
});
