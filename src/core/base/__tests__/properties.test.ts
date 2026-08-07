import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { formatFullRational } from '../convert';
import { parseBaseLiteral } from '../parse';
import { rational } from '../rational';
import { MIN_BASE, MAX_BASE } from '../parse';

function digitFor(value: number, base: number): string {
  return value.toString(base);
}

function decimalToBase(value: bigint, base: number): string {
  if (value === 0n) return '0';
  let remaining = value < 0n ? -value : value;
  const sign = value < 0n ? '-' : '';
  const digits: string[] = [];
  const b = BigInt(base);
  while (remaining > 0n) {
    const index = Number(remaining % b);
    digits.unshift(digitFor(index, base));
    remaining = remaining / b;
  }
  return sign + digits.join('');
}

describe('base conversion property tests', () => {
  it('round-trips integers between random bases', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }).map((n) => BigInt(n)),
        fc.integer({ min: MIN_BASE, max: MAX_BASE }),
        fc.integer({ min: MIN_BASE, max: MAX_BASE }),
        (value, sourceBase, targetBase) => {
          const encoded = decimalToBase(value, sourceBase);
          const parsed = parseBaseLiteral(encoded, sourceBase);
          expect(parsed.ok).toBe(true);
          if (parsed.ok) {
            expect(parsed.value.numerator).toBe(value);
            const formatted = formatFullRational(parsed.value, targetBase);
            const back = parseBaseLiteral(formatted, targetBase);
            expect(back.ok).toBe(true);
            if (back.ok) expect(back.value.numerator).toBe(value);
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  it('round-trips large integers that exceed Number.MAX_SAFE_INTEGER', () => {
    const cases = [
      2n ** 64n,
      2n ** 100n,
      -(2n ** 200n),
    ];
    for (const value of cases) {
      const encoded = decimalToBase(value, 16);
      const parsed = parseBaseLiteral(encoded, 16);
      expect(parsed.ok).toBe(true);
      if (parsed.ok) {
        expect(parsed.value.numerator).toBe(value);
        const formatted = formatFullRational(parsed.value, 10);
        expect(formatted).toBe(value.toString());
      }
    }
  });

  it('preserves rational identity for values with terminating representation in the target base', () => {
    // Only test integers for round-trip stability; fractions may be repeating/truncated.
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        fc.integer({ min: MIN_BASE, max: MAX_BASE }),
        (num, targetBase) => {
          const value = rational(BigInt(num), 1n);
          const formatted = formatFullRational(value, targetBase);
          const parsed = parseBaseLiteral(formatted, targetBase);
          expect(parsed.ok).toBe(true);
          if (parsed.ok) {
            expect(parsed.value.numerator).toBe(BigInt(num));
            expect(parsed.value.denominator).toBe(1n);
          }
        },
      ),
      { numRuns: 50 },
    );
  });
});