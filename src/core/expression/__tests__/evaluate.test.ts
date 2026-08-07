import { describe, expect, it } from 'vitest';
import { evaluate, formatNumber } from '../evaluate';

describe('basic evaluator', () => {
  it('respects operator precedence', () => {
    const result = evaluate('2+3*4');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(14);
  });

  it('handles parentheses', () => {
    const result = evaluate('(2+3)*4');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(20);
  });

  it('handles unary signs', () => {
    const result = evaluate('-5+5');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(0);
  });

  it('handles decimals', () => {
    const result = evaluate('1.5+2.5');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(4);
  });

  it('handles division by zero with a domain error', () => {
    const result = evaluate('1/0');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('domain');
      expect(result.message).toMatch(/division by zero/i);
    }
  });

  it('returns a syntax error for unmatched parentheses', () => {
    const result = evaluate('(2+3');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.hint ?? '').toBeTruthy();
    }
  });

  it('handles percent as a postfix divide-by-100', () => {
    const result = evaluate('50%');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(0.5);
  });

  it('handles power with caret', () => {
    const result = evaluate('2^3');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(8);
  });

  it('rejects unknown characters', () => {
    const result = evaluate('2 & 3');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('syntax');
  });

  it('formats numbers without FP noise', () => {
    const formatted = formatNumber(0.1 + 0.2);
    expect(formatted).toBe('0.3');
  });
});

describe('implicit multiplication + friendly errors', () => {
  it('treats a number followed by "(" as multiplication', () => {
    const result = evaluate('88(2)');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(176);
  });

  it('treats ")" followed by "(" as multiplication', () => {
    const result = evaluate('(1+2)(3+4)');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(21);
  });

  it('treats ")" followed by a number as multiplication', () => {
    const result = evaluate('(1+2)3');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(9);
  });

  it('treats a number followed by a parenthesised expression as multiplication', () => {
    const result = evaluate('2(3+4)');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(14);
  });

  it('still respects precedence inside implicit multiplication', () => {
    const result = evaluate('1 + 2(3+4)');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(15);
  });

  it('chained implicit multiplication stays correct', () => {
    const result = evaluate('2(3)(4)');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(24);
  });

  it('rejects two decimal points in one number', () => {
    const result = evaluate('8.5.5');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.hint ?? '').toMatch(/single decimal point/i);
    }
  });

  it('rejects an empty expression with a friendly message', () => {
    const result = evaluate('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/nothing to evaluate/i);
    }
  });

  it('rejects a trailing + operator with a friendly message', () => {
    const result = evaluate('2+');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/ends with an operator/i);
    }
  });

  it('rejects a trailing × operator with a friendly message', () => {
    const result = evaluate('2*');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/ends with/i);
    }
  });

  it('rejects a stray ")" with a friendly message', () => {
    const result = evaluate(')');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/unexpected/i);
    }
  });

  it('rejects a stray "%" with a friendly message', () => {
    const result = evaluate('%');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/stray/i);
    }
  });

  it('still rejects genuinely unmatched parentheses', () => {
    const result = evaluate('(2+3');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('syntax');
  });
});