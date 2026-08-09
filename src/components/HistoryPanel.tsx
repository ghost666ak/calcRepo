import { useState } from 'react';
import { useHistory, type HistoryEntry } from '../state/history';
import { useTranslation } from '../i18n/useTranslation';
import { usePreferences } from '../state/preferences';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect?: (entry: HistoryEntry) => void;
}

// "Sun, 09 Aug 2026 12:30" in either English or Hindi digits — never the
// browser default locale (which usually disagrees with the user's UI language).
const DATE_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();
function formatDate(value: number, language: string): string {
  let fmt = DATE_FORMATTER_CACHE.get(language);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(language === 'hi' ? 'hi-IN' : 'en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    DATE_FORMATTER_CACHE.set(language, fmt);
  }
  try {
    return fmt.format(new Date(value));
  } catch {
    return new Date(value).toISOString();
  }
}

export function HistoryPanel({ open, onClose, onSelect }: Props): JSX.Element | null {
  const { settings, entries, clear, togglePin, remove } = useHistory();
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  if (!open) return null;
  const visible = filter === 'pinned' ? entries.filter((entry) => entry.pinned) : entries;
  const dateText = formatDate(Date.now(), preferences.language);
  return (
    <aside className="history-panel" role="dialog" aria-modal="true" aria-label={t('historyPanel.title')}>
      <header>
        <h2>{t('historyPanel.title')}</h2>
        <button type="button" onClick={onClose} aria-label={t('settings.close')}>
          {t('settings.close')}
        </button>
      </header>
      {!settings.enabled && (
        <p className="history-panel__notice" role="status">
          {t('history.autoSaveOffNotice')}
        </p>
      )}
      <div className="history-panel__controls">
        <label>
          <input
            type="radio"
            name="history-filter"
            value="all"
            checked={filter === 'all'}
            onChange={() => setFilter('all')}
          />
          {t('historyPanel.all')}
        </label>
        <label>
          <input
            type="radio"
            name="history-filter"
            value="pinned"
            checked={filter === 'pinned'}
            onChange={() => setFilter('pinned')}
          />
          {t('historyPanel.pinnedOnly')}
        </label>
        <button type="button" onClick={() => clear()} disabled={visible.length === 0}>
          {t('historyPanel.clearUnpinned')}
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="history-panel__empty" data-testid="history-empty">{t('historyPanel.empty')}</p>
      ) : (
        <ol className="history-panel__list" data-testid="history-list" aria-label={`${t('historyPanel.title')} (${dateText})`}>
          {visible.map((entry) => (
            <li key={entry.id} className="history-panel__entry">
              <div className="history-panel__expressions">
                <code>{entry.expression}</code>
                <span aria-hidden="true">→</span>
                <strong>{entry.result}</strong>
              </div>
              <div className="history-panel__meta">
                <span className="history-panel__mode">{t(`modes.${entry.mode}` as const)}</span>
                <span className="history-panel__date">{formatDate(entry.createdAt, preferences.language)}</span>
              </div>
              <div className="history-panel__actions">
                {onSelect && (
                  <button type="button" onClick={() => onSelect(entry)}>
                    {t('historyPanel.reuse')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => togglePin(entry.id)}
                  aria-pressed={entry.pinned}
                >
                  {entry.pinned ? t('historyPanel.unpin') : t('historyPanel.pin')}
                </button>
                <button type="button" onClick={() => remove(entry.id)}>
                  {t('historyPanel.remove')}
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
