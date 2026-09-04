import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  /** Slot rendered inside the field on the right (e.g. show/hide password). */
  rightSlot?: ReactNode;
  /** Static prefix text rendered before the value (e.g. +998). */
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, leftIcon, rightSlot, prefix, id: idProp, className, ...rest },
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
      <div
        className={cn(
          'flex h-12 items-center gap-2 rounded-xl border bg-[var(--field-bg)] px-3.5 transition-colors',
          'focus-within:border-brand-500/70 focus-within:ring-2 focus-within:ring-brand-500/25',
          error ? 'border-brand-500/70' : 'border-[var(--field-border)]',
        )}
      >
        {leftIcon && <span className="shrink-0 text-[var(--text-2)]">{leftIcon}</span>}
        {prefix && <span className="shrink-0 text-[15px] font-medium text-[var(--text-1)]">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'h-full w-full min-w-0 bg-transparent text-[15px] text-[var(--text-1)] outline-none',
            'placeholder:text-[var(--field-placeholder)]',
            className,
          )}
          {...rest}
        />
        {rightSlot && <span className="shrink-0">{rightSlot}</span>}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-[13px] text-brand-400">
          {error}
        </p>
      )}
    </div>
  );
});
