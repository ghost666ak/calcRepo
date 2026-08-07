export interface UnicodeResult {
  readonly ok: true;
  readonly codepoint: number;
  readonly utf8: readonly number[];
  readonly utf16: readonly number[];
  readonly name: string;
}

export interface UnicodeFailure {
  readonly ok: false;
  readonly error: { message: string; hint: string };
}

export type UnicodeError = {
  readonly message: string;
  readonly hint: string;
};

const UTF8_ENCODER = new TextEncoder();
const UTF8_DECODER = new TextDecoder('utf-8', { fatal: true });

export function encodeUnicode(input: string): UnicodeResult | UnicodeFailure {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { message: 'Input is empty.', hint: 'Enter a single Unicode character or a code point.' } };
  }
  // Try first as a literal character.
  if ([...trimmed].length === 1) {
    const codepoint = trimmed.codePointAt(0);
    if (codepoint === undefined) {
      return { ok: false, error: { message: 'Unable to read code point.', hint: 'Try entering a single Latin character.' } };
    }
    return buildResult(codepoint);
  }
  // Try as hex/U+xxxx notation.
  const match = /^(?:U\+|0x|\\u)?([0-9A-Fa-f]{1,6})$/.exec(trimmed);
  if (match && match[1]) {
    const value = Number.parseInt(match[1], 16);
    if (!Number.isFinite(value) || value < 0 || value > 0x10ffff) {
      return { ok: false, error: { message: 'Code point is out of range.', hint: 'Use a value between 0x0 and 0x10FFFF.' } };
    }
    return buildResult(value);
  }
  // Try as decimal.
  const decimal = /^\d+$/.exec(trimmed);
  if (decimal) {
    const value = Number.parseInt(trimmed, 10);
    if (value < 0 || value > 0x10ffff) {
      return { ok: false, error: { message: 'Code point is out of range.', hint: 'Use a value between 0 and 1114111.' } };
    }
    return buildResult(value);
  }
  return { ok: false, error: { message: 'Unrecognized Unicode input.', hint: 'Use a character, U+XXXX, 0xXXXX, or a decimal value.' } };
}

function buildResult(codepoint: number): UnicodeResult {
  const chars = String.fromCodePoint(codepoint);
  const utf8 = Array.from(UTF8_ENCODER.encode(chars));
  const utf16 = utf16Units(codepoint);
  return { ok: true, codepoint, utf8, utf16, name: nameFor(codepoint) };
}

function utf16Units(codepoint: number): number[] {
  if (codepoint <= 0xffff) return [codepoint];
  const high = 0xd800 + ((codepoint - 0x10000) >> 10);
  const low = 0xdc00 + ((codepoint - 0x10000) & 0x3ff);
  return [high, low];
}

export function decodeUtf8(bytes: readonly number[]): UnicodeResult | UnicodeFailure {
  if (bytes.length === 0) {
    return { ok: false, error: { message: 'Byte input is empty.', hint: 'Provide one or more byte values (0-255).' } };
  }
  for (const byte of bytes) {
    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      return { ok: false, error: { message: `Invalid byte value ${byte}.`, hint: 'Use integers between 0 and 255.' } };
    }
  }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    const decoded = decoder.decode(new Uint8Array(bytes));
    if (decoded.length === 0) {
      return { ok: false, error: { message: 'Decoded string is empty.', hint: 'Check the byte sequence.' } };
    }
    const codepoint = decoded.codePointAt(0);
    if (codepoint === undefined) {
      return { ok: false, error: { message: 'Unable to read code point.', hint: 'Try a different byte sequence.' } };
    }
    return buildResult(codepoint);
  } catch {
    return { ok: false, error: { message: 'Invalid UTF-8 sequence.', hint: 'Verify the byte values and try again.' } };
  }
}

export function toHex(value: number, digits: number): string {
  return value.toString(16).padStart(digits, '0').toUpperCase();
}

let NAMED: Record<number, string> | null = null;

function nameFor(codepoint: number): string {
  if (codepoint >= 0xd800 && codepoint <= 0xdfff) return '<surrogate>';
  if (NAMED === null) NAMED = buildNameTable();
  return NAMED[codepoint] ?? 'U+' + codepoint.toString(16).toUpperCase();
}

function buildNameTable(): Record<number, string> {
  const table: Record<number, string> = {
    0x09: 'CHARACTER TABULATION',
    0x0a: 'LINE FEED',
    0x0d: 'CARRIAGE RETURN',
    0x20: 'SPACE',
    0x21: 'EXCLAMATION MARK',
    0x2a: 'ASTERISK',
    0x2f: 'SOLIDUS',
    0x30: 'DIGIT ZERO',
    0x39: 'DIGIT NINE',
    0x41: 'LATIN CAPITAL LETTER A',
    0x5a: 'LATIN CAPITAL LETTER Z',
    0x61: 'LATIN SMALL LETTER A',
    0x7a: 'LATIN SMALL LETTER Z',
    0xa0: 'NO-BREAK SPACE',
    0xa9: 'COPYRIGHT SIGN',
    0xae: 'REGISTERED SIGN',
    0x2122: 'TRADE MARK SIGN',
    0x20ac: 'EURO SIGN',
  };
  return table;
}

export function utf8Bytes(input: string): readonly number[] {
  return Array.from(UTF8_ENCODER.encode(input));
}

export function fromUtf8Bytes(bytes: readonly number[]): string {
  return UTF8_DECODER.decode(new Uint8Array(bytes));
}
