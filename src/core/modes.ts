export type CalculatorMode = 'basic' | 'scientific' | 'base' | 'programmer' | 'tools';

export interface ModeDescriptor {
  readonly id: CalculatorMode;
  readonly label: string;
  readonly description: string;
}

export const AVAILABLE_MODES: readonly ModeDescriptor[] = [
  { id: 'basic', label: 'Basic', description: 'Trusted arithmetic for everyday use.' },
  { id: 'scientific', label: 'Scientific', description: 'Logs, roots, trig, and configurable precision.' },
  { id: 'base', label: 'Base', description: 'Exact conversion among bases 2–36.' },
  { id: 'programmer', label: 'Programmer', description: 'Mixed-base integers, bitwise, width, signedness.' },
  { id: 'tools', label: 'Tools', description: 'Bit masks, Unicode, IEEE-754, bytes, timestamps.' },
];