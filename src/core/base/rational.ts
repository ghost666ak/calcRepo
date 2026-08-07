export interface Rational {
  readonly numerator: bigint;
  readonly denominator: bigint; // always positive
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x === 0n ? 1n : x;
}

function normalize(numerator: bigint, denominator: bigint): Rational {
  if (denominator === 0n) {
    throw new Error('Denominator must not be zero.');
  }
  const sign = denominator < 0n ? -1n : 1n;
  const n = numerator * sign;
  const d = denominator * sign;
  const g = gcd(n, d);
  return { numerator: n / g, denominator: d / g };
}

export function rational(numerator: bigint, denominator: bigint): Rational {
  return normalize(numerator, denominator);
}

export const ZERO: Rational = { numerator: 0n, denominator: 1n };
export const ONE: Rational = { numerator: 1n, denominator: 1n };

export function add(a: Rational, b: Rational): Rational {
  return normalize(
    a.numerator * b.denominator + b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function subtract(a: Rational, b: Rational): Rational {
  return normalize(
    a.numerator * b.denominator - b.numerator * a.denominator,
    a.denominator * b.denominator,
  );
}

export function multiply(a: Rational, b: Rational): Rational {
  return normalize(a.numerator * b.numerator, a.denominator * b.denominator);
}

export function divide(a: Rational, b: Rational): Rational {
  if (b.numerator === 0n) {
    throw new Error('Division by zero.');
  }
  return normalize(a.numerator * b.denominator, a.denominator * b.numerator);
}

export function negate(value: Rational): Rational {
  return { numerator: -value.numerator, denominator: value.denominator };
}

export function isZero(value: Rational): boolean {
  return value.numerator === 0n;
}

export function isNegative(value: Rational): boolean {
  return value.numerator < 0n;
}

export function compare(a: Rational, b: Rational): -1 | 0 | 1 {
  const lhs = a.numerator * b.denominator;
  const rhs = b.numerator * a.denominator;
  if (lhs < rhs) return -1;
  if (lhs > rhs) return 1;
  return 0;
}