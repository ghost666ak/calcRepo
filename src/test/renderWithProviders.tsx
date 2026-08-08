import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { PreferencesProvider } from '../state/preferences';
import { HistoryProvider } from '../state/history';

/**
 * Wraps a component in the same provider tree the real app uses (Preferences
 * + History contexts). Use this instead of the bare `render` from
 * testing-library whenever the component under test reads from either context.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: RenderOptions,
): ReturnType<typeof render> {
  return render(
    <PreferencesProvider>
      <HistoryProvider>{ui}</HistoryProvider>
    </PreferencesProvider>,
    options,
  );
}