import { forwardRef, useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id: idProp, className, children, ...rest },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const errorId = `${id}-error`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-[var(--text-2)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-12 w-full appearance-none rounded-xl border bg-[var(--field-bg)] px-3.5 pr-10 text-[15px] text-[var(--text-1)] transition-colors',
            'focus:border-brand-500/70 focus:outline-none focus:ring-2 focus:ring-brand-500/25',
            'invalid:text-[var(--field-placeholder)]',
            error ? 'border-brand-500/70' : 'border-[var(--field-border)]',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--text-2)]" />
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-brand-400">
          {error}
        </p>
      )}
    </div>
  );
});
