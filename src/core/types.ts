export type EvalResult<T> =
  | { readonly ok: true; readonly value: T; readonly formatted: string }
  | {
      readonly ok: false;
      readonly kind: 'syntax' | 'domain' | 'precision' | 'internal';
      readonly message: string;
      readonly hint?: string;
      /**
       * Character offset in the original input that caused the error.
       * `undefined` when the error applies to the expression as a whole
       * (e.g. "expression ends with an operator").
       */
      readonly position?: number;
    };

export type AngleUnit = 'DEG' | 'RAD' | 'GRAD';

export type Theme = 'light' | 'dark' | 'system';

/** Available UI languages. Only English is shipped today; the schema is ready for more. */
export type Language = 'en';

/**
 * Caching aggressiveness for the PWA service worker.
 * - 'shell'    — only the install-time app shell is cached (default; smallest footprint).
 * - 'assets'   — app shell + every same-origin static asset (current production behaviour).
 * - 'extended' — also caches the last successful HTML response for offline app boots.
 */
export type CacheLevel = 'shell' | 'assets' | 'extended';

export interface Preferences {
  readonly theme: Theme;
  readonly reducedMotion: boolean;
  readonly angleUnit: AngleUnit;
  readonly precisionDigits: number;
  readonly language: Language;
  readonly pwaAutoUpdate: boolean;
  readonly cacheLevel: CacheLevel;
}