import { useState } from 'react';
import { ModeTabs } from '../components/ModeTabs';
import { SettingsDrawer } from '../components/SettingsDrawer';
import { BasicView } from '../features/basic/BasicView';
import { AVAILABLE_MODES, type CalculatorMode } from '../core/modes';
import { usePreferences } from '../state/preferences';

export function AppShell(): JSX.Element {
  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { preferences } = usePreferences();

  return (
    <div className="app-shell" data-theme={preferences.theme}>
      <header className="app-shell__header">
        <h1 className="app-shell__title">calcRepo</h1>
        <button
          type="button"
          className="app-shell__settings"
          aria-label="Open settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((value) => !value)}
        >
          Settings
        </button>
      </header>
      <ModeTabs modes={AVAILABLE_MODES} value={mode} onChange={setMode} />
      <main className="app-shell__main" aria-live="polite">
        {mode === 'basic' && <BasicView />}
        {mode !== 'basic' && (
          <section className="placeholder" role="status" aria-live="polite">
            <h2>{modeLabel(mode)}</h2>
            <p>This mode will be implemented in a later phase. See docs/roadmap.</p>
          </section>
        )}
      </main>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function modeLabel(mode: CalculatorMode): string {
  return AVAILABLE_MODES.find((entry) => entry.id === mode)?.label ?? mode;
}