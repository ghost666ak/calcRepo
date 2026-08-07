import { useCallback, useState } from 'react';
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

const ProgrammerView = lazy(() =>
  import('../features/programmer/ProgrammerView').then((m) => ({ default: m.ProgrammerView })),
);
const ToolsView = lazy(() =>
  import('../features/tools/ToolsView').then((m) => ({ default: m.ToolsView })),
);

export function AppShell(): JSX.Element {
  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { preferences } = usePreferences();
  const { record } = useHistory();

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