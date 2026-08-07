import type { ReactNode } from 'react';

interface Props {
  readonly label: string;
  readonly value: string;
  readonly onPress: (value: string) => void;
  readonly variant?: 'digit' | 'operator' | 'action';
  readonly children?: ReactNode;
}

export function Key({ label, value, onPress, variant = 'digit', children }: Props): JSX.Element {
  return (
    <button
      type="button"
      className={`key key--${variant}`}
      data-value={value}
      onClick={() => onPress(value)}
      aria-label={label}
    >
      {children ?? label}
    </button>
  );
}