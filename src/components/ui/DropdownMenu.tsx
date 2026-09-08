import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

interface DropdownMenuProps {
  /** The trigger element — cloned to receive the open/aria wiring and a ref. */
  button: ReactElement<Record<string, unknown>>;
  /** Menu contents; call `close()` after activating an item. */
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'end';
  /** Extra classes for the floating panel. */
  panelClassName?: string;
}

/**
 * A small accessible dropdown menu: click to open, click-outside / Escape to
 * close (focus returns to the trigger on Escape), `aria-haspopup`/`aria-expanded`
 * on the trigger and `role="menu"` on the panel. Reduced-motion friendly (no
 * entrance animation). Used for the top-bar profile menu and table row actions.
 */
export function DropdownMenu({ button, children, align = 'end', panelClassName }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        // Return focus to the trigger (the first button inside the root).
        rootRef.current?.querySelector<HTMLElement>('button')?.focus();
      }
    };
    // Focus the first menu item for keyboard users.
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const trigger = cloneElement(button, {
    onClick: () => setOpen((v) => !v),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? menuId : undefined,
  });

  return (
    <div ref={rootRef} className="relative">
      {trigger}
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute z-40 mt-2 min-w-52 overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface)] p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]',
            align === 'end' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  onClick?: () => void;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

/** A single actionable menu row (role="menuitem"). */
export function MenuItem({ onClick, icon, danger, disabled, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        danger
          ? 'text-brand-600 hover:bg-brand-50'
          : 'text-[var(--text-1)] hover:bg-[var(--surface-2)]',
      )}
    >
      {icon && <span className={cn('shrink-0', danger ? 'text-brand-600' : 'text-[var(--text-3)]')}>{icon}</span>}
      {children}
    </button>
  );
}
