import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className={cn('group flex cursor-pointer select-none items-center gap-2.5', className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...rest} />
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors',
          'border-[var(--field-border)] bg-[var(--field-bg)] text-transparent',
          'peer-checked:border-brand-500 peer-checked:bg-brand-500 peer-checked:text-white',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500/40',
        )}
      >
        <Check className="size-3.5" strokeWidth={3} />
      </span>
      <span className="text-sm text-[var(--text-2)] transition-colors group-hover:text-[var(--text-1)]">{label}</span>
    </label>
  );
});
