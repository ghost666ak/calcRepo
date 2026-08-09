import { useProgrammerCalculator, PROGRAMMER_WIDTHS } from './useProgrammerCalculator';
import type { Signedness, WordWidth } from '../../core/programmer';
import { useTranslation } from '../../i18n/useTranslation';

const BASE_LABELS: Record<number, string> = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' };

function Button({ label, onPress, variant = 'function', testId }: {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: 'digit' | 'operator' | 'function' | 'action';
  readonly testId?: string;
}): JSX.Element {
  return (
    <button
      type="button"
      className={`key key--${variant}`}
      onClick={onPress}
      aria-label={label}
      data-testid={testId}
    >
      {label}
    </button>
  );
}

export function ProgrammerView(): JSX.Element {
  const {
    expression,
    width,
    signedness,
    result,
    error,
    hint,
    outputValue,
    outputBase,
    setExpression,
    setWidth,
    setSignedness,
    setOutputBase,
    clear,
    backspace,
    insert,
    copy,
  } = useProgrammerCalculator();
  const { t } = useTranslation();

  return (
    <section className="programmer-view" aria-label={t('programmer.title')}>
      <header className="programmer-view__header">
        <h2>{t('programmer.title')}</h2>
        <p>{t('programmer.description')}</p>
      </header>

      <div className="programmer-view__settings" role="group" aria-label={t('programmer.settings')}>
        <fieldset>
          <legend>{t('programmer.wordWidth')}</legend>
          {PROGRAMMER_WIDTHS.map((entry: WordWidth) => (
            <label key={entry}>
              <input
                type="radio"
                name="programmer-width"
                value={entry}
                checked={width === entry}
                onChange={() => setWidth(entry)}
              />
              {t('programmer.wordWidthBit', { value: entry })}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>{t('programmer.signedness')}</legend>
          {(['unsigned', 'signed'] as const satisfies readonly Signedness[]).map((entry) => (
            <label key={entry}>
              <input
                type="radio"
                name="programmer-signedness"
                value={entry}
                checked={signedness === entry}
                onChange={() => setSignedness(entry)}
              />
              {t(`programmer.${entry}` as const)}
            </label>
          ))}
        </fieldset>
      </div>

      <label className="programmer-view__field">
        <span>{t('programmer.expression')}</span>
        <input
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          aria-label={t('programmer.expression')}
          data-testid="programmer-input"
        />
      </label>

      <div className="programmer-view__keypad" role="group" aria-label={t('programmer.keypad')}>
        <Button label="C" onPress={clear} variant="action" testId="programmer-clear" />
        <Button label="⌫" onPress={backspace} variant="action" testId="programmer-backspace" />
        <Button label="(" onPress={() => insert('(')} variant="operator" />
        <Button label=")" onPress={() => insert(')')} variant="operator" />
        <Button label="&" onPress={() => insert(' & ')} variant="operator" />
        <Button label="|" onPress={() => insert(' | ')} variant="operator" />
        <Button label="^" onPress={() => insert(' ^ ')} variant="operator" />
        <Button label="~" onPress={() => insert('~')} variant="operator" />
        <Button label="<<" onPress={() => insert(' << ')} variant="operator" />
        <Button label=">>" onPress={() => insert(' >> ')} variant="operator" />
        <Button label="<<<" onPress={() => insert(' <<< ')} variant="operator" />
        <Button label=">>>" onPress={() => insert(' >>> ')} variant="operator" />
        <Button label="+" onPress={() => insert(' + ')} variant="operator" />
        <Button label="−" onPress={() => insert(' - ')} variant="operator" />
        <Button label="%" onPress={() => insert(' % ')} variant="operator" />
        <Button label="0b" onPress={() => insert('0b')} variant="function" />
        <Button label="0o" onPress={() => insert('0o')} variant="function" />
        <Button label="0x" onPress={() => insert('0x')} variant="function" />
        <Button label="0xFF" onPress={() => insert('0xFF')} variant="digit" />
        <Button label="0x0F" onPress={() => insert('0x0F')} variant="digit" />
        {(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const).map((digit) => (
          <Button key={digit} label={digit} onPress={() => insert(digit)} variant="digit" />
        ))}
      </div>

      <div className="programmer-view__copy" role="group" aria-label={t('programmer.outputCopyGroup')}>
        <label className="programmer-view__field">
          <span>{t('programmer.outputBase')}</span>
          <select
            value={outputBase}
            onChange={(event) => setOutputBase(Number(event.target.value))}
            data-testid="programmer-output-base"
          >
            {[2, 8, 10, 16].map((base) => (
              <option key={base} value={base}>{BASE_LABELS[base] ?? base}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="key key--action"
          onClick={() => void copy()}
          aria-label={t('actions.copy')}
          data-testid="programmer-copy"
        >
          {t('actions.copy')}
        </button>
      </div>

      <div className="programmer-view__output" data-testid="programmer-output">
        <span className="display__label">{t('programmer.output')}</span>
        <output className="display__value" aria-live="polite">
          {outputValue || '0'}
        </output>
        {result && (
          <dl className="programmer-view__snapshots">
            <div><dt>{t('programmer.bin')}</dt><dd data-testid="programmer-bin">{result.bin}</dd></div>
            <div><dt>{t('programmer.oct')}</dt><dd data-testid="programmer-oct">{result.oct}</dd></div>
            <div><dt>{t('programmer.dec')}</dt><dd data-testid="programmer-dec">{result.dec}</dd></div>
            <div><dt>{t('programmer.hex')}</dt><dd data-testid="programmer-hex">{result.hex}</dd></div>
            <div><dt>{t('programmer.raw')}</dt><dd>{result.raw}</dd></div>
          </dl>
        )}
        {error && (
          <p className="display__error" role="alert" data-testid="programmer-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="display__hint">{hint}</p>
        )}
        {result && (
          <ul className="programmer-view__flags" aria-label={t('programmer.statusFlags')}>
            <li data-active={result.flags.overflow ? 'true' : 'false'}>{t('programmer.overflow')}: {result.flags.overflow ? '1' : '0'}</li>
            <li data-active={result.flags.carry ? 'true' : 'false'}>{t('programmer.carry')}: {result.flags.carry ? '1' : '0'}</li>
            <li data-active={result.flags.invalidBits ? 'true' : 'false'}>{t('programmer.invalidBits')}: {result.flags.invalidBits ? '1' : '0'}</li>
          </ul>
        )}
      </div>
    </section>
  );
}
