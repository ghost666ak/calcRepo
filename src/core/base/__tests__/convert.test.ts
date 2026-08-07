import { describe, expect, it } from 'vitest';
import { formatRational, formatFullRational, groupDigits } from '../convert';
import { parseBaseLiteral } from '../parse';
import { rational } from '../rational';

describe('base conversion', () => {
  it('converts integers across bases', () => {
    expect(formatFullRational(rational(255n, 1n), 16)).toBe('ff');
    expect(formatFullRational(rational(255n, 1n), 2)).toBe('11111111');
    expect(formatFullRational(rational(255n, 1n), 36)).toBe('73');
    expect(formatFullRational(rational(-13n, 1n), 2)).toBe('-1101');
  });

  it('converts signed fractions without floating-point loss', () => {
    const result = parseBaseLiteral('0.1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      const formatted = formatFullRational(result.value, 2);
      expect(formatted).toMatch(/^0\.0\(0011\)$/);
    }
  });

  it('detects repeating fractions and labels them', () => {
    // 1/3 is not directly parseable; build it manually.
    const rationalValue = rational(1n, 3n);
    const formatted = formatRational(rationalValue, 2, { maxFractionDigits: 20, groupDigits: 0 });
    expect(formatted.fraction).toContain('(');
    expect(formatted.repeating).toBe(true);
  });

  it('marks truncation when maxFractionDigits is reached', () => {
    const result = formatRational(rational(1n, 1024n), 2, { maxFractionDigits: 4, groupDigits: 0 });
    expect(result.truncated).toBe(true);
  });

  it('groups digits when requested', () => {
    expect(groupDigits('11111111', 4)).toBe('1111_1111');
    expect(groupDigits('-ff', 2)).toBe('-ff');
  });
});