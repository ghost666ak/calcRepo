import type { Rational } from './rational';
import { MAX_BASE, MIN_BASE } from './parse';

export interface ConvertOptions {
  readonly maxFractionDigits: number;
  readonly groupDigits: number;
}

export const DEFAULT_CONVERT_OPTIONS: ConvertOptions = {
  maxFractionDigits: 64,
  groupDigits: 0,
};

export interface ConvertResult {
  readonly integer: string;
  readonly fraction: string;
  readonly truncated: boolean;
  readonly repeating: boolean;
}

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

function assertBase(base: number): void {
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) {
    throw new Error(`Base must be an integer in [${MIN_BASE}, ${MAX_BASE}].`);
  }
}

function bigAbs(value: bigint): bigint {
  return value < 0n ? -value : value;
}

export function formatRational(
  value: Rational,
  targetBase: number,
  options: ConvertOptions = DEFAULT_CONVERT_OPTIONS,
): ConvertResult {
  assertBase(targetBase);
  const base = BigInt(targetBase);
  const negative = value.numerator < 0n;
  const absNumerator = bigAbs(value.numerator);
  const integerPart = absNumerator / value.denominator;
  const remainder = absNumerator % value.denominator;
  const integerDigits = integerPart === 0n ? '0' : bigintToString(integerPart, base, DIGITS);
  const fraction = formatFraction(remainder, value.denominator, base, options, DIGITS);
  const sign = negative ? '-' : '';
  return {
    integer: `${sign}${integerDigits}`,
    fraction: fraction.digits,
    truncated: fraction.truncated,
    repeating: fraction.repeating,
  };
}

function bigintToString(value: bigint, base: bigint, digits: string): string {
  if (value === 0n) return '0';
  let remaining = value;
  let output = '';
  while (remaining > 0n) {
    const index = Number(remaining % base);
    output = digits[index]! + output;
    remaining = remaining / base;
  }
  return output;
}

interface FractionResult {
  digits: string;
  truncated: boolean;
  repeating: boolean;
}

function formatFraction(
  numerator: bigint,
  denominator: bigint,
  base: bigint,
  options: ConvertOptions,
  digits: string,
): FractionResult {
  if (numerator === 0n) return { digits: '', truncated: false, repeating: false };
  let remainder = numerator;
  const seen = new Map<bigint, number>();
  let output = '';
  let truncated = false;
  let index = 0;
  while (remainder !== 0n && index < options.maxFractionDigits) {
    const prior = seen.get(remainder);
    if (prior !== undefined) {
      return { digits: output.slice(0, prior) + '(' + output.slice(prior) + ')', truncated: false, repeating: true };
    }
    seen.set(remainder, index);
    remainder = remainder * base;
    const digit = Number(remainder / denominator);
    remainder = remainder % denominator;
    output += digits[digit];
    index += 1;
  }
  if (remainder !== 0n) {
    truncated = true;
  }
  return { digits: output, truncated, repeating: false };
}

export function formatFullRational(value: Rational, targetBase: number, options: ConvertOptions = DEFAULT_CONVERT_OPTIONS): string {
  const formatted = formatRational(value, targetBase, options);
  if (!formatted.fraction) return formatted.integer;
  return `${formatted.integer}.${formatted.fraction}`;
}

export function groupDigits(value: string, groupSize: number): string {
  if (groupSize <= 0) return value;
  let sign = '';
  let body = value;
  if (body.startsWith('-')) {
    sign = '-';
    body = body.slice(1);
  }
  const dot = body.indexOf('.');
  let intPart = dot === -1 ? body : body.slice(0, dot);
  const fracPart = dot === -1 ? '' : body.slice(dot);
  const grouped: string[] = [];
  while (intPart.length > groupSize) {
    grouped.unshift(intPart.slice(-groupSize));
    intPart = intPart.slice(0, -groupSize);
  }
  if (intPart.length > 0) grouped.unshift(intPart);
  return `${sign}${grouped.join('_')}${fracPart}`;
}