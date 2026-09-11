import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { DropdownMenu, MenuItem } from '../../components/ui/DropdownMenu';
import { useAuth } from '../../features/auth/auth-context';
import { displayPhone } from '../../lib/phone';
import { useT } from '../../i18n/i18n';
import { roleLabel } from '../../i18n/labels';

/**
 * Top-right account menu: the current user's identity, a link to their own
 * profile ("Mening profilim"), and logout. Replaces the always-visible logout
 * button so the top bar stays compact.
 */
export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [loggingOut, setLoggingOut] = useState(false);
  if (!user) return null;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <DropdownMenu
      align="end"
      panelClassName="min-w-64"
      button={
        <button
          type="button"
          aria-label={t('account.menuAria')}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-left transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <UserRound className="size-5" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-semibold text-[var(--text-1)]">
              {user.firstName} {user.lastName}
            </span>
            <span className="block text-xs text-[var(--text-2)]">{roleLabel(user.role, t)}</span>
          </span>
          <ChevronDown className="hidden size-4 text-[var(--text-3)] sm:block" />
        </button>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-[var(--border-1)] px-3 pb-2.5 pt-1.5">
            <p className="text-sm font-semibold text-[var(--text-1)]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-[var(--text-2)]">
              {roleLabel(user.role, t)} · {displayPhone(user.phone)}
            </p>
          </div>
          <div className="pt-1.5">
            <MenuItem
              icon={<UserRound className="size-[18px]" />}
              onClick={() => {
                close();
                navigate('/app/profile');
              }}
            >
              {t('account.profile')}
            </MenuItem>
            <MenuItem
              icon={<LogOut className="size-[18px]" />}
              disabled={loggingOut}
              onClick={() => {
                close();
                void handleLogout();
              }}
            >
              {t('account.logout')}
            </MenuItem>
          </div>
        </>
      )}
    </DropdownMenu>
  );
}
