import { describe, expect, it } from 'vitest';
import { parseBaseLiteral } from '../parse';

describe('base literal parser', () => {
  it('parses plain decimal integers', () => {
    const result = parseBaseLiteral('123');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.numerator).toBe(123n);
    if (result.ok) expect(result.value.denominator).toBe(1n);
  });

  it('parses 0b/0o/0x prefixes', () => {
    const binary = parseBaseLiteral('0b1010');
    expect(binary.ok).toBe(true);
    if (binary.ok) expect(binary.value.numerator).toBe(10n);
    const octal = parseBaseLiteral('0o17');
    expect(octal.ok && octal.value.numerator).toBe(15n);
    const hex = parseBaseLiteral('0xFF');
    expect(hex.ok && hex.value.numerator).toBe(255n);
  });

  it('parses arbitrary base#digits literals', () => {
    const base36 = parseBaseLiteral('36#Z');
    expect(base36.ok && base36.value.numerator).toBe(35n);
    const base3 = parseBaseLiteral('3#-1.1');
    expect(base3.ok).toBe(true);
    if (base3.ok) {
      expect(base3.value.numerator).toBe(-4n);
      expect(base3.value.denominator).toBe(3n);
    }
  });

  it('rejects digits above the base', () => {
    const result = parseBaseLiteral('2#3');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/not valid/i);
  });

  it('rejects empty values', () => {
    const result = parseBaseLiteral('  ');
    expect(result.ok).toBe(false);
  });

  it('parses signed fractions', () => {
    const result = parseBaseLiteral('-1.5');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.numerator).toBe(-3n);
      expect(result.value.denominator).toBe(2n);
    }
  });
});