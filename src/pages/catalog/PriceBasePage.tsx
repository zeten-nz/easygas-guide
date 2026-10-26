import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useT } from '../../i18n/i18n';
import { ProductsPanel } from './ProductsPanel';
import { ServicesPanel } from './ServicesPanel';

/**
 * "Narx bazasi" — the price base. Two tabs (Mahsulotlar / Xizmatlar), each a real
 * route so the browser Back/Forward and reload restore the tab plus its URL table
 * state (search, filters, sort, page). Management actions appear only for
 * catalog.manage; catalog.view roles get a read-only view.
 */
export function PriceBasePage() {
  const t = useT();
  const { pathname, search } = useLocation();
  const onServices = pathname.endsWith('/services');

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-1)]">{t('cat.priceBase.title')}</h1>

      <div className="mt-4 flex gap-1 border-b border-[var(--border-1)]">
        <Tab to={`/app/catalog/products${onServices ? '' : search}`} active={!onServices}>
          {t('cat.tab.products')}
        </Tab>
        <Tab to={`/app/catalog/services${onServices ? search : ''}`} active={onServices}>
          {t('cat.tab.services')}
        </Tab>
      </div>

      <div className="mt-5">{onServices ? <ServicesPanel /> : <ProductsPanel />}</div>
    </div>
  );
}

function Tab({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={cn(
        '-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
        active
          ? 'border-blue-600 text-blue-700'
          : 'border-transparent text-[var(--text-2)] hover:border-[var(--border-1)] hover:text-[var(--text-1)]',
      )}
    >
      {children}
    </NavLink>
  );
}
