import { PRESET_BASES, useBaseConverter } from './useBaseConverter';
import { MAX_BASE, MIN_BASE } from '../../core/base';
import { useTranslation } from '../../i18n/useTranslation';

const VARIANT_LABELS: Record<number, string> = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' };

export function BaseView(): JSX.Element {
  const { t } = useTranslation();
  const {
    input,
    sourceBase,
    targetBase,
    output,
    truncated,
    repeating,
    error,
    hint,
    maxFractionDigits,
    groupSize,
    setInput,
    setSourceBase,
    setTargetBase,
    setSourceMaxFractionDigits,
    setTargetGroupSize,
    swap,
    copy,
  } = useBaseConverter();

  return (
    <section className="base-view" aria-label={t('base.title')}>
      <header className="base-view__header">
        <h2>{t('base.title')}</h2>
        <p>Convert between bases {MIN_BASE}–{MAX_BASE} with exact integer/fractional arithmetic.</p>
      </header>

      <div className="base-view__grid">
        <label className="base-view__field">
          <span>Value</span>
          <input
            type="text"
            inputMode="text"
            spellCheck={false}
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label="Value to convert"
            data-testid="base-input"
          />
        </label>

        <label className="base-view__field">
          <span>Source base</span>
          <input
            type="number"
            min={MIN_BASE}
            max={MAX_BASE}
            step={1}
            value={sourceBase}
            onChange={(event) => setSourceBase(Number(event.target.value))}
            aria-label="Source base"
            data-testid="base-source"
          />
        </label>

        <div className="base-view__presets" role="group" aria-label="Source base presets">
          {PRESET_BASES.map((base) => (
            <button
              key={base}
              type="button"
              className={`key ${sourceBase === base ? 'key--active' : ''}`}
              onClick={() => setSourceBase(base)}
              aria-pressed={sourceBase === base}
            >
              {VARIANT_LABELS[base] ?? base}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="key key--action"
          onClick={() => void copy()}
          aria-label="Copy converted value"
          data-testid="base-copy"
        >
          Copy
        </button>
        <button
          type="button"
          className="key key--action"
          onClick={swap}
          aria-label="Swap source and target bases"
          data-testid="base-swap"
        >
          ⇄ Swap
        </button>

        <label className="base-view__field">
          <span>Target base</span>
          <input
            type="number"
            min={MIN_BASE}
            max={MAX_BASE}
            step={1}
            value={targetBase}
            onChange={(event) => setTargetBase(Number(event.target.value))}
            aria-label="Target base"
            data-testid="base-target"
          />
        </label>

        <div className="base-view__presets" role="group" aria-label="Target base presets">
          {PRESET_BASES.map((base) => (
            <button
              key={base}
              type="button"
              className={`key ${targetBase === base ? 'key--active' : ''}`}
              onClick={() => setTargetBase(base)}
              aria-pressed={targetBase === base}
            >
              {VARIANT_LABELS[base] ?? base}
            </button>
          ))}
        </div>

        <label className="base-view__field">
          <span>Fraction digits (1–128): {maxFractionDigits}</span>
          <input
            type="range"
            min={1}
            max={128}
            step={1}
            value={maxFractionDigits}
            onChange={(event) => setSourceMaxFractionDigits(Number(event.target.value))}
            aria-label="Maximum fraction digits"
            data-testid="base-fraction-digits"
          />
        </label>

        <label className="base-view__field">
          <span>Digits per group (0–8): {groupSize}</span>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={groupSize}
            onChange={(event) => setTargetGroupSize(Number(event.target.value))}
            aria-label="Digits per group"
            data-testid="base-group-size"
          />
        </label>
      </div>

      <div className="base-view__output" data-testid="base-output">
        <span className="display__label">Result</span>
        <output className="display__value" aria-live="polite">
          {output}
        </output>
        {error && (
          <p className="display__error" role="alert" data-testid="base-error">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="display__hint">{hint}</p>
        )}
        {truncated && (
          <p className="display__hint" data-testid="base-truncated">Output truncated to the configured fraction digit limit.</p>
        )}
        {repeating && (
          <p className="display__hint" data-testid="base-repeating">Repeating fraction shown in parentheses.</p>
        )}
      </div>
    </section>
  );
}