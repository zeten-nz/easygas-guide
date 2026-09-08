import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { ROLE_LABELS } from '../../types/auth';
import { NAV_GROUPS } from './nav-config';

/** One honest line per destination — describes the task, never invented metrics. */
const DESCRIPTIONS: Record<string, string> = {
  '/app/my-jobs': "Sizga biriktirilgan ishlar va checklistlar.",
  '/app/jobs': "Filial ishlarini ko'ring yoki yangi ish oching.",
  '/app/admin/users': "Xodimlarni boshqaring — profil, tahrirlash, parol tiklash.",
  '/app/admin/registration-requests': "Ro'yxatdan o'tish so'rovlarini ko'rib chiqing.",
  '/app/customers': "Mijozlar ma'lumotlari.",
  '/app/vehicles': "Avtomobillar reyestri.",
  '/app/admin/branches': "Filiallarni boshqaring.",
  '/app/admin/templates': "Checklist shablonlari va versiyalari.",
  '/app/admin/risk-policy': "Xavf matritsasi versiyalari.",
};

export function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  const cards = NAV_GROUPS.flatMap((g) => g.items).filter(
    (it) => it.permission !== null && can(user, it.permission),
  );

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-1)]">Xush kelibsiz, {user.firstName}</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">{ROLE_LABELS[user.role]}</p>
      </div>

      {cards.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-start gap-3.5 rounded-2xl border border-[var(--border-1)] bg-[var(--surface)] p-4 transition-colors hover:border-blue-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 transition-colors group-hover:bg-blue-100">
                <item.icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-[var(--text-1)]">{item.label}</span>
                <span className="mt-0.5 block text-sm text-[var(--text-2)]">{DESCRIPTIONS[item.to]}</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-[var(--text-2)]">
          Ishni boshlash uchun yuqoridagi menyudan bo'lim tanlang.
        </p>
      )}
    </div>
  );
}
