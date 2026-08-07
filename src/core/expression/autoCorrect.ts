import { evaluate as basicEvaluate } from './evaluate';
import type { EvalResult } from '../types';

export interface AutoCorrectedResult<T> {
  readonly ok: true;
  readonly value: T;
  readonly formatted: string;
  /** The expression that was actually evaluated (after the auto-fix). */
  readonly correctedFrom: string;
  /** Human-readable note explaining what changed. */
  readonly note: string;
}

/**
 * Try a small set of safe, unambiguous corrections for a syntax error.
 *
 * The corrections covered here are paren-mismatch cases that have exactly
 * one sensible fix:
 *   `(2+3`    → `(2+3)`     (one missing `)`)
 *   `2+3)`    → `2+3`       (one extra `)`)
 *   `((1+2))` → `((1+2))`   (already balanced, not invoked)
 *
 * Anything more speculative (inserting missing operators, removing doubled
 * operators) is intentionally not attempted — those would silently change
 * the user's intent.
 */
export function autoCorrectParens<T>(
  input: string,
  result: EvalResult<T>,
  options: { evaluate?: (input: string) => EvalResult<T> } = {},
): AutoCorrectedResult<T> | null {
  if (result.ok) return null;
  if (result.kind !== 'syntax') return null;
  const evaluate = options.evaluate ?? (basicEvaluate as unknown as (input: string) => EvalResult<T>);

  const opens = countChar(input, '(');
  const closes = countChar(input, ')');
  if (opens === closes) return null;

  if (opens > closes) {
    const missing = opens - closes;
    const candidate = input + ')'.repeat(missing);
    const trial = evaluate(candidate);
    if (trial.ok) {
      return {
        ok: true,
        value: trial.value,
        formatted: trial.formatted,
        correctedFrom: candidate,
        note:
          missing === 1
            ? 'Added a missing ")" at the end.'
            : `Added ${missing} missing ")" at the end.`,
      };
    }
    return null;
  }

  // More closes than opens: strip trailing `)` until balanced, then try again.
  let candidate = input;
  let stripped = 0;
  while (countChar(candidate, ')') > countChar(candidate, '(') && candidate.endsWith(')')) {
    candidate = candidate.slice(0, -1);
    stripped += 1;
  }
  if (stripped === 0) return null;
  const trial = evaluate(candidate);
  if (trial.ok) {
    return {
      ok: true,
      value: trial.value,
      formatted: trial.formatted,
      correctedFrom: candidate,
      note:
        stripped === 1
          ? 'Removed an extra ")" at the end.'
          : `Removed ${stripped} extra ")" at the end.`,
    };
  }
  return null;
}

function countChar(input: string, target: string): number {
  let count = 0;
  for (let i = 0; i < input.length; i += 1) {
    if (input[i] === target) count += 1;
  }
  return count;
}