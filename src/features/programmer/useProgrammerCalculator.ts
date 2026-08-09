import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  evaluateProgrammer,
  formatProgrammer,
  WORD_WIDTHS,
  fromBigInt,
  type ProgrammerResult,
  type Signedness,
  type WordWidth,
} from '../../core/programmer';

export interface ProgrammerFlagsSnapshot {
  readonly overflow: boolean;
  readonly carry: boolean;
  readonly invalidBits: boolean;
}

export interface ProgrammerSnapshots {
  readonly bin: string;
  readonly oct: string;
  readonly dec: string;
  readonly hex: string;
  readonly raw: string;
  readonly flags: ProgrammerFlagsSnapshot;
}

export interface UseProgrammerCalculatorResult {
  readonly expression: string;
  readonly width: WordWidth;
  readonly signedness: Signedness;
  readonly result: ProgrammerSnapshots | null;
  readonly error: string | null;
  readonly hint: string | null;
  readonly setExpression: (value: string) => void;
  readonly setWidth: (width: WordWidth) => void;
  readonly setSignedness: (signedness: Signedness) => void;
  readonly clear: () => void;
  readonly backspace: () => void;
  readonly insert: (value: string) => void;
  readonly setOutputBase: (base: number) => void;
  readonly outputBase: number;
  readonly outputValue: string;
  readonly copy: () => Promise<boolean>;
}

export function useProgrammerCalculator(): UseProgrammerCalculatorResult {
  const [expression, setExpression] = useState('');
  const [width, setWidth] = useState<WordWidth>(32);
  const [signedness, setSignedness] = useState<Signedness>('unsigned');
  const [outputBase, setOutputBase] = useState<number>(16);

  const computed = useMemo<ProgrammerResult>(
    () => evaluateProgrammer(expression, { width, signedness }),
    [expression, width, signedness],
  );

  const snapshots = useMemo<ProgrammerSnapshots | null>(() => {
    if (!computed.ok) return null;
    const value = computed.value;
    return {
      bin: formatProgrammer(value, 2),
      oct: formatProgrammer(value, 8),
      dec: formatProgrammer(value, 10),
      hex: formatProgrammer(value, 16),
      raw: value.raw.toString(),
      flags: value.flags,
    };
  }, [computed]);

  const standalone = useMemo(() => {
    if (computed.ok) return null;
    const parsed = parseSingleDecimal(expression);
    if (parsed === null) return null;
    const result = fromBigInt(parsed, width, signedness);
    if (!result.ok) return null;
    return result.value;
  }, [computed, expression, width, signedness]);

  const outputValue = useMemo(() => {
    if (computed.ok) return formatProgrammer(computed.value, outputBase);
    if (standalone !== null) return formatProgrammer(standalone, outputBase);
    return '';
  }, [computed, standalone, outputBase]);

  const error = computed.ok ? null : computed.error.message;
  const hint = computed.ok ? null : computed.error.hint;

  const clear = useCallback(() => setExpression(''), []);

  const backspace = useCallback(() => {
    setExpression((current) => current.slice(0, -1));
  }, []);

  const insert = useCallback((value: string) => {
    setExpression((current) => current + value);
  }, []);

  const copy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(outputValue);
      return true;
    } catch {
      return false;
    }
  }, [outputValue]);

  // Keyboard support: Escape clears, Ctrl/Cmd+Enter copies the result, the
  // & | ^ ~ < > + - * / % keys route through `insert` when the input is not
  // focused (so the textbox still works for free-form typing).
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === 'Enter') {
          event.preventDefault();
          void copy();
        }
        return;
      }
      const target = event.target as HTMLElement | null;
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditable) return;
      if (event.key === 'Escape') {
        clear();
        event.preventDefault();
      } else if (event.key === 'Backspace') {
        backspace();
        event.preventDefault();
      } else if (event.key.length === 1 && /[&|^~+\-*/%()<>]/.test(event.key)) {
        insert(event.key);
        event.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clear, backspace, insert, copy]);

  return {
    expression,
    width,
    signedness,
    result: snapshots,
    error,
    hint,
    setExpression,
    setWidth,
    setSignedness,
    clear,
    backspace,
    insert,
    setOutputBase,
    outputBase,
    outputValue,
    copy,
  };
}

function parseSingleDecimal(expression: string): bigint | null {
  const trimmed = expression.trim();
  if (trimmed.length === 0) return null;
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return null;
  return BigInt(numeric);
}

export const PROGRAMMER_WIDTHS = WORD_WIDTHS;