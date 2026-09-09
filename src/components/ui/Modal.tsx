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
   * Optional action block (e.g. form buttons) rendered after the content, in
   * NORMAL document flow, separated by a divider — it scrolls with the dialog.
   * A submit button here associates with its form via the HTML `form` attribute
   * (the form lives in `children`). (A pinned/sticky footer was tried and could
   * not be made reliable on the mobile bottom-sheet — its actions landed below
   * the CI visual viewport, off the clickable area — so the dialog is a single
   * scroll region, centered within the visible viewport; see the render below.)
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/*
        Single scrollable dialog, CENTERED within the visible viewport. The former
        mobile bottom-sheet (items-end + 92dvh) pinned its content to the LAYOUT
        viewport's bottom; on the CI mobile emulation the layout viewport is ~60px
        taller than the VISUAL (clickable) viewport, so the action buttons rendered
        below the visible screen and pointer events landed on the field above them.
        Centering with a small-viewport height cap keeps the whole dialog — actions
        included — inside the clickable area; the actions are in normal document
        flow (a divider + the footer block) and scroll with the form.
      */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'max-h-[85svh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--surface)] shadow-2xl',
          'border border-[var(--border-1)] p-5 sm:p-6',
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-[var(--text-1)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-1.5 text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-1)]">
            <X className="size-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 border-t border-[var(--border-1)] pt-5">{footer}</div>}
      </div>
    </div>
  );
}
