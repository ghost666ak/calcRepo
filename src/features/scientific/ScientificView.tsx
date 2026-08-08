import { useEffect } from 'react';
import { listScientificFunctions } from '../../core/scientific/functions';
import { ANGLE_UNITS } from '../../core/scientific/angle';
import type { AngleUnit } from '../../core/types';
import { ExpressionDisplay } from '../../components/ExpressionDisplay';
import { useScientificCalculator } from './useScientificCalculator';
import type { ScientificHistoryEntry } from './useScientificCalculator';
import { usePreferences } from '../../state/preferences';
import { useTranslation } from '../../i18n/useTranslation';

interface ButtonProps {
  readonly label: string;
  readonly value: string;
  readonly onPress: (value: string) => void;
  readonly variant?: 'digit' | 'operator' | 'function' | 'action';
}

interface ScientificViewProps {
  readonly onHistoryChange?: (entry: ScientificHistoryEntry) => void;
  /** When auto-save is off, the caller passes a forceRecord so each inline
   *  entry can be promoted into persistent history manually. */
  readonly autoSaveEnabled?: boolean;
  readonly onManualSave?: (entry: ScientificHistoryEntry) => void;
}

function Button({ label, value, onPress, variant = 'function' }: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={`key key--${variant}`}
      data-value={value}
      onClick={() => onPress(value)}
      aria-label={label}
    >
      {label}
    </button>
  );
}

export function ScientificView({
  onHistoryChange,
  autoSaveEnabled = true,
  onManualSave,
}: ScientificViewProps = {}): JSX.Element {
  const {
    expression,
    display,
    error,
    errorPosition,
    history,
    consumeLatestEntry,
    angleUnit,
    precisionDigits,
    memory,
    press,
    equals,
    setAngleUnit,
    setPrecisionDigits,
    memoryAdd,
    memorySubtract,
    memoryRecall,
    memoryClear,
  } = useScientificCalculator();
  const { preferences } = usePreferences();
  const { t } = useTranslation();
  const showErrorText = preferences.errorUx === 'verbose';

  useEffect(() => {
    if (!onHistoryChange) return;
    const entry = consumeLatestEntry();
    if (entry) onHistoryChange(entry);
  });

  const functions = listScientificFunctions();

  return (
    <section className="scientific-view" aria-label="Scientific calculator">
      <div className="scientific-view__settings" role="group" aria-label="Scientific settings">
        <fieldset>
          <legend>Angle unit</legend>
          {ANGLE_UNITS.map((unit) => (
            <label key={unit}>
              <input
                type="radio"
                name="angle-unit"
                value={unit}
                checked={angleUnit === unit}
                onChange={() => setAngleUnit(unit as AngleUnit)}
              />
              {unit}
            </label>
          ))}
        </fieldset>
        <label>
          Precision (0–64 digits): {precisionDigits}
          <input
            type="range"
            min={0}
            max={64}
            step={1}
            value={precisionDigits}
            onChange={(event) => setPrecisionDigits(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="display" data-testid="display">
        <ExpressionDisplay
          expression={expression}
          errorPosition={errorPosition}
          errorUx={preferences.errorUx}
          testId="display-expression"
        />
        <output className="display__value" data-testid="display-value" aria-live="polite">
          {display}
        </output>
        {showErrorText && error && (
          <p className="display__error" role="alert" data-testid="display-error">
            {error}
          </p>
        )}
        <p className="display__memory" aria-live="polite">Memory: {memory}</p>
      </div>
      <div className="scientific-view__memory" role="group" aria-label="Memory registers">
        <Button label="M+" value="M+" onPress={() => memoryAdd()} variant="action" />
        <Button label="M−" value="M-" onPress={() => memorySubtract()} variant="action" />
        <Button label="MR" value="MR" onPress={() => memoryRecall()} variant="action" />
        <Button label="MC" value="MC" onPress={() => memoryClear()} variant="action" />
      </div>
      {/*
        Split the keypad into two grids so functions and digits never share a
        row. With ~19 scientific functions in a 4-col grid, the last row of
        functions has a stray empty cell — without this split, that cell gets
        filled by "7" and the 4×4 digit block at the bottom breaks apart.
      */}
      <div className="scientific-view__keypad">
        <div className="keypad keypad--scientific keypad--scientific-functions" role="group" aria-label="Scientific functions">
          <Button label="C" value="C" onPress={press} variant="action" />
          <Button label="⌫" value="⌫" onPress={press} variant="action" />
          <Button label="(" value="(" onPress={press} variant="operator" />
          <Button label=")" value=")" onPress={press} variant="operator" />
          <Button label="π" value="pi" onPress={press} variant="function" />
          <Button label="e" value="e" onPress={press} variant="function" />
          <Button label="%" value="%" onPress={press} variant="operator" />
          <Button label="^" value="^" onPress={press} variant="operator" />
          {functions.map((fn) => (
            <Button
              key={fn.name}
              label={fn.label}
              value={`${fn.name}(`}
              onPress={press}
              variant="function"
            />
          ))}
        </div>
        <div className="keypad keypad--scientific keypad--scientific-digits" role="group" aria-label="Scientific digit keypad">
          {(['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', '0', '.', '!', '+'] as const).map((entry) => {
            const variant = entry === '+' || entry === '−' || entry === '×' || entry === '÷'
              ? 'operator'
              : 'digit';
            const value = entry === '×' ? '*' : entry === '÷' ? '/' : entry === '−' ? '-' : entry;
            return (
              <Button
                key={entry}
                label={entry}
                value={value}
                onPress={press}
                variant={variant}
              />
            );
          })}
          <button
            type="button"
            className="key key--action key--equals"
            data-value="="
            data-testid="key-equals"
            onClick={() => equals()}
            aria-label="Equals"
          >
            =
          </button>
        </div>
      </div>
      {history.length > 0 && (
        <details className="history" data-testid="history">
          <summary>History ({history.length})</summary>
          {!autoSaveEnabled && onManualSave && (
            <p className="history__auto-save-hint">{t('history.inlineAutoSaveHint')}</p>
          )}
          <ol>
            {history.map((entry, index) => (
              <li key={`${entry.expression}-${index}`}>
                <code>{entry.expression}</code>
                <span> = </span>
                <strong>{entry.result}</strong>
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