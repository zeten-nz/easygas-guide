import { Spinner } from './Spinner';

export function FullScreenLoader() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--bg)]">
      <Spinner className="size-8 text-brand-500" />
    </div>
  );
}
