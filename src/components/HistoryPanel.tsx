import { useState } from 'react';
import { useHistory, type HistoryEntry } from '../state/history';

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSelect?: (entry: HistoryEntry) => void;
}

export function HistoryPanel({ open, onClose, onSelect }: Props): JSX.Element | null {
  const { settings, entries, clear, togglePin, remove } = useHistory();
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');
  if (!open) return null;
  const visible = filter === 'pinned' ? entries.filter((entry) => entry.pinned) : entries;
  return (
    <aside className="history-panel" role="dialog" aria-modal="true" aria-label="History">
      <header>
        <h2>History</h2>
        <button type="button" onClick={onClose} aria-label="Close history">
          Close
        </button>
      </header>
      {!settings.enabled && (
        <p className="history-panel__notice">
          History is off. Enable it in settings to start recording calculations.
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
          All
        </label>
        <label>
          <input
            type="radio"
            name="history-filter"
            value="pinned"
            checked={filter === 'pinned'}
            onChange={() => setFilter('pinned')}
          />
          Pinned only
        </label>
        <button type="button" onClick={() => clear()} disabled={visible.length === 0}>
          Clear unpinned
        </button>
      </div>
      <ol className="history-panel__list" data-testid="history-list">
        {visible.length === 0 && <li className="history-panel__empty">No history yet.</li>}
        {visible.map((entry) => (
          <li key={entry.id} className="history-panel__entry">
            <div className="history-panel__expressions">
              <code>{entry.expression}</code>
              <span aria-hidden="true">→</span>
              <strong>{entry.result}</strong>
            </div>
            <div className="history-panel__meta">
              <span>{entry.mode}</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
            <div className="history-panel__actions">
              {onSelect && (
                <button type="button" onClick={() => onSelect(entry)}>
                  Reuse
                </button>
              )}
              <button type="button" onClick={() => togglePin(entry.id)} aria-pressed={entry.pinned}>
                {entry.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button type="button" onClick={() => remove(entry.id)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  );
}
