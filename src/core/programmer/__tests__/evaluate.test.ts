import { describe, expect, it } from 'vitest';
import { evaluateProgrammer } from '../evaluate';

describe('evaluateProgrammer', () => {
  it('parses plain decimal literals', () => {
    const result = evaluateProgrammer('42', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(42n);
  });

  it('parses 0x, 0b, 0o prefixes', () => {
    const hex = evaluateProgrammer('0xFF', { width: 16, signedness: 'unsigned' });
    expect(hex.ok).toBe(true);
    if (hex.ok) expect(hex.value.raw).toBe(255n);
    const bin = evaluateProgrammer('0b1010', { width: 8, signedness: 'unsigned' });
    expect(bin.ok).toBe(true);
    if (bin.ok) expect(bin.value.raw).toBe(10n);
    const oct = evaluateProgrammer('0o17', { width: 8, signedness: 'unsigned' });
    expect(oct.ok).toBe(true);
    if (oct.ok) expect(oct.value.raw).toBe(15n);
  });

  it('parses base#digits literals', () => {
    const result = evaluateProgrammer('16#FF + 2#1010', { width: 16, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(265n);
  });

  it('respects bitwise precedence (AND binds tighter than OR)', () => {
    const result = evaluateProgrammer('0b1100 | 0b1010 & 0b1111', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(0b1100n | (0b1010n & 0b1111n));
  });

  it('handles unary NOT and negation', () => {
    const result = evaluateProgrammer('~0', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(255n);
    const neg = evaluateProgrammer('-1', { width: 8, signedness: 'signed' });
    expect(neg.ok).toBe(true);
    if (neg.ok) expect(neg.value.raw).toBe(-1n);
  });

  it('rejects fractional operands', () => {
    const result = evaluateProgrammer('0.5 & 0xFF', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(false);
  });

  it('rejects digits above the base', () => {
    const result = evaluateProgrammer('2#3', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(false);
  });

  it('rejects mismatch on operand width', () => {
    // Both operands carry the configured width so this is mainly a regression guard.
    const result = evaluateProgrammer('0xFF & 0x0F', { width: 32, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(0x0Fn);
  });

  it('handles shifts and rotates', () => {
    const result = evaluateProgrammer('0b0001 << 2', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.raw).toBe(4n);
    const rot = evaluateProgrammer('0b0011 <<< 1', { width: 8, signedness: 'unsigned' });
    expect(rot.ok).toBe(true);
    if (rot.ok) expect(rot.value.raw).toBe(0b0110n);
  });

  it('reports overflow flag on signed overflow', () => {
    const result = evaluateProgrammer('127 + 1', { width: 8, signedness: 'signed' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.raw).toBe(-128n);
      expect(result.value.flags.overflow).toBe(true);
    }
  });

  it('reports carry flag on unsigned overrun', () => {
    const result = evaluateProgrammer('0xFF + 1', { width: 8, signedness: 'unsigned' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.raw).toBe(0n);
      expect(result.value.flags.carry).toBe(true);
    }
  });
});