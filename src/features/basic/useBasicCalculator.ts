import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluate } from '../../core/expression';
import { autoCorrectParens } from '../../core/expression/autoCorrect';
import { usePreferences } from '../../state/preferences';

export interface BasicHistoryEntry {
  readonly expression: string;
  readonly result: string;
}

export interface UseBasicCalculatorResult {
  readonly expression: string;
  readonly display: string;
  readonly error: string | null;
  readonly errorPosition: number | null;
  readonly history: readonly BasicHistoryEntry[];
  readonly press: (value: string) => void;
  readonly clear: () => void;
  readonly backspace: () => void;
  readonly equals: () => void;
  readonly repeat: () => void;
  readonly copy: () => Promise<boolean>;
  readonly consumeLatestEntry: () => BasicHistoryEntry | null;
  /** Replace the current expression. Used by History → Reuse. */
  readonly seedWith: (value: string) => void;
}

const MAX_HISTORY = 20;

const OPERATORS = new Set(['+', '-', '*', '/', '^', '%', '(', ')', '!']);
// Binary operators are the ones that should "continue from the result" after
// an equals press. Unary operators (`(`, `!`) start a fresh sub-expression.
const BINARY_OPS = new Set(['+', '-', '*', '/', '^', '%']);

export function useBasicCalculator(): UseBasicCalculatorResult {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [errorPosition, setErrorPosition] = useState<number | null>(null);
  const [history, setHistory] = useState<readonly BasicHistoryEntry[]>([]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastExpression, setLastExpression] = useState<string | null>(null);
  const [latestEntry, setLatestEntry] = useState<BasicHistoryEntry | null>(null);
  const { preferences } = usePreferences();
  // Tracks whether the last action was a successful (or auto-corrected) equals.
  // When set, the next digit/decimal press resets the expression if the user
  // has opted into "Clear after equals". Operators intentionally ignore this
  // so pressing + after = still appends to the expression.
  const wasJustEvaluated = useRef(false);

  const clear = useCallback(() => {
    setExpression('');
    setDisplay('0');
    setError(null);
    setErrorPosition(null);
    wasJustEvaluated.current = false;
  }, []);

  const seedWith = useCallback((value: string) => {
    setError(null);
    setErrorPosition(null);
    setExpression(value);
    setDisplay(value.length === 0 ? '0' : value);
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setErrorPosition(null);
    setExpression((current) => {
      const next = current.slice(0, -1);
      setDisplay(next.length === 0 ? '0' : next);
      return next;
    });
  }, []);

  const pressDigit = useCallback((digit: string) => {
    setError(null);
    setErrorPosition(null);
    const shouldReset = wasJustEvaluated.current && preferences.clearAfterEquals;
    if (shouldReset) wasJustEvaluated.current = false;
    setExpression((current) => {
      const base = shouldReset ? '' : current;
      const next = appendDigit(base, digit);
      setDisplay(next.length === 0 ? digit : next);
      return next;
    });
  }, [preferences.clearAfterEquals]);

  const pressOperator = useCallback((op: string) => {
    setError(null);
    setErrorPosition(null);
    // After a successful equals:
    //   - A binary operator (`+`, `-`, `*`, `/`, `^`, `%`) continues from the
    //     result so the user can extend the calculation. e.g.
    //     `100*50%` = `50` × → `50 *`, not `100*50% *`.
    //   - A unary operator (`(`, `!`) starts a fresh sub-expression, so the
    //     user isn't dragging along stale tokens they didn't ask for. e.g.
    //     `2+3` = `5` ( → `(`, not `5(`.
    const fromResult =
      wasJustEvaluated.current && lastResult !== null && BINARY_OPS.has(op);
    const shouldReset = wasJustEvaluated.current && !BINARY_OPS.has(op);
    wasJustEvaluated.current = false;
    setExpression((current) => {
      const base = fromResult
        ? lastResult!
        : shouldReset
        ? ''
        : current;
      const next = appendOperator(base, op);
      setDisplay(next);
      return next;
    });
  }, [lastResult]);

  const pressDecimal = useCallback(() => {
    setError(null);
    setErrorPosition(null);
    const shouldReset = wasJustEvaluated.current && preferences.clearAfterEquals;
    if (shouldReset) wasJustEvaluated.current = false;
    setExpression((current) => {
      const base = shouldReset ? '' : current;
      const result = appendDecimal(base);
      if (!result.ok) {
        // The current number segment already has a decimal point. Surface an
        // inline error so the user knows the keystroke was rejected — the
        // silent-drop behaviour here was hiding a real typo (e.g. 5.5.5).
        setError('Number already has a decimal point.');
        setErrorPosition(base.length);
        setDisplay(base);
        return base;
      }
      setDisplay(result.value === '0' ? '0.' : result.value);
      return result.value;
    });
  }, [preferences.clearAfterEquals]);

  const equals = useCallback(() => {
    setExpression((current) => {
      const result = evaluate(current);
      if (result.ok) {
        setDisplay(result.formatted);
        setLastExpression(current);
        setLastResult(result.formatted);
        setHistory((prev) => {
          const entry: BasicHistoryEntry = { expression: current, result: result.formatted };
          return [entry, ...prev].slice(0, MAX_HISTORY);
        });
        setLatestEntry({ expression: current, result: result.formatted });
        // Mark "we just evaluated" so the next digit/decimal can reset if
        // the user has opted in. The visible expression stays put so the
        // question remains on screen — only the answer moves to the big display.
        wasJustEvaluated.current = true;
        return current;
      }
      // Attempt a safe auto-correction (e.g. "(2+3" → "(2+3)").
      const corrected = autoCorrectParens(current, result);
      if (corrected) {
        setDisplay(corrected.formatted);
        setLastExpression(corrected.correctedFrom);
        setLastResult(corrected.formatted);
        setHistory((prev) => {
          const entry: BasicHistoryEntry = {
            expression: corrected.correctedFrom,
            result: corrected.formatted,
          };
          return [entry, ...prev].slice(0, MAX_HISTORY);
        });
        setLatestEntry({ expression: corrected.correctedFrom, result: corrected.formatted });
        setError(`${result.message} (auto-fixed: ${corrected.note})`);
        setErrorPosition(result.position ?? null);
        // Auto-correct counts as an evaluation — the next digit/decimal should
        // also reset if the preference is on.
        wasJustEvaluated.current = true;
        return corrected.correctedFrom;
      }
      setError(result.message);
      setErrorPosition(result.position ?? null);
      setDisplay('Error');
      wasJustEvaluated.current = false;
      return current;
    });
  }, []);

  const press = useCallback(
    (value: string) => {
      if (/^[0-9]$/.test(value)) return pressDigit(value);
      if (value === '.') return pressDecimal();
      if (OPERATORS.has(value)) return pressOperator(value);
      if (value === '=') return equals();
      if (value === 'C') return clear();
      if (value === '⌫') return backspace();
    },
    [pressDigit, pressDecimal, pressOperator, equals, clear, backspace],
  );

  const repeat = useCallback(() => {
    if (lastResult === null || lastExpression === null) return;
    setError(null);
    const repeated = `${lastResult}+${lastResult}`;
    const result = evaluate(repeated);
    if (result.ok) {
      setExpression(result.formatted);
      setDisplay(result.formatted);
      setLastExpression(repeated);
      setLastResult(result.formatted);
      setHistory((prev) => [{ expression: repeated, result: result.formatted }, ...prev].slice(0, MAX_HISTORY));
      setLatestEntry({ expression: repeated, result: result.formatted });
    }
  }, [lastResult, lastExpression]);

  const copy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(display);
      return true;
    } catch {
      return false;
    }
  }, [display]);

  const consumeLatestEntry = useCallback(() => {
    const entry = latestEntry;
    setLatestEntry(null);
    return entry;
  }, [latestEntry]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const { key } = event;
      if (/^[0-9]$/.test(key)) {
        press(key);
        event.preventDefault();
      } else if (key === '.') {
        press('.');
        event.preventDefault();
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        press(key);
        event.preventDefault();
      } else if (key === '(' || key === ')') {
        press(key);
        event.preventDefault();
      } else if (key === '%') {
        press('%');
        event.preventDefault();
      } else if (key === '^') {
        press('^');
        event.preventDefault();
      } else if (key === '!') {
        // Factorial is a postfix operator in the parser (postfix); route to
        // press so it appends like other operators. Gives basic mode the
        // same factorial capability the scientific keypad has via the ! key.
        press('!');
        event.preventDefault();
      } else if (key === 'Enter' || key === '=') {
        equals();
        event.preventDefault();
      } else if (key === 'Backspace') {
        backspace();
        event.preventDefault();
      } else if (key === 'Escape') {
        clear();
        event.preventDefault();
      } else if (/^[a-zA-Z,]$/.test(key)) {
        // Letters and commas aren't valid in the basic expression. Surface
        // an inline error so the user knows the keystroke was rejected
        // instead of silently disappearing.
        setError(`Unexpected character "${key}"`);
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press, equals, backspace, clear]);

  return useMemo(
    () => ({ expression, display, error, errorPosition, history, press, clear, backspace, equals, repeat, copy, consumeLatestEntry, seedWith }),
    [expression, display, error, errorPosition, history, press, clear, backspace, equals, repeat, copy, consumeLatestEntry, seedWith],
  );
}

function appendDigit(current: string, digit: string): string {
  if (current === '0') return digit;
  return current + digit;
}

/** Result of trying to append a decimal point. `ok: false` means the current
 *  number segment already has one and the keystroke must be rejected. */
function appendDecimal(
  current: string,
): { ok: true; value: string } | { ok: false } {
  if (current === '') return { ok: true, value: '0.' };
  const segments = current.split(/[-+*/^(%]/);
  const tail = segments[segments.length - 1] ?? '';
  if (tail.includes('.')) return { ok: false };
  if (tail === '') return { ok: true, value: `${current}.` };
  return { ok: true, value: `${current}.` };
}

function appendOperator(current: string, op: string): string {
  if (current === '' && (op === '+' || op === '-')) return op;
  if (current === '' && op === '(') return op;
  if (current === '') return '';
  const lastChar = current[current.length - 1] ?? '';
  if (lastChar === '.') return current;
  // Collapse the trailing operator into the new one only when BOTH tokens are
  // binary operators — typing `2++` should yield `2+`, but `2-(` must stay
  // `2-(` so the user can build `2 - (3+5)`. Parens always append: dropping
  // the operator on `2×(` was how implicit multiplication worked before, but
  // it silently lost the user's `-`/`+` when grouping after a subtraction.
  if (BINARY_OPS.has(lastChar) && BINARY_OPS.has(op)) {
    return current.slice(0, -1) + op;
  }
  return current + op;
}