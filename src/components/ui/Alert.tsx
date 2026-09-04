import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

type Tone = 'error' | 'success' | 'info';

const toneClasses: Record<Tone, string> = {
  error: 'border-brand-500/35 bg-brand-500/10 text-brand-700 [.theme-dark_&]:text-brand-300',
  success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 [.theme-dark_&]:text-emerald-300',
  info: 'border-sky-500/35 bg-sky-500/10 text-sky-700 [.theme-dark_&]:text-sky-300',
};

const toneIcons: Record<Tone, ReactNode> = {
  error: <AlertTriangle className="size-[18px] shrink-0" />,
  success: <CheckCircle2 className="size-[18px] shrink-0" />,
  info: <Info className="size-[18px] shrink-0" />,
};

export function Alert({ tone = 'info', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm', toneClasses[tone], className)}
    >
      {toneIcons[tone]}
      <div className="leading-snug">{children}</div>
    </div>
  );
}
