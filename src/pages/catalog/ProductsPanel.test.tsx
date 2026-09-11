import { test, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/utils';
import { I18nProvider } from '../../i18n/i18n';

let currentUser: { permissions: string[] } = { permissions: ['catalog.view', 'catalog.manage'] };
vi.mock('../../features/auth/auth-context', () => ({ useAuth: () => ({ user: currentUser }) }));
vi.mock('../../api/reference.api', () => ({
  listReference: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
  getReferenceById: vi.fn(),
}));
vi.mock('../../api/catalog.api', () => ({
  listProducts: vi.fn(),
  archiveProduct: vi.fn(),
  reactivateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));
import * as catalogApi from '../../api/catalog.api';
import { ProductsPanel } from './ProductsPanel';

const mockList = catalogApi.listProducts as unknown as ReturnType<typeof vi.fn>;

const product = {
  id: 42,
  code: 'F-100',
  name: 'Yong\'ilg\'i filtri',
  companyId: 1,
  companyName: 'EASY GAS',
  brandId: null,
  brandName: null,
  categoryId: 2,
  categoryName: 'Filtrlar',
  unitId: null,
  unitCode: null,
  unitName: null,
  priceMinor: 150000000,
  currency: 'UZS',
  status: 'ACTIVE' as const,
  version: 1,
  source: 'MANUAL',
  sourceRef: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  mockList.mockReset();
  mockList.mockResolvedValue({ items: [product], total: 1, page: 1, limit: 25 });
});

test('renders a product row with an exactly-formatted price and a profile link', async () => {
  currentUser = { permissions: ['catalog.view', 'catalog.manage'] };
  renderWithProviders(<I18nProvider><ProductsPanel /></I18nProvider>);
  const links = await screen.findAllByRole('link', { name: "Yong'ilg'i filtri" });
  expect(links[0]).toHaveAttribute('href', '/app/catalog/products/42');
  expect(screen.getAllByText("1 500 000 so'm").length).toBeGreaterThan(0);
});

test('the manage (Yangi mahsulot) action is shown for catalog.manage', async () => {
  currentUser = { permissions: ['catalog.view', 'catalog.manage'] };
  renderWithProviders(<I18nProvider><ProductsPanel /></I18nProvider>);
  await screen.findAllByRole('link', { name: "Yong'ilg'i filtri" });
  expect(screen.getByRole('button', { name: /yangi mahsulot/i })).toBeInTheDocument();
});

test('a catalog.view-only role sees NO management actions', async () => {
  currentUser = { permissions: ['catalog.view'] };
  renderWithProviders(<I18nProvider><ProductsPanel /></I18nProvider>);
  await screen.findAllByRole('link', { name: "Yong'ilg'i filtri" });
  expect(screen.queryByRole('button', { name: /yangi mahsulot/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /amallar/i })).not.toBeInTheDocument();
});
