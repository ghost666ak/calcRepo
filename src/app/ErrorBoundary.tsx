import { Component, type ReactNode } from 'react';

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
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return (
        <main className="error-boundary" role="alert">
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button type="button" onClick={this.reset}>
            Try again
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}