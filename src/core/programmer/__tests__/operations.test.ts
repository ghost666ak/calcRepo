import { describe, expect, it } from 'vitest';
import {
  bitwiseAnd,
  bitwiseNot,
  bitwiseOr,
  bitwiseXor,
  integerModulo,
  modularAdd,
  modularSubtract,
  rotateLeft,
  rotateRight,
  shiftLeft,
  shiftRight,
} from '../operations';
import { fromBigInt } from '../word';

function value(raw: bigint, width: 8 | 16 | 32 | 64 = 32, signedness: 'unsigned' | 'signed' = 'unsigned') {
  const result = fromBigInt(raw, width, signedness);
  if (!result.ok) throw new Error('Setup failed');
  return result.value;
}

describe('bitwise operations', () => {
  it('computes AND, OR, XOR', () => {
    const a = value(0b1100n);
    const b = value(0b1010n);
    const and = bitwiseAnd(a, b);
    expect(and.ok).toBe(true);
    if (and.ok) expect(and.value.raw).toBe(0b1000n);
    const or = bitwiseOr(a, b);
    expect(or.ok).toBe(true);
    if (or.ok) expect(or.value.raw).toBe(0b1110n);
    const xor = bitwiseXor(a, b);
    expect(xor.ok).toBe(true);
    if (xor.ok) expect(xor.value.raw).toBe(0b0110n);
  });

  it('NOT inverts all bits modulo word width', () => {
    const a = value(0n, 8);
    const result = bitwiseNot(a);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(255n);
  });

  it('NOT in 16-bit returns 0xFFFF', () => {
    const a = value(0n, 16);
    const result = bitwiseNot(a);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(65535n);
  });

  it('NOT in signed 8-bit returns -1', () => {
    const a = value(0n, 8, 'signed');
    const result = bitwiseNot(a);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(-1n);
  });
});

describe('shifts and rotates', () => {
  it('shifts left and right', () => {
    const a = value(0b0001n, 8);
    const shift = value(2n, 8);
    const left = shiftLeft(a, shift);
    expect(left.ok).toBe(true);
    if (left.ok) expect(left.value.raw).toBe(0b0100n);
    const right = shiftRight(a, shift);
    expect(right.ok).toBe(true);
    if (right.ok) expect(right.value.raw).toBe(0b0000n);
  });

  it('detects overflow when shifting past the word width', () => {
    const a = value(0b1111n, 8, 'unsigned');
    const shift = value(5n, 8);
    const result = shiftLeft(a, shift);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.flags.overflow).toBe(true);
  });

  it('rotates left and right within the word width', () => {
    const a = value(0b0011n, 8);
    const shift = value(1n, 8);
    const rotatedLeft = rotateLeft(a, shift);
    expect(rotatedLeft.ok).toBe(true);
    if (rotatedLeft.ok) expect(rotatedLeft.value.raw).toBe(0b0110n);
    const rotatedRight = rotateRight(a, shift);
    expect(rotatedRight.ok).toBe(true);
    if (rotatedRight.ok) expect(rotatedRight.value.raw).toBe(0b10000001n);
  });
});

describe('modular arithmetic', () => {
  it('modular add wraps at word width', () => {
    const a = value(0xffn, 8);
    const b = value(0x02n, 8);
    const result = modularAdd(a, b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.raw).toBe(0x01n);
      expect(result.value.flags.carry).toBe(true);
    }
  });

  it('modular subtract sets overflow on signed underflow', () => {
    const a = value(-128n, 8, 'signed');
    const b = value(1n, 8, 'signed');
    const result = modularSubtract(a, b);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.raw).toBe(127n);
      expect(result.value.flags.overflow).toBe(true);
    }
  });

  it('modulo by zero is rejected', () => {
    const a = value(5n, 8);
    const b = value(0n, 8);
    const result = integerModulo(a, b);
    expect(result.ok).toBe(false);
  });

  it('modulo returns the remainder', () => {
    const a = value(10n, 8);
    const b = value(3n, 8);
    const result = integerModulo(a, b);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(1n);
  });
});