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

/** Available UI languages. 'en' is fully translated; 'hi' is a partial translation
 *  (covers the most-visible UI; falls back to English for missing keys). */
export type Language = 'en' | 'hi';

/**
 * Caching aggressiveness for the PWA service worker.
 * - 'shell'    — only the install-time app shell is cached (default; smallest footprint).
 * - 'assets'   — app shell + every same-origin static asset (current production behaviour).
 * - 'extended' — also caches the last successful HTML response for offline app boots.
 */
export type CacheLevel = 'shell' | 'assets' | 'extended';

/**
 * How much feedback the calculator shows when an expression has an error.
 * - 'verbose'   — error text + character highlight + caret (default).
 * - 'highlight' — character highlight only; no error message text.
 * - 'silent'    — no error UI; auto-correct still happens but quietly.
 *
 * Auto-correct feedback (e.g. "Corrected: 8×(6+5)") is independent and is
 * controlled by its own preference, not this one.
 */
export type ErrorUx = 'verbose' | 'highlight' | 'silent';

export interface Preferences {
  readonly theme: Theme;
  readonly reducedMotion: boolean;
  readonly angleUnit: AngleUnit;
  readonly precisionDigits: number;
  readonly language: Language;
  readonly pwaAutoUpdate: boolean;
  readonly cacheLevel: CacheLevel;
  readonly errorUx: ErrorUx;
  /**
   * Whether typing a digit or decimal after a successful `=` starts a fresh
   * calculation (true, default) or appends to the previous expression (false,
   * matches the legacy Windows-calculator behaviour).
   */
  readonly clearAfterEquals: boolean;
}