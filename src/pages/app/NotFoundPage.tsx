import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Brand } from '../../components/ui/Brand';

/** Authenticated 404 — an unknown /app route. Branded, calm, one way back. */
export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <Brand variant="mark" height={56} decorative />
      <span className="mt-6 flex size-12 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-2)]">
        <Compass className="size-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-[var(--text-1)]">Sahifa topilmadi</h1>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-2)]">
        Siz izlagan sahifa mavjud emas yoki ko’chirilgan bo’lishi mumkin.
      </p>
      <Link
        to="/app"
        className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
      >
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}
