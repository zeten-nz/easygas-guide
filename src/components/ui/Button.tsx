import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

// Phase 11A design direction: brand BLUE is the ordinary primary action; brand RED
// is reserved for destructive actions (solid `danger`) and accents. This replaces
// the earlier all-red primary so the workspace is not a wall of red buttons.
const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white shadow-[0_10px_24px_-12px_rgba(35,64,168,0.55)] hover:bg-blue-700 active:bg-blue-800 disabled:hover:bg-blue-600',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border-1)] hover:bg-[var(--surface)] active:opacity-80',
  ghost: 'bg-transparent text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]',
  danger:
    'bg-brand-600 text-white shadow-[0_10px_24px_-12px_rgba(228,35,43,0.55)] hover:bg-brand-700 active:bg-brand-800 disabled:hover:bg-brand-600',
  'danger-outline':
    'bg-transparent text-brand-600 border border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});
