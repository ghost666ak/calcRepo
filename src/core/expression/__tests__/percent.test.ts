import { describe, expect, it } from 'vitest';
import { evaluate } from '../evaluate';

describe('basic percent operator', () => {
  it('computes 50% as 0.5', () => {
    const result = evaluate('50%');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(0.5);
  });

  it('computes 200 + 10% as 200 + 0.1', () => {
    const result = evaluate('200+10%');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(200.1);
  });

  it('allows repeated percent application', () => {
    const result = evaluate('50%%');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(0.005);
  });
});