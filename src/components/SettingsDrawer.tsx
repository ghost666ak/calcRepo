import { usePreferences } from '../state/preferences';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: Props): JSX.Element | null {
  const { preferences, update } = usePreferences();
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
    </aside>
  );
}