import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  /**
   * Optional fixed footer (e.g. form action buttons). When provided, the panel
   * becomes a flex column — header + a SCROLLABLE body + this non-scrolling
   * footer — so the actions stay pinned and fully clickable even on a tall mobile
   * bottom-sheet. A submit button in the footer associates with its form via the
   * HTML `form` attribute (the form lives in `children`).
   */
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, className, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without making the focus effect re-run every render
  // (inline `onClose` arrows change identity each render — a dep on it would
  // re-fire the effect and steal focus back to the top on every keystroke).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    // Restore focus to whatever was focused before the dialog opened (§I).
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusables = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      // Focus trap: keep Tab / Shift+Tab inside the dialog.
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        dialogRef.current?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog (first focusable, else the dialog itself).
    const initial = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE) ?? dialogRef.current;
    initial?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'max-h-[92dvh] w-full rounded-t-3xl bg-[var(--surface)] shadow-2xl sm:max-w-lg sm:rounded-3xl',
          'border border-[var(--border-1)]',
          // Without a fixed footer: the whole panel scrolls (original behavior).
          // With one: a 3-row grid (header / scrollable body / footer). Grid tracks
          // give the body a DEFINITE size — `minmax(0,1fr)` lets it shrink and its
          // own `overflow-y-auto` scroll — so its content can never grow past the
          // footer. (Headless Linux Chromium was compositing the scroll body's
          // layer ABOVE the later-DOM footer, so a body field stole pointer events
          // from the footer's action button on the mobile bottom-sheet; the footer
          // is given an explicit stacking level below to settle that paint order.)
          footer ? 'grid grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden' : 'overflow-y-auto p-5 sm:p-6',
          className,
        )}
      >
        {footer ? (
          <>
            <div className="flex items-center justify-between gap-4 p-5 pb-3 sm:px-6 sm:pt-6">
              <h2 className="text-lg font-bold text-[var(--text-1)]">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1.5 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]">
                <X className="size-5" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-5 pb-2 sm:px-6">{children}</div>
            {/* relative + z-10 keeps the pinned footer the top hit-target over the
                scroll body (see the grid note above); the combobox dropdown is
                z-50, so it still opens above the footer. */}
            <div className="relative z-10 border-t border-[var(--border-1)] bg-[var(--surface)] p-4 sm:px-6 sm:py-4">{footer}</div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-[var(--text-1)]">{title}</h2>
              <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1.5 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
