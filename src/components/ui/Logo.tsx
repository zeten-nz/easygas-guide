import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Logo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  const lg = size === 'lg';
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span
        className={cn(
          'flex items-center justify-center rounded-2xl bg-brand-500 text-white',
          'shadow-[0_12px_28px_-10px_rgba(228,35,43,0.65)]',
          lg ? 'size-12' : 'size-9 rounded-xl',
        )}
      >
        <Flame className={lg ? 'size-6' : 'size-5'} strokeWidth={2.2} />
      </span>
      <span className={cn('font-bold tracking-tight text-[var(--text-1)]', lg ? 'text-2xl' : 'text-lg')}>
        EASY<span className="text-brand-500">GAS</span>
      </span>
    </div>
  );
}
