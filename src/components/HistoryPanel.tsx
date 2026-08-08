import { useState } from 'react';
import { useHistory, type HistoryEntry } from '../state/history';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ open, onClose, onSelect }: Props): JSX.Element | null {
  const { settings, entries, clear, togglePin, remove } = useHistory();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  if (!open) return null;
  const visible = filter === 'pinned' ? entries.filter((entry) => entry.pinned) : entries;
  return (
    <aside className="history-panel" role="dialog" aria-modal="true" aria-label="History">
      <header>
        <h2>History</h2>
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
      <ol className="history-panel__list" data-testid="history-list">
        {visible.length === 0 && <li className="history-panel__empty">{t('historyPanel.empty')}</li>}
        {visible.map((entry) => (
          <li key={entry.id} className="history-panel__entry">
            <div className="history-panel__expressions">
              <code>{entry.expression}</code>
              <span aria-hidden="true">→</span>
              <strong>{entry.result}</strong>
            </div>
            <div className="history-panel__meta">
              <span className="history-panel__mode">{entry.mode}</span>
              <span className="history-panel__date">{new Date(entry.createdAt).toLocaleString()}</span>
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
    </aside>
  );
}
