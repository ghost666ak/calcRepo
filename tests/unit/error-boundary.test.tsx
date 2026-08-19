import { renderWithProviders as render } from '../../src/test/renderWithProviders';
import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Component, type ReactNode } from 'react';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';

// Trigger a render error on demand so we can drive the boundary from a
// test without coupling to any specific feature view.
class Boom extends Component<{ throw: boolean }, never> {
  override render(): ReactNode {
    if (this.props.throw) throw new Error('boom');
    return <p>ok</p>;
  }
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Stub the SW/caches APIs that recoverFromStaleBundle touches so the
    // recovery path can be invoked without jsdom complaining.
    if (!('caches' in window)) {
      Object.defineProperty(window, 'caches', {
        value: { keys: () => Promise.resolve([]), delete: () => Promise.resolve(true) },
      });
    }
    if (!('serviceWorker' in navigator)) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { getRegistrations: () => Promise.resolve([]) },
      });
    }
    // window.location.reload can't be stubbed with vi.stubGlobal because
    // it's a non-writable property on jsdom's Location — replace the
    // whole location object instead.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: vi.fn() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <p>hello</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('shows the error message and both recovery buttons when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom throw={false} />
      </ErrorBoundary>,
    );
    // Re-render with throw=true so the boundary captures the error.
    render(
      <ErrorBoundary>
        <Boom throw={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-reload')).toHaveTextContent(/reload page/i);
    expect(screen.getByTestId('error-boundary-recover')).toHaveTextContent(/clear cache/i);
  });

  it('auto-triggers the cache-wipe reload when the error looks like a stale chunk', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload');
    // Drive a stale-bundle-shaped message through componentDidCatch.
    const Trigger: () => null = () => {
      throw new Error('Failed to fetch dynamically imported module: https://example/x.js');
    };
    render(
      <ErrorBoundary>
        <Trigger />
      </ErrorBoundary>,
    );
    // recoverFromStaleBundle is async (caches.delete + reload); the
    // location.reload call is the observable side-effect.
    return vi.waitFor(() => {
      expect(reloadSpy).toHaveBeenCalled();
    });
  });

  it('does NOT auto-trigger recovery for ordinary render errors', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload');
    render(
      <ErrorBoundary>
        <Boom throw={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('reload button calls window.location.reload', () => {
    const reloadSpy = vi.spyOn(window.location, 'reload');
    render(
      <ErrorBoundary>
        <Boom throw={true} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByTestId('error-boundary-reload'));
    expect(reloadSpy).toHaveBeenCalled();
  });
});