import { Component, type ReactNode } from 'react';
import {
  isStaleModuleError,
  recoverFromStaleBundle,
} from '../pwa/recoverFromStaleBundle';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error): void {
    console.error('App crashed:', error);
    // If this looks like a stale-bundle failure (a dynamic import 404),
    // don't just render a reset button — the chunk is fundamentally
    // missing, so resetting won't help. Trigger the full cache-wipe +
    // reload flow instead. The window-level handler in main.tsx covers
    // the case where the error never reaches React; this covers the case
    // where React's render path catches it first.
    if (isStaleModuleError(error.message)) {
      recoverFromStaleBundle();
    }
  }

  reload = (): void => {
    window.location.reload();
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="error-boundary" role="alert" data-testid="error-boundary">
        <h1 className="error-boundary__title">Something went wrong</h1>
        <p className="error-boundary__message">{error.message}</p>
        <div className="error-boundary__actions">
          <button
            type="button"
            className="error-boundary__button"
            onClick={this.reload}
            data-testid="error-boundary-reload"
          >
            Reload page
          </button>
          <button
            type="button"
            className="error-boundary__button error-boundary__button--secondary"
            onClick={recoverFromStaleBundle}
            data-testid="error-boundary-recover"
          >
            Clear cache &amp; reload
          </button>
        </div>
        <p className="error-boundary__hint">
          If the problem keeps happening, &ldquo;Clear cache &amp; reload&rdquo; wipes
          the saved app files and downloads them again.
        </p>
      </main>
    );
  }
}