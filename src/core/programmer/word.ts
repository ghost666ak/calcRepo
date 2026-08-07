export const WORD_WIDTHS = [8, 16, 32, 64] as const;
export type WordWidth = (typeof WORD_WIDTHS)[number];

export type Signedness = 'unsigned' | 'signed';

export interface ProgrammerError {
  readonly message: string;
  readonly hint: string;
}

export interface ProgrammerFlags {
  readonly overflow: boolean;
  readonly carry: boolean;
  readonly invalidBits: boolean;
}

export interface ProgrammerValue {
  readonly width: WordWidth;
  readonly signedness: Signedness;
  readonly bits: bigint; // unsigned masked representation in [0, 2^width)
  readonly raw: bigint; // raw signed BigInt the caller supplied (informational)
  readonly flags: ProgrammerFlags;
}

export type ProgrammerResult =
  | { ok: true; value: ProgrammerValue }
  | { ok: false; error: ProgrammerError };

const ZERO = 0n;
const ONE = 1n;

function maskFor(width: WordWidth): bigint {
  if (width === 64) return (ONE << 64n) - ONE;
  return (ONE << BigInt(width)) - ONE;
}
const MASKS: Record<WordWidth, bigint> = {
  8: maskFor(8),
  16: maskFor(16),
  32: maskFor(32),
  64: maskFor(64),
};

export function isWordWidth(value: number): value is WordWidth {
  return WORD_WIDTHS.includes(value as WordWidth);
}

export function isSignedWordWidth(value: number): value is WordWidth {
  return isWordWidth(value);
}

export function toMask(width: WordWidth): bigint {
  return MASKS[width];
}

export function signBit(width: WordWidth): bigint {
  return ONE << BigInt(width - 1);
}

export function minSigned(width: WordWidth): bigint {
  return -(ONE << (BigInt(width) - ONE));
}

export function maxSigned(width: WordWidth): bigint {
  return (ONE << (BigInt(width) - ONE)) - ONE;
}

export function maxUnsigned(width: WordWidth): bigint {
  return MASKS[width];
}

export function fromBigInt(
  raw: bigint,
  width: WordWidth,
  signedness: Signedness,
): ProgrammerResult {
  if (signedness === 'unsigned') {
    if (raw < 0n) {
      return {
        ok: false,
        error: {
          message: 'Negative values are not allowed in unsigned mode.',
          hint: 'Switch to signed mode or use a non-negative value.',
        },
      };
    }
    if (raw > maxUnsigned(width)) {
      return {
        ok: false,
        error: {
          message: `Value exceeds the maximum unsigned ${width}-bit value (${maxUnsigned(width)}).`,
          hint: `Use a value in [0, ${maxUnsigned(width)}].`,
        },
      };
    }
    return {
      ok: true,
      value: {
        width,
        signedness,
        bits: raw,
        raw,
        flags: { overflow: false, carry: false, invalidBits: false },
      },
    };
  }
  if (raw < minSigned(width) || raw > maxSigned(width)) {
    return {
      ok: false,
      error: {
        message: `Value ${raw} is outside signed ${width}-bit range [${minSigned(width)}, ${maxSigned(width)}].`,
        hint: `Use a value in [${minSigned(width)}, ${maxSigned(width)}].`,
      },
    };
  }
  const bits = raw < 0n ? (raw & toMask(width)) : raw;
  return {
    ok: true,
    value: {
      width,
      signedness,
      bits,
      raw,
      flags: { overflow: false, carry: false, invalidBits: false },
    },
  };
}

export function fromUnsignedBits(
  bits: bigint,
  width: WordWidth,
  signedness: Signedness,
): ProgrammerResult {
  const masked = bits & toMask(width);
  let raw = masked;
  if (signedness === 'signed' && (masked & signBit(width)) !== ZERO) {
    raw = masked - (ONE << BigInt(width));
  }
  const invalidBits = bits !== masked;
  const overflow = signedness === 'unsigned'
    ? bits < ZERO || bits > maxUnsigned(width)
    : raw < minSigned(width) || raw > maxSigned(width);
  return {
    ok: true,
    value: { width, signedness, bits: masked, raw, flags: { overflow, carry: false, invalidBits } },
  };
}

export function interpret(value: ProgrammerValue, signedness: Signedness): ProgrammerResult {
  if (signedness === value.signedness) {
    return { ok: true, value };
  }
  if (signedness === 'unsigned') {
    return { ok: true, value: { ...value, signedness } };
  }
  return fromUnsignedBits(value.bits, value.width, 'signed');
}

export function toNumber(value: ProgrammerValue): number {
  const minSafe = BigInt(Number.MIN_SAFE_INTEGER);
  const maxSafe = BigInt(Number.MAX_SAFE_INTEGER);
  if (value.raw < minSafe || value.raw > maxSafe) return Number.NaN;
  return Number(value.raw);
}

export function toString(value: ProgrammerValue, base: number): string {
  if (base < 2 || base > 36) {
    return value.bits.toString();
  }
  return value.bits.toString(base);
}
