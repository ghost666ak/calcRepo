export type EvalResult<T> =
  | { readonly ok: true; readonly value: T; readonly formatted: string }
  | {
      readonly ok: false;
      readonly kind: 'syntax' | 'domain' | 'precision' | 'internal';
      readonly message: string;
      readonly hint?: string;
    };

export type AngleUnit = 'DEG' | 'RAD' | 'GRAD';

export interface Preferences {
  readonly theme: 'light' | 'dark' | 'system';
  readonly reducedMotion: boolean;
  readonly angleUnit: AngleUnit;
  readonly precisionDigits: number;
}