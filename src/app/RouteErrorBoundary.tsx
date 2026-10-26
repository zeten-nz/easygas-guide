import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useT, type TFunc } from '../i18n/i18n';

interface Props {
  children: ReactNode;
  t: TFunc;
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
 *
 * A class component cannot use hooks, so the localized `t` is injected by the
 * functional wrapper exported below.
 */
class RouteErrorBoundaryInner extends Component<Props, State> {
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
    const { t } = this.props;

    const chunk = this.isChunkError();
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 text-center" role="alert">
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--danger-bg)] text-[var(--danger-fg)]">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-bold text-[var(--text-1)]">
          {chunk ? t('routeError.chunkTitle') : t('routeError.genericTitle')}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-[var(--text-2)]">
          {chunk ? t('routeError.chunkBody') : t('routeError.genericBody')}
        </p>
        <div className="mt-4">
          {chunk ? (
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="size-4" />
              {t('common.reload')}
            </Button>
          ) : (
            <Button onClick={this.reset}>
              <RefreshCw className="size-4" />
              {t('common.retry')}
            </Button>
          )}
        </div>
      </div>
    );
  }
}

/** Functional wrapper: injects the localized `t` into the class boundary. */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const t = useT();
  return <RouteErrorBoundaryInner t={t}>{children}</RouteErrorBoundaryInner>;
}
