import type { CalculatorMode, ModeDescriptor } from '../core/modes';

interface Props {
  readonly modes: readonly ModeDescriptor[];
  readonly value: CalculatorMode;
  readonly onChange: (mode: CalculatorMode) => void;
}

export function ModeTabs({ modes, value, onChange }: Props): JSX.Element {
  return (
    <nav className="mode-tabs" aria-label="Calculator mode">
      <ul role="tablist" aria-label="Calculator mode tabs">
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
                {mode.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}