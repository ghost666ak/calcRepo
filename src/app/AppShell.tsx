import { useCallback, useEffect, useRef, useState } from 'react';
import { ModeTabs } from '../components/ModeTabs';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { HistoryPanel } from '../components/HistoryPanel';
import { BasicView } from '../features/basic/BasicView';
import { ScientificView } from '../features/scientific/ScientificView';
import { BaseView } from '../features/base/BaseView';
import { AVAILABLE_MODES, type CalculatorMode } from '../core/modes';
import { usePreferences } from '../state/preferences';
import { useHistory } from '../state/history';
import type { BasicHistoryEntry } from '../features/basic/useBasicCalculator';
import { lazy, Suspense } from 'react';
import { useUrlParams } from './useUrlParams';

const ProgrammerView = lazy(() =>
  import('../features/programmer/ProgrammerView').then((m) => ({ default: m.ProgrammerView })),
);
const ToolsView = lazy(() =>
  import('../features/tools/ToolsView').then((m) => ({ default: m.ToolsView })),
);

export function AppShell(): JSX.Element {
  const { initial, write } = useUrlParams();
  const [mode, setMode] = useState<CalculatorMode>(initial.mode ?? 'basic');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(initial.settings);
  const [historyOpen, setHistoryOpen] = useState<boolean>(initial.history);
  const { preferences } = usePreferences();
  const { record } = useHistory();

  // Track previous drawer state so opening a drawer pushes a history entry
  // (so back button closes it) and closing just replaces in place.
  const prevSettingsOpen = useRef(settingsOpen);
  const prevHistoryOpen = useRef(historyOpen);
  const isInitialMount = useRef(true);

  // Keep the URL in sync with local UI state (mode + drawers).
  useEffect(() => {
    if (isInitialMount.current) {
      // First run only syncs refs to current state; URL is already correct.
      isInitialMount.current = false;
      prevSettingsOpen.current = settingsOpen;
      prevHistoryOpen.current = historyOpen;
      return;
    }
    const justOpenedSettings = settingsOpen && !prevSettingsOpen.current;
    const justOpenedHistory = historyOpen && !prevHistoryOpen.current;
    prevSettingsOpen.current = settingsOpen;
    prevHistoryOpen.current = historyOpen;
    const next: Partial<{ mode: CalculatorMode; settings: boolean; history: boolean }> = {
      mode,
    };
    if (settingsOpen) next.settings = true;
    if (historyOpen) next.history = true;
    write(next, { push: justOpenedSettings || justOpenedHistory });
  }, [mode, settingsOpen, historyOpen, write]);

  // React to back/forward navigation.
  useEffect(() => {
    const onUrl = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        mode?: CalculatorMode;
        settings: boolean;
        history: boolean;
      };
      if (detail.mode) setMode(detail.mode);
      setSettingsOpen(detail.settings);
      setHistoryOpen(detail.history);
    };
    window.addEventListener('calcrepo:url', onUrl);
    return () => window.removeEventListener('calcrepo:url', onUrl);
  }, []);

  const handleBasicHistory = useCallback(
    (entry: BasicHistoryEntry) => {
      record({ kind: 'expression', expression: entry.expression, result: entry.result, mode: 'basic' });
    },
    [record],
  );

  return (
    <div className="app-shell" data-theme={preferences.theme}>
      <header className="app-shell__header">
        <h1 className="app-shell__title">calcRepo</h1>
        <div className="app-shell__actions">
          <button
            type="button"
            className="app-shell__history"
            aria-label="Open history"
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((value) => !value)}
            data-testid="open-history"
          >
            History
          </button>
          <button
            type="button"
            className="app-shell__settings"
            aria-label="Open settings"
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen((value) => !value)}
          >
            Settings
          </button>
        </div>
      </header>
      <ModeTabs modes={AVAILABLE_MODES} value={mode} onChange={setMode} />
      <main className="app-shell__main" aria-live="polite">
        {mode === 'basic' && <BasicView onHistoryChange={handleBasicHistory} />}
        {mode === 'scientific' && <ScientificView />}
        {mode === 'base' && <BaseView />}
        {mode === 'programmer' && (
          <Suspense fallback={<p role="status">Loading programmer mode…</p>}>
            <ProgrammerView />
          </Suspense>
        )}
        {mode === 'tools' && (
          <Suspense fallback={<p role="status">Loading tools…</p>}>
            <ToolsView />
          </Suspense>
        )}
      </main>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}