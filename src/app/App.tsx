import { AppShell } from './AppShell';
import { ErrorBoundary } from './ErrorBoundary';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}