import type { CalculatorMode } from '../core/modes';

interface Props {
  readonly value: string;
  readonly mode: CalculatorMode;
}

export function Display({ value, mode }: Props): JSX.Element {
  return (
    <section className="display" aria-label={`Display, ${mode} mode`}>
      <span className="display__mode" aria-hidden="true">
        {mode.toUpperCase()}
      </span>
      <output className="display__value" data-testid="display-value">
        {value}
      </output>
    </section>
  );
}