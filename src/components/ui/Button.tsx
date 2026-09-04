import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger-outline';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-[0_10px_24px_-10px_rgba(228,35,43,0.55)] hover:bg-brand-600 active:bg-brand-700 disabled:hover:bg-brand-500',
  secondary:
    'bg-[var(--surface-2)] text-[var(--text-1)] border border-[var(--border-1)] hover:bg-[var(--surface)] active:opacity-80',
  ghost: 'bg-transparent text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]',
  'danger-outline':
    'bg-transparent text-brand-500 border border-brand-500/40 hover:bg-brand-50 dark:hover:bg-brand-500/10',
};

const sizeClasses: Record<Size, string> = {
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
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
