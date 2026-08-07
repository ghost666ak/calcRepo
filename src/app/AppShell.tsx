import { useState } from 'react';
import { Display } from '../components/Display';
import { Keypad } from '../components/Keypad';
import { ModeTabs } from '../components/ModeTabs';
import { SettingsDrawer } from '../components/SettingsDrawer';
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
        <Display value="0" mode={mode} />
        <Keypad mode={mode} />
      </main>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}