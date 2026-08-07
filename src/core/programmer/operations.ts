import {
  fromBigInt,
  fromUnsignedBits,
  toMask,
  type ProgrammerResult,
  type ProgrammerValue,
  type WordWidth,
} from './word';

const ZERO = 0n;
const ONE = 1n;

function requireInteger(value: ProgrammerValue, op: string): ProgrammerResult | ProgrammerValue {
  if (value.raw !== BigInt(value.bits) && value.raw !== (value.bits - (ONE << BigInt(value.width)))) {
    // raw is exact; the only way to be non-integer is if the caller supplied a fractional,
    // which we already reject elsewhere. This is a safety net.
  }
  if (value.raw !== ZERO && value.raw !== BigInt(value.raw)) {
    return {
      ok: false,
      error: {
        message: `Operator "${op}" only accepts integer operands.`,
        hint: 'Use whole numbers (no decimal point) with bitwise operators.',
      },
    };
  }
  return value;
}

function combine(
  left: ProgrammerValue,
  right: ProgrammerValue,
  op: string,
  apply: (a: bigint, b: bigint, width: WordWidth) => { result: bigint; overflow: boolean; carry: boolean },
): ProgrammerResult {
  const checkLeft = requireInteger(left, op);
  if ('ok' in checkLeft && !checkLeft.ok) return checkLeft;
  const checkRight = requireInteger(right, op);
  if ('ok' in checkRight && !checkRight.ok) return checkRight;
  if (left.width !== right.width) {
    return {
      ok: false,
      error: {
        message: `Operand width mismatch: ${left.width}-bit vs ${right.width}-bit.`,
        hint: 'Use the same word width for both operands.',
      },
    };
  }
  const width = left.width;
  const { result, overflow, carry } = apply(left.bits, right.bits, width);
  const masked = result & toMask(width);
  const flags = { overflow, carry, invalidBits: false };
  const signedness = left.signedness;
  let raw = masked;
  if (signedness === 'signed' && (masked & (ONE << BigInt(width - 1))) !== ZERO) {
    raw = masked - (ONE << BigInt(width));
  }
  return { ok: true, value: { width, signedness, bits: masked, raw, flags } };
}

export function bitwiseAnd(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  return combine(left, right, '&', (a, b) => ({ result: a & b, overflow: false, carry: false }));
}

export function bitwiseOr(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  return combine(left, right, '|', (a, b) => ({ result: a | b, overflow: false, carry: false }));
}

export function bitwiseXor(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  return combine(left, right, '^', (a, b) => ({ result: a ^ b, overflow: false, carry: false }));
}

export function bitwiseNot(value: ProgrammerValue): ProgrammerResult {
  const result = (~value.bits) & toMask(value.width);
  let raw = result;
  if (value.signedness === 'signed' && (result & (ONE << BigInt(value.width - 1))) !== ZERO) {
    raw = result - (ONE << BigInt(value.width));
  }
  return {
    ok: true,
    value: { ...value, bits: result, raw, flags: { overflow: false, carry: false, invalidBits: false } },
  };
}

export function shiftLeft(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  if (right.raw < 0n) return shiftRight(left, negateRaw(right));
  const shift = Number(right.raw);
  if (!Number.isFinite(shift) || shift > left.width) {
    return {
      ok: false,
      error: {
        message: `Shift amount ${right.raw} is out of range.`,
        hint: `Use a shift amount in [0, ${left.width}].`,
      },
    };
  }
  const shifted = left.bits << BigInt(shift);
  const mask = toMask(left.width);
  const result = shifted & mask;
  const overflow = shift > 0 && shifted !== result;
  const carry = overflow;
  let raw = result;
  if (left.signedness === 'signed' && (result & (ONE << BigInt(left.width - 1))) !== ZERO) {
    raw = result - (ONE << BigInt(left.width));
  }
  return {
    ok: true,
    value: { ...left, bits: result, raw, flags: { overflow, carry, invalidBits: false } },
  };
}

export function shiftRight(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  if (right.raw < 0n) return shiftLeft(left, negateRaw(right));
  const shift = Number(right.raw);
  if (!Number.isFinite(shift) || shift > left.width) {
    return {
      ok: false,
      error: {
        message: `Shift amount ${right.raw} is out of range.`,
        hint: `Use a shift amount in [0, ${left.width}].`,
      },
    };
  }
  // Logical shift for unsigned, arithmetic shift for signed.
  const isLogical = left.signedness === 'unsigned';
  let result = left.bits >> BigInt(shift);
  if (!isLogical) {
    // arithmetic shift: sign-extend by sign bit replication
    const signBit = ONE << BigInt(left.width - 1);
    const isNegative = (left.bits & signBit) !== ZERO;
    if (isNegative) {
      const mask = ~((ONE << BigInt(left.width - shift)) - ONE);
      result = (result | mask) & toMask(left.width);
    }
  }
  let raw = result;
  if (left.signedness === 'signed' && (result & (ONE << BigInt(left.width - 1))) !== ZERO) {
    raw = result - (ONE << BigInt(left.width));
  }
  return {
    ok: true,
    value: { ...left, bits: result, raw, flags: { overflow: false, carry: false, invalidBits: false } },
  };
}

function negateRaw(value: ProgrammerValue): ProgrammerValue {
  const negated = fromBigInt(-value.raw, value.width, value.signedness);
  if (negated.ok) return negated.value;
  return value;
}

export function rotateLeft(value: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  if (right.raw < 0n) return rotateRight(value, negateRaw(right));
  const shift = Number(right.raw) % value.width;
  const mask = toMask(value.width);
  const width = BigInt(value.width);
  const safeShift = BigInt(shift);
  const result = ((value.bits << safeShift) | (value.bits >> (width - safeShift))) & mask;
  return fromUnsignedBits(result, value.width, value.signedness);
}

export function rotateRight(value: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  if (right.raw < 0n) return rotateLeft(value, negateRaw(right));
  const shift = Number(right.raw) % value.width;
  const mask = toMask(value.width);
  const width = BigInt(value.width);
  const safeShift = BigInt(shift);
  const result = ((value.bits >> safeShift) | (value.bits << (width - safeShift))) & mask;
  return fromUnsignedBits(result, value.width, value.signedness);
}

export function modularAdd(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  return combine(left, right, '+', (a, b, width) => {
    const result = a + b;
    const mask = toMask(width);
    const masked = result & mask;
    const signBit = ONE << BigInt(width - 1);
    const carry = (result >> BigInt(width)) !== ZERO;
    const signedOverflow = ((a & signBit) === (b & signBit)) && ((result & signBit) !== (a & signBit));
    const unsignedOverflow = result !== masked;
    return { result, overflow: signedOverflow || (left.signedness === 'unsigned' && unsignedOverflow), carry };
  });
}

export function modularSubtract(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  return combine(left, right, '-', (a, b, width) => {
    const result = a - b;
    const mask = toMask(width);
    const masked = result & mask;
    const signBit = ONE << BigInt(width - 1);
    const carry = (a & mask) < (b & mask);
    const signedOverflow = ((a & signBit) !== (b & signBit)) && ((result & signBit) !== (a & signBit));
    const unsignedOverflow = result !== masked;
    return { result, overflow: signedOverflow || (left.signedness === 'unsigned' && unsignedOverflow), carry };
  });
}

export function integerModulo(left: ProgrammerValue, right: ProgrammerValue): ProgrammerResult {
  if (right.bits === ZERO) {
    return {
      ok: false,
      error: { message: 'Modulo by zero.', hint: 'Use a non-zero divisor.' },
    };
  }
  const width = left.width;
  const result = left.bits % right.bits;
  let raw = result;
  if (left.signedness === 'signed' && (result & (ONE << BigInt(width - 1))) !== ZERO) {
    raw = result - (ONE << BigInt(width));
  }
  return { ok: true, value: { ...left, bits: result, raw, flags: { overflow: false, carry: false, invalidBits: false } } };
}
