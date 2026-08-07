import { usePreferences } from '../state/preferences';
import { useHistory } from '../state/history';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: Props): JSX.Element | null {
  const { preferences, update } = usePreferences();
  const { settings, toggleEnabled, setMaxEntries } = useHistory();
  if (!open) return null;

  return (
    <aside className="settings-drawer" role="dialog" aria-modal="true" aria-label="Settings">
      <header>
        <h2>Settings</h2>
        <button type="button" onClick={onClose} aria-label="Close settings">
          Close
        </button>
      </header>
      <fieldset>
        <legend>Theme</legend>
        {(['light', 'dark', 'system'] as const).map((theme) => (
          <label key={theme}>
            <input
              type="radio"
              name="theme"
              value={theme}
              checked={preferences.theme === theme}
              onChange={() => update({ theme })}
            />
            {theme}
          </label>
        ))}
      </fieldset>
      <label>
        <input
          type="checkbox"
          checked={preferences.reducedMotion}
          onChange={(event) => update({ reducedMotion: event.target.checked })}
        />
        Reduce motion
      </label>
      <fieldset>
        <legend>Privacy</legend>
        <p className="settings-drawer__hint">
          History and favorites stay on this device. No data is sent anywhere.
        </p>
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={() => toggleEnabled()}
            data-testid="history-toggle"
          />
          Remember calculation history
        </label>
        <label>
          Maximum entries
          <input
            type="number"
            min={1}
            max={500}
            value={settings.maxEntries}
            onChange={(event) => setMaxEntries(Number(event.target.value) || 1)}
          />
        </label>
      </fieldset>
    </aside>
  );
}