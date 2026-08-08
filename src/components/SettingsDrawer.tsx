import { useCallback, useEffect, useState } from 'react';
import type { CacheLevel, ErrorUx, Theme } from '../core/types';
import { usePreferences } from '../state/preferences';
import { useHistory } from '../state/history';
import { useTranslation } from '../i18n/useTranslation';
import { usePwaStatus } from '../pwa/usePwaStatus';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
}

const THEMES: ReadonlyArray<Theme> = ['light', 'dark', 'system'];
const CACHE_LEVELS: ReadonlyArray<{ value: CacheLevel; labelKey: string }> = [
  { value: 'shell', labelKey: 'settings.cacheLevelShell' },
  { value: 'assets', labelKey: 'settings.cacheLevelAssets' },
  { value: 'extended', labelKey: 'settings.cacheLevelExtended' },
];
const ERROR_UX_LEVELS: ReadonlyArray<{
  value: ErrorUx;
  labelKey: string;
  hintKey: string;
}> = [
  {
    value: 'verbose',
    labelKey: 'settings.errorUxVerbose',
    hintKey: 'settings.errorUxVerboseHint',
  },
  {
    value: 'highlight',
    labelKey: 'settings.errorUxHighlight',
    hintKey: 'settings.errorUxHighlightHint',
  },
  {
    value: 'silent',
    labelKey: 'settings.errorUxSilent',
    hintKey: 'settings.errorUxSilentHint',
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function SettingsDrawer({ open, onClose }: Props): JSX.Element | null {
  const { preferences, update } = usePreferences();
  const { settings, toggleEnabled, setMaxEntries } = useHistory();
  const { t } = useTranslation();
  const {
    updateAvailable,
    checking,
    checkForUpdate,
    applyUpdate,
    cacheStats,
    refreshCacheStats,
    clearCache,
  } = usePwaStatus();
  const [cacheClearedAt, setCacheClearedAt] = useState<number | null>(null);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<{ at: number; hasUpdate: boolean } | null>(null);

  // Whenever the drawer opens, refresh cache stats so the user sees fresh numbers.
  useEffect(() => {
    if (open) void refreshCacheStats();
  }, [open, refreshCacheStats]);

  const onClearCache = useCallback(async () => {
    await clearCache();
    setCacheClearedAt(Date.now());
    await refreshCacheStats();
  }, [clearCache, refreshCacheStats]);

  const onCheckForUpdate = useCallback(async () => {
    const hasUpdate = await checkForUpdate();
    setLastUpdateCheck({ at: Date.now(), hasUpdate });
  }, [checkForUpdate]);

  // ESC closes the drawer; lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-drawer" role="dialog" aria-modal="true" aria-label={t('settings.title')}>
      <div className="settings-drawer__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="settings-drawer__panel">
        <header className="settings-drawer__header">
          <h2>{t('settings.title')}</h2>
          <button type="button" onClick={onClose} aria-label={t('settings.close')}>
            {t('settings.close')}
          </button>
        </header>

      <section className="settings-drawer__section">
        <h3>{t('settings.appearance')}</h3>
        <fieldset>
          <legend>{t('settings.theme')}</legend>
          {THEMES.map((theme) => (
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
        <fieldset>
          <legend>{t('settings.language')}</legend>
          <label>
            <input type="radio" name="language" value="en" checked={preferences.language === 'en'} readOnly />
            English
          </label>
          <p className="settings-drawer__hint">More languages will land in a future release.</p>
        </fieldset>
        <label>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(event) => update({ reducedMotion: event.target.checked })}
          />
          {t('settings.reducedMotion')}
        </label>
      </section>

      <section className="settings-drawer__section">
        <h3>{t('settings.offline')}</h3>
        <fieldset>
          <legend>{t('settings.cacheLevel')}</legend>
          {CACHE_LEVELS.map((level) => (
            <label key={level.value}>
              <input
                type="radio"
                name="cacheLevel"
                value={level.value}
                checked={preferences.cacheLevel === level.value}
                onChange={() => update({ cacheLevel: level.value })}
              />
              {t(level.labelKey)}
            </label>
          ))}
        </fieldset>
        <p className="settings-drawer__hint" data-testid="cache-stats">
          {cacheStats === null
            ? 'Calculating cache size…'
            : t('settings.cacheSize', { size: `${cacheStats.entries} files · ${formatBytes(cacheStats.bytes)}` })}
        </p>
        <button type="button" onClick={() => void onClearCache()} data-testid="clear-cache">
          {t('settings.clearCache')}
        </button>
        {cacheClearedAt !== null && (
          <p className="settings-drawer__success" role="status" data-testid="cache-cleared">
            {t('settings.cacheCleared')}
          </p>
        )}
      </section>

      <section className="settings-drawer__section">
        <h3>{t('settings.updates')}</h3>
        <label>
          <input
            type="checkbox"
            checked={preferences.pwaAutoUpdate}
            onChange={(event) => update({ pwaAutoUpdate: event.target.checked })}
          />
          {t('settings.autoUpdate')}
        </label>
        <button
          type="button"
          onClick={() => void onCheckForUpdate()}
          disabled={checking}
          data-testid="check-for-update"
        >
          {checking ? '…' : t('settings.checkForUpdate')}
        </button>
        {updateAvailable ? (
          <div className="settings-drawer__update" role="status" data-testid="update-available">
            <p>{t('settings.updateAvailable')}</p>
            <button type="button" onClick={applyUpdate} data-testid="apply-update">
              {t('settings.applyUpdate')}
            </button>
          </div>
        ) : (
          lastUpdateCheck !== null && (
            <p className="settings-drawer__hint">{t('settings.noUpdateAvailable')}</p>
          )
        )}
      </section>

      <section className="settings-drawer__section">
        <h3>{t('settings.feedback')}</h3>
        <fieldset>
          <legend>{t('settings.errorUx')}</legend>
          {ERROR_UX_LEVELS.map((level) => (
            <label key={level.value} className="settings-drawer__option">
              <input
                type="radio"
                name="errorUx"
                value={level.value}
                checked={preferences.errorUx === level.value}
                onChange={() => update({ errorUx: level.value })}
                data-testid={`error-ux-${level.value}`}
              />
              <span className="settings-drawer__option-label">{t(level.labelKey)}</span>
              <span className="settings-drawer__hint">{t(level.hintKey)}</span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="settings-drawer__section">
        <h3>{t('settings.privacy')}</h3>
        <p className="settings-drawer__hint">{t('settings.privacyNote')}</p>
        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={() => toggleEnabled()}
            data-testid="history-toggle"
          />
          {t('settings.rememberHistory')}
        </label>
        <label>
          {t('settings.maxEntries')}
          <input
            type="number"
            min={1}
            max={500}
            value={settings.maxEntries}
            onChange={(event) => setMaxEntries(Number(event.target.value) || 1)}
          />
        </label>
      </section>
      </div>
    </div>
  );
}