import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/**
 * Route-level error boundary (Phase 10E §L). Catches render errors — including a
 * failed lazy-chunk fetch after a new deploy — and shows a recoverable UI. It
 * NEVER renders a stack trace or internal path to the user. A chunk-load failure
 * offers a page reload (the natural fix for a stale bundle); any other error
 * offers an in-place retry that remounts the subtree.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    // Surface for diagnostics without exposing internals to the user.
    if (import.meta.env.DEV) console.error('Route error boundary caught:', error);
  }

  private isChunkError(): boolean {
    const msg = this.state.error?.message ?? '';
    return /dynamically imported module|Loading chunk|Failed to fetch|importing a module script/i.test(msg);
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    const chunk = this.isChunkError();
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center" role="alert">
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--danger-bg)] text-[var(--danger-fg)]">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold text-[var(--text-1)]">
          {chunk ? 'Yangi versiya mavjud' : 'Nimadir noto’g’ri ketdi'}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--text-2)]">
          {chunk
            ? 'Ilova yangilangan. Sahifani qayta yuklab, davom eting.'
            : 'Ushbu bo’limni ko’rsatishda xatolik yuz berdi. Qayta urinib ko’ring.'}
        </p>
        <div className="mt-4">
          {chunk ? (
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" />
              Qayta yuklash
            </Button>
          ) : (
            <Button onClick={this.reset}>
              <RefreshCw className="size-4" />
              Qayta urinish
            </Button>
          )}
        </div>
      </div>
    );
  }
}
