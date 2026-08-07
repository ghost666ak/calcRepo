import { useCallback, useEffect, useMemo, useState } from 'react';
import { evaluate } from '../../core/expression';

export interface BasicHistoryEntry {
  readonly expression: string;
  readonly result: string;
}

export interface UseBasicCalculatorResult {
  readonly expression: string;
  readonly display: string;
  readonly error: string | null;
  readonly history: readonly BasicHistoryEntry[];
  readonly press: (value: string) => void;
  readonly clear: () => void;
  readonly backspace: () => void;
  readonly equals: () => void;
  readonly repeat: () => void;
  readonly copy: () => Promise<boolean>;
  readonly consumeLatestEntry: () => BasicHistoryEntry | null;
}

const MAX_HISTORY = 20;

const OPERATORS = new Set(['+', '-', '*', '/', '^', '%', '(', ')']);

export function useBasicCalculator(): UseBasicCalculatorResult {
  const [expression, setExpression] = useState('');
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<readonly BasicHistoryEntry[]>([]);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [lastExpression, setLastExpression] = useState<string | null>(null);
  const [latestEntry, setLatestEntry] = useState<BasicHistoryEntry | null>(null);

  const clear = useCallback(() => {
    setExpression('');
    setDisplay('0');
    setError(null);
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    setExpression((current) => {
      const next = current.slice(0, -1);
      setDisplay(next.length === 0 ? '0' : next);
      return next;
    });
  }, []);

  const pressDigit = useCallback((digit: string) => {
    setError(null);
    setExpression((current) => {
      const next = appendDigit(current, digit);
      setDisplay(next.length === 0 ? digit : next);
      return next;
    });
  }, []);

  const pressOperator = useCallback((op: string) => {
    setError(null);
    setExpression((current) => {
      const next = appendOperator(current, op);
      setDisplay(next);
      return next;
    });
  }, []);

  const pressDecimal = useCallback(() => {
    setError(null);
    setExpression((current) => {
      const next = appendDecimal(current);
      setDisplay(next === '0' ? '0.' : next);
      return next;
    });
  }, []);

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
        return result.formatted;
      }
      setError(result.message);
      setDisplay('Error');
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
    () => ({ expression, display, error, history, press, clear, backspace, equals, repeat, copy, consumeLatestEntry }),
    [expression, display, error, history, press, clear, backspace, equals, repeat, copy, consumeLatestEntry],
  );
}

function appendDigit(current: string, digit: string): string {
  if (current === '0') return digit;
  return current + digit;
}

function appendDecimal(current: string): string {
  if (current === '') return '0.';
  if (current.endsWith('.')) return current;
  const segments = current.split(/[-+*/^(%]/);
  const tail = segments[segments.length - 1] ?? '';
  if (tail.includes('.')) return current;
  if (tail === '') return current + '.';
  return current + '.';
}

function appendOperator(current: string, op: string): string {
  if (current === '' && (op === '+' || op === '-')) return op;
  if (current === '' && op === '(') return op;
  if (current === '') return '';
  const lastChar = current[current.length - 1] ?? '';
  if (lastChar === '.') return current;
  if (OPERATORS.has(lastChar) && lastChar !== ')') {
    return current.slice(0, -1) + op;
  }
  return current + op;
}