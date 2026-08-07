import { listScientificFunctions } from '../../core/scientific/functions';
import { ANGLE_UNITS } from '../../core/scientific/angle';
import type { AngleUnit } from '../../core/types';
import { useScientificCalculator } from './useScientificCalculator';

interface ButtonProps {
  readonly label: string;
  readonly value: string;
  readonly onPress: (value: string) => void;
  readonly variant?: 'digit' | 'operator' | 'function' | 'action';
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

export function ScientificView(): JSX.Element {
  const {
    expression,
    display,
    error,
    history,
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
        <span className="display__expression" data-testid="display-expression">
          {expression || ' '}
        </span>
        <output className="display__value" data-testid="display-value" aria-live="polite">
          {display}
        </output>
        {error && (
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
      <div className="keypad keypad--scientific" role="group" aria-label="Scientific keypad">
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