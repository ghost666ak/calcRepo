import type { Rational } from './rational';
import { rational } from './rational';

export const MIN_BASE = 2;
export const MAX_BASE = 36;

const DIGIT_PATTERN = /^[0-9a-zA-Z]+$/;

export interface BaseParseError {
  readonly message: string;
  readonly hint: string;
}

export type BaseParseResult = { ok: true; value: Rational } | { ok: false; error: BaseParseError };

export interface BaseLiteral {
  readonly text: string;
  readonly base: number;
}

function digitValue(ch: string): number {
  if (ch >= '0' && ch <= '9') return ch.charCodeAt(0) - 48;
  if (ch >= 'a' && ch <= 'z') return ch.charCodeAt(0) - 87;
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return -1;
}

function stripPrefix(value: string): { base: number; digits: string; prefix: 'plain' | 'binary' | 'octal' | 'hex' } {
  const lower = value.toLowerCase();
  if (lower.startsWith('0b')) return { base: 2, digits: value.slice(2), prefix: 'binary' };
  if (lower.startsWith('0o')) return { base: 8, digits: value.slice(2), prefix: 'octal' };
  if (lower.startsWith('0x')) return { base: 16, digits: value.slice(2), prefix: 'hex' };
  return { base: 10, digits: value, prefix: 'plain' };
}

export function detectBaseLiteral(input: string): BaseLiteral | null {
  const match = input.match(/^(\d+)#([0-9a-zA-Z._-]+)$/);
  if (!match || match[2] === undefined) return null;
  const base = Number(match[1]);
  if (!Number.isInteger(base) || base < MIN_BASE || base > MAX_BASE) return null;
  return { base, text: match[2] };
}

export function parseBaseLiteral(input: string, explicitBase?: number): BaseParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { message: 'Value is empty.', hint: 'Enter digits, optionally prefixed with the base.' } };
  }
  let sign = 1n;
  let body = trimmed;
  if (body[0] === '-') {
    sign = -1n;
    body = body.slice(1);
  } else if (body[0] === '+') {
    body = body.slice(1);
  }
  let base: number;
  let digitPart = body;
  if (explicitBase !== undefined) {
    if (!Number.isInteger(explicitBase) || explicitBase < MIN_BASE || explicitBase > MAX_BASE) {
      return {
        ok: false,
        error: {
          message: `Base must be an integer between ${MIN_BASE} and ${MAX_BASE}.`,
          hint: `Choose a base in [${MIN_BASE}, ${MAX_BASE}].`,
        },
      };
    }
    base = explicitBase;
    if (digitPart.includes('#')) {
      return { ok: false, error: { message: 'Do not combine explicit base with a base# prefix.', hint: 'Use one notation per value.' } };
    }
  } else {
    const explicit = detectBaseLiteral(body);
    if (explicit) {
      base = explicit.base;
      let literalText = explicit.text;
      if (literalText.startsWith('-')) {
        sign = sign === 1n ? -1n : 1n;
        literalText = literalText.slice(1);
      } else if (literalText.startsWith('+')) {
        literalText = literalText.slice(1);
      }
      digitPart = literalText;
    } else {
      const stripped = stripPrefix(body);
      base = stripped.base;
      digitPart = stripped.digits;
    }
  }
  const digitOk = DIGIT_PATTERN.test(digitPart) || /^[0-9a-zA-Z]*\.?[0-9a-zA-Z]+$/.test(digitPart) || /^[0-9a-zA-Z]+\.?[0-9a-zA-Z]*$/.test(digitPart);
  if (!digitOk) {
    return { ok: false, error: { message: 'Invalid digit sequence.', hint: `Use 0-9 and a-z (case-insensitive); base ${base} allows digits up to value ${base - 1}.` } };
  }
  const dotIndex = digitPart.indexOf('.');
  const integerPart = dotIndex === -1 ? digitPart : digitPart.slice(0, dotIndex);
  const fractionalPart = dotIndex === -1 ? '' : digitPart.slice(dotIndex + 1);
  if (integerPart.length === 0 && fractionalPart.length === 0) {
    return { ok: false, error: { message: 'Value has no digits.', hint: 'Provide at least one digit.' } };
  }
  let numerator = 0n;
  let denominator = 1n;
  for (const ch of integerPart) {
    const value = digitValue(ch);
    if (value < 0 || value >= base) {
      return { ok: false, error: { message: `Digit "${ch}" is not valid in base ${base}.`, hint: `Base ${base} accepts digits 0–${(base - 1).toString(base === 16 ? 16 : 10)}.` } };
    }
    numerator = numerator * BigInt(base) + BigInt(value);
  }
  if (fractionalPart.length > 0) {
    let fraction = 0n;
    let power = 1n;
    for (const ch of fractionalPart) {
      const value = digitValue(ch);
      if (value < 0 || value >= base) {
        return { ok: false, error: { message: `Digit "${ch}" is not valid in base ${base}.`, hint: `Base ${base} accepts digits 0–${(base - 1).toString(base === 16 ? 16 : 10)}.` } };
      }
      fraction = fraction * BigInt(base) + BigInt(value);
      power = power * BigInt(base);
    }
    // Add the fractional part to the integer numerator scaled by the same denominator.
    numerator = numerator * power + fraction;
    denominator = power;
  }
  if (sign === -1n) numerator = -numerator;
  return { ok: true, value: rational(numerator, denominator) };
}