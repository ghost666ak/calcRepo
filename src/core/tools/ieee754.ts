import { parseBaseLiteral } from '../base';

export interface Ieee754Fields {
  readonly width: 32 | 64;
  readonly sign: 0 | 1;
  readonly exponent: number;
  readonly mantissa: bigint;
  readonly signBit: bigint;
  readonly exponentBits: readonly boolean[];
  readonly mantissaBits: readonly boolean[];
  readonly hex: string;
  readonly binary: string;
  readonly decimal: number | 'Infinity' | '-Infinity' | 'NaN';
  readonly classified: 'zero' | 'subnormal' | 'normal' | 'infinity' | 'nan';
}

const MASK32 = 0xffffffffn;
const MASK64 = (1n << 64n) - 1n;

export function inspectIeee754(input: string, width: 32 | 64): Ieee754Fields | null {
  const parsed = parseBaseLiteral(input);
  if (!parsed.ok) return null;
  if (parsed.value.denominator !== 1n) return null;
  if (parsed.value.numerator < 0n) return null;
  const big = parsed.value.numerator;
  const maxBits = BigInt(width);
  const mask = width === 64 ? MASK64 : MASK32;
  const bits = big & mask;
  const sign = bits >> (maxBits - 1n);
  const expBits = Number((bits >> BigInt(width === 64 ? 52 : 23)) & ((1n << BigInt(width === 64 ? 11 : 8)) - 1n));
  const mantissaBits = width === 64 ? 52 : 23;
  const mantissa = bits & ((1n << BigInt(mantissaBits)) - 1n);
  const expMax = (1 << (width === 64 ? 11 : 8)) - 1;
  const expBias = (1 << (width === 64 ? 10 : 7)) - 1;
  const binary = bits.toString(2).padStart(width, '0');
  const signBit = sign === 1n ? 1n : 0n;

  const fraction = Number(mantissa) / (1 << mantissaBits);
  let decimal: number | 'Infinity' | '-Infinity' | 'NaN' = 0;
  let classified: Ieee754Fields['classified'] = 'normal';
  if (expBits === 0 && mantissa === 0n) {
    decimal = 0;
    classified = 'zero';
  } else if (expBits === 0) {
    decimal = (sign === 1n ? -1 : 1) * Math.pow(2, 1 - expBias) * fraction;
    classified = 'subnormal';
  } else if (expBits === expMax) {
    decimal = mantissa === 0n ? (sign === 1n ? '-Infinity' : 'Infinity') : 'NaN';
    classified = mantissa === 0n ? 'infinity' : 'nan';
  } else {
    decimal = (sign === 1n ? -1 : 1) * Math.pow(2, expBits - expBias) * (1 + fraction);
    classified = 'normal';
  }

  const exponentBits = Array.from({ length: width === 64 ? 11 : 8 }, (_, i) => Boolean((BigInt(expBits) >> (BigInt(width === 64 ? 11 : 8) - BigInt(i) - 1n)) & 1n));
  const mantissaBitArray = Array.from({ length: mantissaBits }, (_, i) => Boolean((mantissa >> (BigInt(mantissaBits) - BigInt(i) - 1n)) & 1n));

  const hex = width === 64
    ? bits.toString(16).padStart(16, '0').toUpperCase()
    : bits.toString(16).padStart(8, '0').toUpperCase();

  return {
    width,
    sign: sign === 1n ? 1 : 0,
    exponent: expBits,
    mantissa,
    signBit,
    exponentBits,
    mantissaBits: mantissaBitArray,
    hex,
    binary,
    decimal,
    classified,
  };
}

export function composeIeee754(width: 32 | 64, sign: 0 | 1, exponent: number, mantissa: bigint): string | null {
  if (sign !== 0 && sign !== 1) return null;
  const expBits = width === 64 ? 11 : 8;
  const mantissaBits = width === 64 ? 52 : 23;
  if (!Number.isInteger(exponent) || exponent < 0 || exponent >= (1 << expBits)) return null;
  const maxMantissa = (1n << BigInt(mantissaBits)) - 1n;
  if (mantissa < 0n || mantissa > maxMantissa) return null;
  const mask = width === 64 ? MASK64 : MASK32;
  const signPart = BigInt(sign) << BigInt(width - 1);
  const expPart = BigInt(exponent) << BigInt(mantissaBits);
  const mantissaPart = mantissa & maxMantissa;
  return ((signPart | expPart | mantissaPart) & mask).toString(16);
}
