import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CONVERT_OPTIONS,
  formatFullRational,
  groupDigits,
  MAX_BASE,
  MIN_BASE,
  parseBaseLiteral,
  type ConvertOptions,
} from '../../core/base';

export interface UseBaseConverterResult {
  readonly input: string;
  readonly sourceBase: number;
  readonly targetBase: number;
  /** Raw text in the source base input. Reflects the user's typing even when
   *  the value is currently invalid (out of range, decimal, etc.). */
  readonly sourceBaseDraft: string;
  readonly targetBaseDraft: string;
  /** null when the draft is empty or a valid integer in [MIN_BASE, MAX_BASE];
   *  a short human-readable message otherwise. */
  readonly sourceBaseError: string | null;
  readonly targetBaseError: string | null;
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
  readonly setSourceBase: (value: string) => void;
  readonly setTargetBase: (value: string) => void;
  readonly setSourceMaxFractionDigits: (value: number) => void;
  readonly setTargetGroupSize: (value: number) => void;
  readonly swap: () => void;
  readonly copy: () => Promise<boolean>;
}

export const PRESET_BASES = [2, 8, 10, 16] as const;

function isValidBase(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_BASE && value <= MAX_BASE;
}

/** Parse the user's raw text. Returns `null` for empty (so the field shows
 *  "no error"), the parsed integer when it's in range, or a flag indicating
 *  the value is invalid (out of range / not an integer). */
function parseBaseDraft(
  text: string,
): { kind: 'empty' } | { kind: 'valid'; value: number } | { kind: 'invalid' } {
  if (text === '') return { kind: 'empty' };
  // Reject anything that isn't a non-negative integer string — defends
  // against "2.5", " 4", "0x4", "-2", leading zeros like "02" being treated
  // as ambiguous, and stray characters.
  if (!/^[0-9]+$/.test(text)) return { kind: 'invalid' };
  const n = Number(text);
  if (!isValidBase(n)) return { kind: 'invalid' };
  return { kind: 'valid', value: n };
}

export function useBaseConverter(): UseBaseConverterResult {
  const [input, setInput] = useState('0');
  const [sourceBase, setSourceBase] = useState<number>(10);
  const [targetBase, setTargetBase] = useState<number>(16);
  const [sourceBaseDraft, setSourceBaseDraft] = useState('10');
  const [targetBaseDraft, setTargetBaseDraft] = useState('16');
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

  // Derive errors from the drafts. Empty is treated as "no input yet" (no
  // error); non-integer or out-of-range gets the same message so the user
  // sees a single consistent hint.
  const sourceBaseError = useMemo<string | null>(() => {
    const parsed = parseBaseDraft(sourceBaseDraft);
    if (parsed.kind !== 'invalid') return null;
    return `Base must be an integer from ${MIN_BASE} to ${MAX_BASE}.`;
  }, [sourceBaseDraft]);
  const targetBaseError = useMemo<string | null>(() => {
    const parsed = parseBaseDraft(targetBaseDraft);
    if (parsed.kind !== 'invalid') return null;
    return `Base must be an integer from ${MIN_BASE} to ${MAX_BASE}.`;
  }, [targetBaseDraft]);

  // When the user types a valid value, commit it. When the draft is invalid
  // or empty, keep the previous valid value so conversion still works.
  useEffect(() => {
    const parsed = parseBaseDraft(sourceBaseDraft);
    if (parsed.kind === 'valid') setSourceBase(parsed.value);
  }, [sourceBaseDraft]);
  useEffect(() => {
    const parsed = parseBaseDraft(targetBaseDraft);
    if (parsed.kind === 'valid') setTargetBase(parsed.value);
  }, [targetBaseDraft]);

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
    // Reset the drafts to the new numeric state so the inputs stay in sync.
    setSourceBaseDraft(String(targetBase));
    setTargetBaseDraft(String(sourceBase));
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
    sourceBaseDraft,
    targetBaseDraft,
    sourceBaseError,
    targetBaseError,
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
    setSourceBase: (value: string) => {
      setSourceBaseDraft(value);
      // For the preset buttons, also clear any error by setting the draft
      // directly to the canonical string representation.
      if (isValidBase(Number(value))) setSourceBaseDraft(String(Number(value)));
    },
    setTargetBase: (value: string) => {
      setTargetBaseDraft(value);
      if (isValidBase(Number(value))) setTargetBaseDraft(String(Number(value)));
    },
    setSourceMaxFractionDigits,
    setTargetGroupSize,
    swap,
    copy,
  };
}