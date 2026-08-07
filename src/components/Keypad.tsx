import { useCallback } from 'react';
import { Key } from './Key';
import type { CalculatorMode } from '../core/modes';

interface Props {
  readonly mode: CalculatorMode;
}

const BASIC_KEYS = [
  { label: '7', value: '7', variant: 'digit' as const },
  { label: '8', value: '8', variant: 'digit' as const },
  { label: '9', value: '9', variant: 'digit' as const },
  { label: '÷', value: '/', variant: 'operator' as const },
  { label: '4', value: '4', variant: 'digit' as const },
  { label: '5', value: '5', variant: 'digit' as const },
  { label: '6', value: '6', variant: 'digit' as const },
  { label: '×', value: '*', variant: 'operator' as const },
  { label: '1', value: '1', variant: 'digit' as const },
  { label: '2', value: '2', variant: 'digit' as const },
  { label: '3', value: '3', variant: 'digit' as const },
  { label: '−', value: '-', variant: 'operator' as const },
  { label: '0', value: '0', variant: 'digit' as const },
  { label: '.', value: '.', variant: 'digit' as const },
  { label: '=', value: '=', variant: 'action' as const },
  { label: '+', value: '+', variant: 'operator' as const },
];

export function Keypad({ mode }: Props): JSX.Element {
  const handlePress = useCallback((value: string) => {
    // Foundation phase: the keypad wires to console only.
    // Phase 2 will route these presses through the restricted arithmetic engine.
    console.debug(`[${mode}] key pressed:`, value);
  }, [mode]);

  return (
    <div className="keypad" role="group" aria-label={`${mode} keypad`}>
      {BASIC_KEYS.map((key) => (
        <Key
          key={key.value}
          label={key.label}
          value={key.value}
          variant={key.variant}
          onPress={handlePress}
        />
      ))}
    </div>
  );
}