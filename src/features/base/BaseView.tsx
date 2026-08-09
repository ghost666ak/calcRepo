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
    sourceBaseDraft,
    targetBaseDraft,
    sourceBaseError,
    targetBaseError,
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
        <p>{t('base.description')}</p>
      </header>

      <div className="base-view__grid">
        <label className="base-view__field">
          <span>{t('base.value')}</span>
          <input
            type="text"
            inputMode="text"
            spellCheck={false}
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-label={t('base.value')}
            data-testid="base-input"
          />
        </label>

        <div className="base-view__field">
          <span className="base-view__field-label">
            {t('base.sourceBase')} ({MIN_BASE}–{MAX_BASE})
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            spellCheck={false}
            autoComplete="off"
            value={sourceBaseDraft}
            onChange={(event) => setSourceBase(event.target.value)}
            aria-label={t('base.sourceBase')}
            aria-invalid={sourceBaseError !== null}
            data-testid="base-source"
          />
          {sourceBaseError && (
            <p className="base-view__error" data-testid="base-source-error">
              {t('base.outOfRange', { min: MIN_BASE, max: MAX_BASE })}
            </p>
          )}
        </div>

        <div className="base-view__presets" role="group" aria-label={t('base.sourceBasePresets')}>
          {PRESET_BASES.map((base) => (
            <button
              key={base}
              type="button"
              className={`key ${sourceBase === base ? 'key--active' : ''}`}
              onClick={() => setSourceBase(String(base))}
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
          aria-label={t('base.copy')}
          data-testid="base-copy"
        >
          {t('actions.copy')}
        </button>
        <button
          type="button"
          className="key key--action"
          onClick={swap}
          aria-label={t('base.swap')}
          data-testid="base-swap"
        >
          ⇄ {t('base.swap')}
        </button>

        <div className="base-view__field">
          <span className="base-view__field-label">
            {t('base.targetBase')} ({MIN_BASE}–{MAX_BASE})
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            spellCheck={false}
            autoComplete="off"
            value={targetBaseDraft}
            onChange={(event) => setTargetBase(event.target.value)}
            aria-label={t('base.targetBase')}
            aria-invalid={targetBaseError !== null}
            data-testid="base-target"
          />
          {targetBaseError && (
            <p className="base-view__error" data-testid="base-target-error">
              {t('base.outOfRange', { min: MIN_BASE, max: MAX_BASE })}
            </p>
          )}
        </div>

        <div className="base-view__presets" role="group" aria-label={t('base.targetBasePresets')}>
          {PRESET_BASES.map((base) => (
            <button
              key={base}
              type="button"
              className={`key ${targetBase === base ? 'key--active' : ''}`}
              onClick={() => setTargetBase(String(base))}
              aria-pressed={targetBase === base}
            >
              {VARIANT_LABELS[base] ?? base}
            </button>
          ))}
        </div>

        <label className="base-view__field">
          <span>{t('base.fractionDigits', { value: maxFractionDigits })}</span>
          <input
            type="range"
            min={1}
            max={128}
            step={1}
            value={maxFractionDigits}
            onChange={(event) => setSourceMaxFractionDigits(Number(event.target.value))}
            aria-label={t('base.fractionDigits', { value: maxFractionDigits })}
            data-testid="base-fraction-digits"
          />
        </label>

        <label className="base-view__field">
          <span>{t('base.digitsPerGroup', { value: groupSize })}</span>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={groupSize}
            onChange={(event) => setTargetGroupSize(Number(event.target.value))}
            aria-label={t('base.digitsPerGroup', { value: groupSize })}
            data-testid="base-group-size"
          />
        </label>
      </div>

      <div className="base-view__output" data-testid="base-output">
        <span className="display__label">{t('base.resultLabel')}</span>
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
          <p className="display__hint" data-testid="base-truncated">{t('base.truncated')}</p>
        )}
        {repeating && (
          <p className="display__hint" data-testid="base-repeating">{t('base.repeating')}</p>
        )}
      </div>
    </section>
  );
}
