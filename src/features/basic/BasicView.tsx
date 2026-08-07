import { useEffect } from 'react';
import { Key } from '../../components/Key';
import { ExpressionDisplay } from '../../components/ExpressionDisplay';
import { useBasicCalculator } from './useBasicCalculator';
import type { BasicHistoryEntry } from './useBasicCalculator';
import { usePreferences } from '../../state/preferences';

interface Props {
  readonly onHistoryChange?: (entry: BasicHistoryEntry) => void;
}

const KEYS: ReadonlyArray<{ label: string; value: string; variant: 'digit' | 'operator' | 'action' }> = [
  { label: 'C', value: 'C', variant: 'action' },
  { label: '⌫', value: '⌫', variant: 'action' },
  { label: '(', value: '(', variant: 'operator' },
  { label: ')', value: ')', variant: 'operator' },
  { label: '7', value: '7', variant: 'digit' },
  { label: '8', value: '8', variant: 'digit' },
  { label: '9', value: '9', variant: 'digit' },
  { label: '÷', value: '/', variant: 'operator' },
  { label: '4', value: '4', variant: 'digit' },
  { label: '5', value: '5', variant: 'digit' },
  { label: '6', value: '6', variant: 'digit' },
  { label: '×', value: '*', variant: 'operator' },
  { label: '1', value: '1', variant: 'digit' },
  { label: '2', value: '2', variant: 'digit' },
  { label: '3', value: '3', variant: 'digit' },
  { label: '−', value: '-', variant: 'operator' },
  { label: '0', value: '0', variant: 'digit' },
  { label: '.', value: '.', variant: 'digit' },
  { label: '%', value: '%', variant: 'operator' },
  { label: '+', value: '+', variant: 'operator' },
];

export function BasicView({ onHistoryChange }: Props = {}): JSX.Element {
  const { expression, display, error, errorPosition, history, press, copy, repeat, consumeLatestEntry } = useBasicCalculator();
  const { preferences } = usePreferences();
  const showErrorText = preferences.errorUx === 'verbose';

  useEffect(() => {
    if (!onHistoryChange) return;
    const entry = consumeLatestEntry();
    if (entry) onHistoryChange(entry);
  });

  return (
    <section className="basic-view" aria-label="Basic calculator">
      <div className="display" data-testid="display">
        <ExpressionDisplay
          expression={expression}
          errorPosition={errorPosition}
          errorUx={preferences.errorUx}
          testId="display-expression"
        />
        <output
          className="display__value"
          data-testid="display-value"
          aria-live="polite"
        >
          {display}
        </output>
        {showErrorText && error && (
          <p className="display__error" role="alert" data-testid="display-error">
            {error}
          </p>
        )}
      </div>
      <div className="basic-view__actions">
        <button type="button" onClick={() => void copy()} data-testid="copy-button">
          Copy
        </button>
        <button type="button" onClick={repeat} data-testid="repeat-button">
          Repeat (+)
        </button>
      </div>
      <div className="keypad" role="group" aria-label="Basic keypad">
        {KEYS.map((key) => (
          <Key key={key.value} label={key.label} value={key.value} variant={key.variant} onPress={press} />
        ))}
        <button
          type="button"
          className="key key--action key--equals"
          data-value="="
          data-testid="key-equals"
          onClick={() => press('=')}
          aria-label="Equals"
        >
          =
        </button>
      </div>
      {history.length > 0 && (
        <details className="history" data-testid="history">
          <summary>History ({history.length})</summary>
          <ol>
            {history.map((entry, index) => (
              <li key={`${entry.expression}-${index}`}>
                <code>{entry.expression}</code>
                <span> = </span>
                <strong>{entry.result}</strong>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
