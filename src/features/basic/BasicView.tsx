import { useCallback, useEffect, useRef, useState } from 'react';
import { Key } from '../../components/Key';
import { ExpressionDisplay, canonicaliseExpression, visualiseExpression } from '../../components/ExpressionDisplay';
import { HistoryAnswer } from '../../components/HistoryAnswer';
import { useBasicCalculator } from './useBasicCalculator';
import type { BasicHistoryEntry } from './useBasicCalculator';
import { usePreferences } from '../../state/preferences';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  readonly onHistoryChange?: (entry: BasicHistoryEntry) => void;
  /** When auto-save is off, the caller passes a forceRecord so each inline
   *  entry can be promoted into persistent history manually. */
  readonly autoSaveEnabled?: boolean;
  readonly onManualSave?: (entry: BasicHistoryEntry) => void;
  /** When this prop's nonce changes, the expression is replaced — used by
   *  History → Reuse to load a previous expression back into the keypad. */
  readonly seedExpression?: { value: string; nonce: number } | null;
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

export function BasicView({
  onHistoryChange,
  autoSaveEnabled = true,
  onManualSave,
  seedExpression,
}: Props = {}): JSX.Element {
  const { expression, display, error, errorPosition, history, press, copy, repeat, consumeLatestEntry, seedWith, setDisplayValue, setInputFocused } = useBasicCalculator();
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  const showErrorText = preferences.errorUx === 'verbose';

  // History → Reuse: when the seed prop's nonce changes, replace the expression.
  useEffect(() => {
    if (seedExpression) seedWith(seedExpression.value);
  }, [seedExpression, seedWith]);

  // Transient "Copied!" feedback for the copy button — flips back after ~1.5s
  // so the user gets confirmation without a permanent UI change.
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  const handleCopy = useCallback(async () => {
    const ok = await copy();
    if (!ok) return;
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
  }, [copy]);
  useEffect(() => () => {
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
  }, []);

  useEffect(() => {
    if (!onHistoryChange) return;
    const entry = consumeLatestEntry();
    if (entry) onHistoryChange(entry);
  });

  return (
    <section className="basic-view" aria-label={t('modes.basic')}>
      <div className="display" data-testid="display">
        <ExpressionDisplay
          expression={expression}
          errorPosition={errorPosition}
          errorUx={preferences.errorUx}
          testId="display-expression"
        />
        <input
          className="display__value display__value--editable"
          data-testid="display-value"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          aria-live="polite"
          value={visualiseExpression(display)}
          onChange={(e) => {
            const canonical = canonicaliseExpression(e.target.value);
            setDisplayValue(canonical);
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        {showErrorText && error && (
          <p className="display__error" role="alert" data-testid="display-error">
            {error}
          </p>
        )}
      </div>
      <div className="basic-view__actions">
        <button
          type="button"
          onClick={() => void handleCopy()}
          data-testid="copy-button"
          className={copied ? 'basic-view__action basic-view__action--copied' : 'basic-view__action'}
          aria-live="polite"
        >
          {copied ? t('actions.copyDone') : t('actions.copy')}
        </button>
        <button
          type="button"
          onClick={repeat}
          data-testid="repeat-button"
          className="basic-view__action"
          title={t('actions.repeatHint')}
        >
          {t('actions.repeat')}
        </button>
      </div>
      <div className="keypad" role="group" aria-label={t('modes.basic')}>
        {KEYS.map((key) => (
          <Key key={key.value} label={key.label} value={key.value} variant={key.variant} onPress={press} />
        ))}
        <button
          type="button"
          className="key key--action key--equals"
          data-value="="
          data-testid="key-equals"
          onClick={() => press('=')}
          aria-label={t('basic.equals')}
        >
          =
        </button>
      </div>
      {history.length > 0 && (
        <details className="history" data-testid="history">
          <summary>{t('historyPanel.title')} ({history.length})</summary>
          {!autoSaveEnabled && onManualSave && (
            <p className="history__auto-save-hint">{t('history.inlineAutoSaveHint')}</p>
          )}
          <ol>
            {history.map((entry, index) => (
              <li key={`${entry.expression}-${index}`}>
                <code>{visualiseExpression(entry.expression)}</code>
                <span> = </span>
                <HistoryAnswer value={entry.result} />
                {!autoSaveEnabled && onManualSave && (
                  <button
                    type="button"
                    onClick={() => onManualSave(entry)}
                    aria-label={t('history.saveEntry')}
                    data-testid="save-history-entry"
                  >
                    {t('history.saveEntry')}
                  </button>
                )}
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
