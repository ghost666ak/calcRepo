import { describe, expect, it } from 'vitest';
import { lastTopLevelBinaryOp, needsContinuationBracket } from '../autoBracket';

describe('lastTopLevelBinaryOp', () => {
  it('returns null for a single literal', () => {
    expect(lastTopLevelBinaryOp('42')).toBeNull();
  });

  it('returns the only op in a flat expression', () => {
    expect(lastTopLevelBinaryOp('5+6')).toBe('+');
    expect(lastTopLevelBinaryOp('5*6')).toBe('*');
    expect(lastTopLevelBinaryOp('2^3')).toBe('^');
  });

  it('returns the last top-level op when several are present', () => {
    expect(lastTopLevelBinaryOp('5+6*2')).toBe('*');
    expect(lastTopLevelBinaryOp('5+6+2')).toBe('+');
    expect(lastTopLevelBinaryOp('1+2-3*4/5^6')).toBe('^');
  });

  it('ignores ops inside parens', () => {
    expect(lastTopLevelBinaryOp('(2+3)*4')).toBe('*');
    expect(lastTopLevelBinaryOp('2^(1+1)')).toBe('^');
    expect(lastTopLevelBinaryOp('((1+2)+3)')).toBeNull();
  });

  it('returns null for a postfix-only expression', () => {
    expect(lastTopLevelBinaryOp('100%')).toBeNull();
    expect(lastTopLevelBinaryOp('(2+3)!')).toBeNull();
  });

  it('handles the empty string', () => {
    expect(lastTopLevelBinaryOp('')).toBeNull();
  });
});

describe('needsContinuationBracket', () => {
  it('returns true when new op binds tighter than the previous last op', () => {
    expect(needsContinuationBracket('5+6', '*')).toBe(true);
    expect(needsContinuationBracket('5+6', '/')).toBe(true);
    expect(needsContinuationBracket('5*2', '^')).toBe(true);
    expect(needsContinuationBracket('2-3', '*')).toBe(true);
  });

  it('returns false when new op has equal precedence', () => {
    expect(needsContinuationBracket('5+6', '+')).toBe(false);
    expect(needsContinuationBracket('5+6', '-')).toBe(false);
    expect(needsContinuationBracket('5*6', '*')).toBe(false);
    expect(needsContinuationBracket('5*6', '/')).toBe(false);
  });

  it('returns false when new op has lower precedence', () => {
    expect(needsContinuationBracket('5*6', '+')).toBe(false);
    expect(needsContinuationBracket('5*6', '-')).toBe(false);
    expect(needsContinuationBracket('2^3', '*')).toBe(false);
    expect(needsContinuationBracket('2^3', '+')).toBe(false);
  });

  it('returns false when previous expression has no top-level op', () => {
    expect(needsContinuationBracket('42', '*')).toBe(false);
    expect(needsContinuationBracket('100%', '*')).toBe(false);
    expect(needsContinuationBracket('(2+3)', '*')).toBe(false);
  });

  it('looks through parens at the top-level last op', () => {
    expect(needsContinuationBracket('(2+3)*4', '+')).toBe(false);
    expect(needsContinuationBracket('(2+3)*4', '^')).toBe(true);
    // The top-level last op is `^` (postfix `+` is inside parens), so a
    // lower-precedence `*` joins as the new top-level op — no bracket.
    expect(needsContinuationBracket('2^(1+1)', '+')).toBe(false);
    expect(needsContinuationBracket('2^(1+1)', '*')).toBe(false);
  });

  it('returns false for non-binary newOps (functions, digits, parens)', () => {
    expect(needsContinuationBracket('5+6', 'sin(')).toBe(false);
    expect(needsContinuationBracket('5+6', '5')).toBe(false);
    expect(needsContinuationBracket('5+6', '(')).toBe(false);
  });
});