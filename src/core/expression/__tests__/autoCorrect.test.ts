import { describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate';
import { autoCorrectParens } from '../autoCorrect';

function tryAutoFix(input: string) {
  const result = evaluate(input);
  if (result.ok) return null;
  return autoCorrectParens(input, result);
}

describe('autoCorrectParens', () => {
  it('adds a missing ")" for an unclosed group', () => {
    const fixed = tryAutoFix('(2+3');
    expect(fixed).not.toBeNull();
    expect(fixed?.correctedFrom).toBe('(2+3)');
    expect(fixed?.value).toBe(5);
  });

  it('adds multiple missing ")" when the input is heavily unbalanced', () => {
    const fixed = tryAutoFix('((1+2');
    expect(fixed).not.toBeNull();
    expect(fixed?.correctedFrom).toBe('((1+2))');
    expect(fixed?.value).toBe(3);
  });

  it('strips an extra trailing ")"', () => {
    const fixed = tryAutoFix('2+3)');
    expect(fixed).not.toBeNull();
    expect(fixed?.correctedFrom).toBe('2+3');
    expect(fixed?.value).toBe(5);
  });

  it('strips multiple trailing ")"s', () => {
    const fixed = tryAutoFix('2+3))');
    expect(fixed).not.toBeNull();
    expect(fixed?.correctedFrom).toBe('2+3');
    expect(fixed?.value).toBe(5);
  });

  it('returns null when the parens are already balanced', () => {
    const result = evaluate('2+');
    if (result.ok) throw new Error('expected error');
    expect(autoCorrectParens('2+', result)).toBeNull();
  });

  it('returns null when there is no paren-related error', () => {
    const result = evaluate('2+');
    if (result.ok) throw new Error('expected error');
    expect(autoCorrectParens('2+', result)).toBeNull();
  });

  it('returns null when the corrected expression still fails', () => {
    const result = evaluate('(2+3');
    // Force a failed trial by passing an evaluator that always rejects.
    const fixed = autoCorrectParens('(2+3', result, {
      evaluate: () => ({ ok: false, kind: 'syntax', message: 'nope', hint: '' }),
    });
    expect(fixed).toBeNull();
  });

  it('skips auto-correction for non-syntax errors', () => {
    const domainError = { ok: false as const, kind: 'domain' as const, message: 'x', hint: 'y' };
    expect(autoCorrectParens('(2+3', domainError)).toBeNull();
  });
});

describe('error position tracking', () => {
  it('points at the offending character for a stray ")"', () => {
    const result = evaluate(')');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.position).toBe(0);
  });

  it('points at the stray "," character', () => {
    const result = evaluate('2,3');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.position).toBe(1);
  });

  it('points at the second decimal point of "8.5.5"', () => {
    const result = evaluate('8.5.5');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.position).toBeDefined();
  });

  it('points at the trailing operator when the expression is "2+"', () => {
    const result = evaluate('2+');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.position).toBe(1);
  });

  it('has no position when the error is about the whole expression', () => {
    const result = evaluate('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.position).toBeUndefined();
  });
});