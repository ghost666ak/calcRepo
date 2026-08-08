import { AppShell } from './AppShell';
import { ErrorBoundary } from './ErrorBoundary';
import { PreferencesProvider } from '../state/preferences';
import { HistoryProvider } from '../state/history';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <PreferencesProvider>
        <HistoryProvider>
          <AppShell />
        </HistoryProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}