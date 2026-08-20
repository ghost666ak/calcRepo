import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { evaluateScientific } from '../../core/scientific/evaluate';
import { autoCorrectParens } from '../../core/expression/autoCorrect';
import type { AngleUnit } from '../../core/types';
import { usePreferences } from '../../state/preferences';

// Tokens that should "continue from the result" after an equals (so the
// user can keep calculating from the answer). Excludes unary parens —
// `(` after `=` starts a fresh sub-expression.
const CONTINUING_OPERATORS = new Set(['+', '-', '*', '/', '^', '%']);

export interface ScientificHistoryEntry {
  readonly expression: string;
  readonly result: string;
}

export interface UseScientificCalculatorResult {
  readonly expression: string;
  readonly display: string;
  readonly error: string | null;
  readonly errorPosition: number | null;
  readonly history: readonly ScientificHistoryEntry[];
  readonly consumeLatestEntry: () => ScientificHistoryEntry | null;
  readonly angleUnit: AngleUnit;
  readonly precisionDigits: number;
  readonly memory: number;
  readonly press: (value: string) => void;
  readonly clear: () => void;
  readonly backspace: () => void;
  readonly equals: () => void;
  readonly setAngleUnit: (unit: AngleUnit) => void;
  readonly setPrecisionDigits: (digits: number) => void;
  readonly memoryAdd: () => void;
  readonly memorySubtract: () => void;
  readonly memoryRecall: () => void;
  readonly memoryClear: () => void;
  /** Replace the current expression. Used by History → Reuse. */
  readonly seedWith: (value: string) => void;
}

const MAX_HISTORY = 20;

export function useScientificCalculator(): UseScientificCalculatorResult {
  const { preferences, update } = usePreferences();
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [errorPosition, setErrorPosition] = useState<number | null>(null);
  const [history, setHistory] = useState<readonly ScientificHistoryEntry[]>([]);
  // Latest entry is only consumed via setLatestEntry's callback (see
  // consumeLatestEntry); we never read the state value directly, so the
  // leading underscore silences @typescript-eslint/no-unused-vars.
  const [, setLatestEntry] = useState<ScientificHistoryEntry | null>(null);
  const [memory, setMemory] = useState(0);
  // Result of the most recent successful equals. Used by appendText to
  // continue from the answer when the user types a binary operator.
  const [lastResult, setLastResult] = useState<string | null>(null);
  // True iff the last action was a successful (or auto-corrected) equals.
  // While true, pressing a CONTINUING_OPERATORS token replaces the current
  // expression with lastResult before appending.
  const wasJustEvaluated = useRef(false);

  const clear = useCallback(() => {
    setExpression('');
    setDisplay('0');
    setError(null);
    setErrorPosition(null);
    setLastResult(null);
    wasJustEvaluated.current = false;
  }, []);

  const seedWith = useCallback((value: string) => {
    setError(null);
    setErrorPosition(null);
    setExpression(value);
    setDisplay(value.length === 0 ? '0' : value);
    setLastResult(null);
    wasJustEvaluated.current = false;
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setErrorPosition(null);
    wasJustEvaluated.current = false;
    setExpression((current) => {
      const next = current.slice(0, -1);
      setDisplay(next.length === 0 ? '0' : next);
      return next;
    });
  }, []);

  const appendText = useCallback((value: string) => {
    setError(null);
    setErrorPosition(null);
    // After a successful equals:
    //   - A binary operator (`+`, `-`, `*`, `/`, `^`, `%`) continues from the
    //     answer so the user can extend the calculation. e.g.
    //     `100*50%` = `50` × → `50 *`, not `100*50% *`.
    //   - Anything else (digits, parens, function tokens like `sin(`) starts
    //     a fresh sub-expression, so the user isn't dragging along stale
    //     tokens they didn't ask for. e.g. `2+3` = `5` sin → `sin(`, not
    //     `2+3sin(`.
    const fromResult =
      wasJustEvaluated.current && lastResult !== null && CONTINUING_OPERATORS.has(value);
    const shouldReset =
      wasJustEvaluated.current && !CONTINUING_OPERATORS.has(value);
    wasJustEvaluated.current = false;
    setExpression((current) => {
      const base = fromResult ? lastResult! : shouldReset ? '' : current;
      const next = base + value;
      setDisplay(next);
      return next;
    });
  }, [lastResult]);

  const equals = useCallback(() => {
    setExpression((current) => {
      const trimmed = current;
      const options = {
        maxLength: 4096,
        maxDepth: 256,
        angleUnit: preferences.angleUnit,
        precisionDigits: preferences.precisionDigits,
      };
      const result = evaluateScientific(trimmed, options);
      if (result.ok) {
        setDisplay(result.formatted);
        setLastResult(result.formatted);
        wasJustEvaluated.current = true;
        setHistory((prev) => [{ expression: trimmed, result: result.formatted }, ...prev].slice(0, MAX_HISTORY));
        setLatestEntry({ expression: trimmed, result: result.formatted });
        // Keep the question visible; only the answer moves to the big display.
        return trimmed;
      }
      const corrected = autoCorrectParens<number>(trimmed, result, {
        evaluate: (input) => evaluateScientific(input, options),
      });
      if (corrected) {
        setDisplay(corrected.formatted);
        setLastResult(corrected.formatted);
        wasJustEvaluated.current = true;
        setHistory((prev) =>
          [{ expression: corrected.correctedFrom, result: corrected.formatted }, ...prev].slice(0, MAX_HISTORY),
        );
        setLatestEntry({ expression: corrected.correctedFrom, result: corrected.formatted });
        setError(`${result.message} (auto-fixed: ${corrected.note})`);
        setErrorPosition(result.position ?? null);
        // Show the corrected expression so the user can see what was fixed.
        return corrected.correctedFrom;
      }
      setError(result.message);
      setErrorPosition(result.position ?? null);
      setDisplay('Error');
      wasJustEvaluated.current = false;
      setLastResult(null);
      return trimmed;
    });
  }, [preferences.angleUnit, preferences.precisionDigits]);

  const press = useCallback(
    (value: string) => {
      if (value === '=') return equals();
      if (value === 'C') return clear();
      if (value === '⌫') return backspace();
      // Anything else — single chars like "7" or "+", and multi-char
      // scientific tokens like "sin(", "asin(", "log2(" — appends to the
      // expression. The earlier single-char regex silently dropped the
      // scientific tokens, leaving the function buttons as no-ops.
      return appendText(value);
    },
    [appendText, equals, clear, backspace],
  );

  const setAngleUnit = useCallback(
    (unit: AngleUnit) => {
      update({ angleUnit: unit });
    },
    [update],
  );

  const setPrecisionDigits = useCallback(
    (digits: number) => {
      const clamped = Math.max(0, Math.min(64, Math.floor(digits)));
      update({ precisionDigits: clamped });
    },
    [update],
  );

  const memoryAdd = useCallback(() => {
    setMemory((current) => {
      const value = Number(display);
      return Number.isFinite(value) ? current + value : current;
    });
  }, [display]);

  const memorySubtract = useCallback(() => {
    setMemory((current) => {
      const value = Number(display);
      return Number.isFinite(value) ? current - value : current;
    });
  }, [display]);

  const memoryRecall = useCallback(() => {
    appendText(String(memory));
  }, [memory, appendText]);

  const memoryClear = useCallback(() => {
    setMemory(0);
  }, []);

  const consumeLatestEntry = useCallback((): ScientificHistoryEntry | null => {
    let captured: ScientificHistoryEntry | null = null;
    setLatestEntry((current) => {
      if (current) captured = current;
      return null;
    });
    return captured;
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const { key } = event;
      if (/^[0-9.+\-*/^()%!,]$/.test(key)) {
        press(key);
        event.preventDefault();
      } else if (/^[a-zA-Z]$/.test(key)) {
        press(key);
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
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press, equals, backspace, clear]);

  return useMemo(
    () => ({
      expression,
      display,
      error,
      errorPosition,
      history,
      consumeLatestEntry,
      angleUnit: preferences.angleUnit,
      precisionDigits: preferences.precisionDigits,
      memory,
      press,
      clear,
      backspace,
      equals,
      setAngleUnit,
      setPrecisionDigits,
      memoryAdd,
      memorySubtract,
      memoryRecall,
      memoryClear,
      seedWith,
    }),
    [
      expression,
      display,
      error,
      errorPosition,
      history,
      consumeLatestEntry,
      preferences.angleUnit,
      preferences.precisionDigits,
      memory,
      press,
      clear,
      backspace,
      equals,
      setAngleUnit,
      setPrecisionDigits,
      memoryAdd,
      memorySubtract,
      memoryRecall,
      memoryClear,
      seedWith,
    ],
  );
}