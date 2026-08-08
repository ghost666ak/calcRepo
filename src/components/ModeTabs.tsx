import type { CalculatorMode, ModeDescriptor } from '../core/modes';
import { useTranslation } from '../i18n/useTranslation';

interface Props {
  readonly modes: readonly ModeDescriptor[];
  readonly value: CalculatorMode;
  readonly onChange: (mode: CalculatorMode) => void;
}

export function ModeTabs({ modes, value, onChange }: Props): JSX.Element {
  const { t } = useTranslation();
  return (
    <nav className="mode-tabs" aria-label={t('modes.basic')}>
      <ul role="tablist" aria-label={t('nav.modeTabsLabel')}>
        {modes.map((mode) => {
          const selected = mode.id === value;
          return (
            <li key={mode.id} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                className={`mode-tabs__tab${selected ? ' is-active' : ''}`}
                onClick={() => onChange(mode.id)}
              >
                {t(`modes.${mode.id}` as const)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}