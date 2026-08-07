import { useCallback, useEffect, useMemo, useState } from 'react';
import { evaluateScientific } from '../../core/scientific/evaluate';
import { autoCorrectParens } from '../../core/expression/autoCorrect';
import type { AngleUnit } from '../../core/types';
import { usePreferences } from '../../state/preferences';

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
}

const MAX_HISTORY = 20;

export function useScientificCalculator(): UseScientificCalculatorResult {
  const { preferences, update } = usePreferences();
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [errorPosition, setErrorPosition] = useState<number | null>(null);
  const [history, setHistory] = useState<readonly ScientificHistoryEntry[]>([]);
  const [memory, setMemory] = useState(0);

  const clear = useCallback(() => {
    setExpression('');
    setDisplay('0');
    setError(null);
    setErrorPosition(null);
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

  const appendText = useCallback((value: string) => {
    setError(null);
    setErrorPosition(null);
    setExpression((current) => {
      const next = current + value;
      setDisplay(next);
      return next;
    });
  }, []);

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
        setHistory((prev) => [{ expression: trimmed, result: result.formatted }, ...prev].slice(0, MAX_HISTORY));
        return result.formatted;
      }
      const corrected = autoCorrectParens<number>(trimmed, result, {
        evaluate: (input) => evaluateScientific(input, options),
      });
      if (corrected) {
        setDisplay(corrected.formatted);
        setHistory((prev) =>
          [{ expression: corrected.correctedFrom, result: corrected.formatted }, ...prev].slice(0, MAX_HISTORY),
        );
        setError(`${result.message} (auto-fixed: ${corrected.note})`);
        setErrorPosition(result.position ?? null);
        return corrected.formatted;
      }
      setError(result.message);
      setErrorPosition(result.position ?? null);
      setDisplay('Error');
      return trimmed;
    });
  }, [preferences.angleUnit, preferences.precisionDigits]);

  const press = useCallback(
    (value: string) => {
      if (/^[0-9.+\-*/^()%!,]$/.test(value) || /^[a-zA-Z]$/.test(value)) {
        return appendText(value);
      }
      if (value === '=') return equals();
      if (value === 'C') return clear();
      if (value === '⌫') return backspace();
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
    }),
    [
      expression,
      display,
      error,
      errorPosition,
      history,
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
    ],
  );
}