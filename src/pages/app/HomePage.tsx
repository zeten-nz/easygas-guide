import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../features/auth/auth-context';
import { can } from '../../lib/permissions';
import { ROLE_LABELS, type Permission, type RoleCode } from '../../types/auth';
import { displayPhone } from '../../lib/phone';

const QUICK_LINKS: { to: string; label: string; permission: Permission }[] = [
  { to: '/app/my-jobs', label: 'Mening ishlarim', permission: 'checklist.execute' },
  { to: '/app/jobs', label: 'Ishlar', permission: 'jobs.view' },
  { to: '/app/customers', label: 'Mijozlar', permission: 'customers.view' },
  { to: '/app/vehicles', label: 'Avtomobillar', permission: 'vehicles.view' },
  { to: '/app/admin/templates', label: 'Shablonlar', permission: 'templates.manage' },
  { to: '/app/admin/risk-policy', label: 'Xavf siyosati', permission: 'risk.matrix.approve' },
  { to: '/app/admin/users', label: 'Foydalanuvchilar', permission: 'users.view' },
  { to: '/app/admin/branches', label: 'Filiallar', permission: 'branches.manage' },
  { to: '/app/admin/registration-requests', label: "Ro'yxatdan o'tish so'rovlari", permission: 'registration.review' },
];

// Honest, current capability summaries (no invented analytics; each maps to a
// screen the role can actually reach).
const ROLE_DESCRIPTIONS: Record<RoleCode, string> = {
  USTA: "Ish ochish, mijoz va avtomobillarni ro'yxatga olish, texnik checklistni bajarish, GPS va foto dalillar hamda mijoz imzosini olish.",
  MASTER: "Ishlarni ochish va boshqarish, texnik biriktirish, STOP nuqtalarini tasdiqlash, xavflarni baholash va ishlarni yakunlash.",
  RAHBAR: "O'z filialingiz xodimlari va ishlarini boshqarish, mijoz va avtomobillar ma'lumotlarini yuritish.",
  SIFAT: "Yakunlangan ishlarni sifat nazoratidan o'tkazish, qayta ochish, xavf matritsasi siyosatini tasdiqlash.",
  ADMIN: "Foydalanuvchilar, filiallar va ro'yxatdan o'tish so'rovlarini boshqarish; xavf siyosatini tasdiqlash.",
};

export function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-[var(--border-1)] bg-[var(--surface)] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-1)]">
              Xush kelibsiz, {user.firstName}!
            </h1>
            <p className="mt-0.5 text-sm text-[var(--text-2)]">
              {ROLE_LABELS[user.role]} · {displayPhone(user.phone)}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-[var(--surface-2)] p-4">
          <p className="text-sm leading-relaxed text-[var(--text-2)]">{ROLE_DESCRIPTIONS[user.role]}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_LINKS.filter((l) => can(user, l.permission)).map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              {l.label}
              <ArrowRight className="size-4" />
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-2)]">
        Safe installation. Verified work. Trusted service.
      </p>
    </div>
  );
}
