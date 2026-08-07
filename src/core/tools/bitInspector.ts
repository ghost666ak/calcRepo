import { parseBaseLiteral } from '../base';

export interface BitRow {
  readonly index: number;
  readonly value: 0 | 1;
}

export interface BitBreakdown {
  readonly width: number;
  readonly bits: readonly BitRow[];
  readonly groups: readonly BitRow[][];
  readonly source: string;
}

const GROUPING = [4, 4, 4, 4]; // 4 digits per nibble, 4 nibbles per group = 16-bit

function parseUnsigned(value: string): bigint | null {
  const parsed = parseBaseLiteral(value);
  if (!parsed.ok) return null;
  if (parsed.value.denominator !== 1n) return null;
  if (parsed.value.numerator < 0n) return null;
  return parsed.value.numerator;
}

export function inspectBits(value: string, width: number): BitBreakdown | null {
  if (!Number.isInteger(width) || width <= 0 || width > 64) return null;
  const n = parseUnsigned(value);
  if (n === null) return null;
  const mask = width === 64 ? (1n << 64n) - 1n : (1n << BigInt(width)) - 1n;
  const truncated = n & mask;
  const bits: BitRow[] = [];
  for (let i = 0; i < width; i += 1) {
    const bit = Number((truncated >> BigInt(width - i - 1)) & 1n);
    bits.push({ index: i, value: bit === 1 ? 1 : 0 });
  }
  const groups = splitIntoGroups(bits, GROUPING);
  return { width, bits, groups, source: truncated.toString() };
}

function splitIntoGroups(bits: readonly BitRow[], widths: readonly number[]): readonly BitRow[][] {
  const result: BitRow[][] = [];
  let index = 0;
  for (const w of widths) {
    if (index >= bits.length) break;
    const slice = bits.slice(index, Math.min(index + w, bits.length));
    if (slice.length > 0) result.push(slice);
    index += w;
  }
  if (index < bits.length) {
    result.push(bits.slice(index));
  }
  return result;
}

export function readBit(breakdown: BitBreakdown, position: number): 0 | 1 | null {
  if (position < 0 || position >= breakdown.width) return null;
  const row = breakdown.bits[position];
  return row ? row.value : null;
}

export function setBit(breakdown: BitBreakdown, position: number, value: 0 | 1): BitBreakdown | null {
  if (position < 0 || position >= breakdown.width) return null;
  const source = BigInt(breakdown.source);
  const width = BigInt(breakdown.width);
  const mask = width === 64n ? (1n << 64n) - 1n : (1n << width) - 1n;
  const bitValue = BigInt(value);
  const bitMask = (1n << (width - BigInt(position) - 1n)) & mask;
  const cleared = source & ~bitMask;
  const updated = (cleared | (bitValue << (width - BigInt(position) - 1n))) & mask;
  return inspectBits(updated.toString(), breakdown.width);
}

export function maskRange(width: number, start: number, end: number): bigint | null {
  if (!Number.isInteger(width) || width <= 0 || width > 64) return null;
  if (start < 0 || end < 0 || start >= width || end >= width || start > end) return null;
  let result = 0n;
  for (let i = start; i <= end; i += 1) {
    result |= 1n << BigInt(width - i - 1);
  }
  return result;
}
