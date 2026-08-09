import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CONVERT_OPTIONS,
  formatFullRational,
  groupDigits,
  parseBaseLiteral,
  type ConvertOptions,
} from '../../core/base';

export interface UseBaseConverterResult {
  readonly input: string;
  readonly sourceBase: number;
  readonly targetBase: number;
  readonly sourceOptions: ConvertOptions;
  readonly targetOptions: ConvertOptions;
  readonly maxFractionDigits: number;
  readonly groupSize: number;
  readonly output: string;
  readonly truncated: boolean;
  readonly repeating: boolean;
  readonly error: string | null;
  readonly hint: string | null;
  readonly setInput: (value: string) => void;
  readonly setSourceBase: (base: number) => void;
  readonly setTargetBase: (base: number) => void;
  readonly setSourceMaxFractionDigits: (value: number) => void;
  readonly setTargetGroupSize: (value: number) => void;
  readonly swap: () => void;
  readonly copy: () => Promise<boolean>;
}

export const PRESET_BASES = [2, 8, 10, 16] as const;

function isValidBase(value: number): boolean {
  return Number.isInteger(value) && value >= 2 && value <= 36;
}

export function useBaseConverter(): UseBaseConverterResult {
  const [input, setInput] = useState('0');
  const [sourceBase, setSourceBase] = useState<number>(10);
  const [targetBase, setTargetBase] = useState<number>(16);
  const [sourceMaxFractionDigits, setSourceMaxFractionDigits] = useState<number>(64);
  const [targetGroupSize, setTargetGroupSize] = useState<number>(4);

  const sourceOptions = useMemo<ConvertOptions>(
    () => ({ ...DEFAULT_CONVERT_OPTIONS, maxFractionDigits: sourceMaxFractionDigits }),
    [sourceMaxFractionDigits],
  );
  const targetOptions = useMemo<ConvertOptions>(
    () => ({ ...DEFAULT_CONVERT_OPTIONS, groupDigits: targetGroupSize }),
    [targetGroupSize],
  );

  const parsed = useMemo(() => parseBaseLiteral(input, sourceBase), [input, sourceBase]);

  const converted = useMemo(() => {
    if (!parsed.ok) return null;
    return formatFullRational(parsed.value, targetBase, sourceOptions);
  }, [parsed, targetBase, sourceOptions]);

  const grouped = useMemo(() => {
    if (converted === null) return '';
    return groupDigits(converted, targetGroupSize);
  }, [converted, targetGroupSize]);

  const flags = useMemo(() => {
    if (!parsed.ok || converted === null) return { truncated: false, repeating: false };
    const fractionPart = converted.split('.')[1] ?? '';
    if (fractionPart.includes('(')) return { truncated: false, repeating: true };
    return {
      truncated: parsed.value.denominator !== 1n && fractionPart.length > 0 && sourceMaxFractionDigits > 0,
      repeating: false,
    };
  }, [parsed, converted, sourceMaxFractionDigits]);

  const error = parsed.ok ? null : parsed.error.message;
  const hint = parsed.ok ? null : parsed.error.hint;

  const swap = useCallback(() => {
    if (converted === null) return;
    setInput(converted);
    setSourceBase(targetBase);
    setTargetBase(sourceBase);
  }, [converted, sourceBase, targetBase]);

  const copy = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    try {
      await navigator.clipboard.writeText(grouped);
      return true;
    } catch {
      return false;
    }
  }, [grouped]);

  // Keyboard shortcuts for the swap + copy buttons so power users don't have
  // to mouse to them. Esc swaps, Ctrl/Cmd+Enter copies. Skipped when the
  // number inputs are focused so users can keep typing freely.
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const isEditable = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isEditable) return;
      if (event.key === 'Escape') {
        swap();
        event.preventDefault();
      } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void copy();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [swap, copy]);

  return {
    input,
    sourceBase,
    targetBase,
    sourceOptions,
    targetOptions,
    maxFractionDigits: sourceMaxFractionDigits,
    groupSize: targetGroupSize,
    output: grouped,
    truncated: flags.truncated,
    repeating: flags.repeating,
    error,
    hint,
    setInput,
    setSourceBase: (base: number) => {
      if (isValidBase(base)) setSourceBase(base);
    },
    setTargetBase: (base: number) => {
      if (isValidBase(base)) setTargetBase(base);
    },
    setSourceMaxFractionDigits,
    setTargetGroupSize,
    swap,
    copy,
  };
}