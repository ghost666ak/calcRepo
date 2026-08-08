import { describe, expect, it } from 'vitest';
import { evaluateScientific, DEFAULT_SCIENTIFIC_OPTIONS } from '../evaluate';
import type { ScientificOptions } from '../evaluate';

function withOverrides(overrides: Partial<ScientificOptions> = {}): ScientificOptions {
  return { ...DEFAULT_SCIENTIFIC_OPTIONS, ...overrides };
}

function valueOf(expression: string, options: ScientificOptions): number {
  const result = evaluateScientific(expression, options);
  if (!result.ok) throw new Error(`Unexpected error: ${result.message}`);
  return result.value;
}

describe('scientific function library', () => {
  it('evaluates power and root functions', () => {
    expect(valueOf('pow(2,10)', withOverrides())).toBe(1024);
    expect(valueOf('sqrt(144)', withOverrides())).toBe(12);
    expect(valueOf('cbrt(27)', withOverrides())).toBe(3);
  });

  it('evaluates log and exponential functions', () => {
    expect(valueOf('ln(e)', withOverrides())).toBeCloseTo(1, 10);
    expect(valueOf('log10(1000)', withOverrides())).toBe(3);
    expect(valueOf('log2(8)', withOverrides())).toBe(3);
    expect(valueOf('exp(0)', withOverrides())).toBe(1);
  });

  it('handles trigonometric identities in RAD mode', () => {
    const opts = withOverrides({ angleUnit: 'RAD' });
    expect(valueOf('sin(0)', opts)).toBe(0);
    expect(valueOf('cos(0)', opts)).toBe(1);
    expect(valueOf('sin(pi)', opts)).toBeCloseTo(0, 10);
    expect(valueOf('cos(pi)', opts)).toBeCloseTo(-1, 10);
  });

  it('handles trigonometric identities in DEG mode', () => {
    const opts = withOverrides({ angleUnit: 'DEG' });
    expect(valueOf('sin(180)', opts)).toBeCloseTo(0, 10);
    expect(valueOf('cos(60)', opts)).toBeCloseTo(0.5, 10);
    expect(valueOf('tan(45)', opts)).toBeCloseTo(1, 10);
  });

  it('handles trigonometric identities in GRAD mode', () => {
    const opts = withOverrides({ angleUnit: 'GRAD' });
    expect(valueOf('sin(200)', opts)).toBeCloseTo(0, 10);
    expect(valueOf('cos(100)', opts)).toBeCloseTo(0, 10);
  });

  it('round-trips inverse trigonometric functions', () => {
    const opts = withOverrides({ angleUnit: 'DEG' });
    const forward = valueOf('asin(0.5)', opts);
    expect(forward).toBeCloseTo(30, 6);
    const back = valueOf(`sin(${forward})`, opts);
    expect(back).toBeCloseTo(0.5, 6);
  });

  it('returns domain errors for invalid arguments', () => {
    expect(evaluateScientific('sqrt(-1)', withOverrides()).ok).toBe(false);
    expect(evaluateScientific('log10(0)', withOverrides()).ok).toBe(false);
    expect(evaluateScientific('asin(2)', withOverrides()).ok).toBe(false);
  });

  it('evaluates factorial, nPr, and nCr', () => {
    expect(valueOf('fact(5)', withOverrides())).toBe(120);
    expect(valueOf('nPr(5,2)', withOverrides())).toBe(20);
    expect(valueOf('nCr(5,2)', withOverrides())).toBe(10);
  });

  it('rejects out-of-range factorial inputs', () => {
    expect(evaluateScientific('fact(200)', withOverrides()).ok).toBe(false);
    expect(evaluateScientific('fact(-1)', withOverrides()).ok).toBe(false);
    expect(evaluateScientific('fact(2.5)', withOverrides()).ok).toBe(false);
  });

  it('evaluates hyperbolic functions', () => {
    expect(valueOf('sinh(0)', withOverrides())).toBe(0);
    expect(valueOf('cosh(0)', withOverrides())).toBe(1);
    expect(valueOf('tanh(0)', withOverrides())).toBe(0);
  });

  it('reports unknown function names with a syntax error', () => {
    const result = evaluateScientific('foo(1)', withOverrides());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('syntax');
  });

  it('respects configurable precision digits', () => {
    const result = evaluateScientific('sqrt(2)', withOverrides({ precisionDigits: 4 }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.formatted).toBe('1.4142');
  });
});

describe('scientific postfix factorial', () => {
  it('computes 5!', () => {
    expect(valueOf('5!', withOverrides())).toBe(120);
  });

  it('factorials a parenthesised expression', () => {
    expect(valueOf('(2+3)!', withOverrides())).toBe(120);
  });

  it('rejects factorial on negative input', () => {
    const result = evaluateScientific('(-1)!', withOverrides());
    expect(result.ok).toBe(false);
    // The scientific fact() helper returns a domain error; we accept either.
    if (!result.ok) expect(['syntax', 'domain']).toContain(result.kind);
  });

  it('rejects factorial on non-integer input', () => {
    const result = evaluateScientific('2.5!', withOverrides());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['syntax', 'domain']).toContain(result.kind);
  });

  it('rejects a stray "!" with a friendly message', () => {
    const result = evaluateScientific('!', withOverrides());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/Stray "!"\./);
  });
});

describe('scientific implicit multiplication + friendly errors', () => {
  it('treats a number followed by "(" as multiplication', () => {
    const result = evaluateScientific('88(2)', withOverrides());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(176);
  });

  it('treats ")" followed by "(" as multiplication', () => {
    const result = evaluateScientific('(1+2)(3+4)', withOverrides());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(21);
  });

  it('treats a constant followed by "(" as multiplication', () => {
    const result = evaluateScientific('pi(2)', withOverrides());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(Math.PI * 2, 10);
  });

  it('treats ")" followed by an identifier as multiplication', () => {
    const result = evaluateScientific('2pi', withOverrides());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeCloseTo(2 * Math.PI, 10);
  });

  it('rejects an empty expression with a friendly message', () => {
    const result = evaluateScientific('', withOverrides());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/nothing to evaluate/i);
    }
  });

  it('rejects a trailing operator with a friendly message', () => {
    const result = evaluateScientific('2+', withOverrides());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('syntax');
      expect(result.message).toMatch(/ends with an operator/i);
    }
  });
});