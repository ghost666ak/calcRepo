import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePreferences } from '../preferences';

describe('usePreferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('defaults errorUx to "verbose"', () => {
    const { result } = renderHook(() => usePreferences());
    expect(result.current.preferences.errorUx).toBe('verbose');
  });

  it('updates errorUx and persists across remount', () => {
    const { result, unmount } = renderHook(() => usePreferences());
    act(() => {
      result.current.update({ errorUx: 'silent' });
    });
    expect(result.current.preferences.errorUx).toBe('silent');
    unmount();
    const remount = renderHook(() => usePreferences());
    expect(remount.result.current.preferences.errorUx).toBe('silent');
  });

  it('falls back to "verbose" when stored value is invalid', () => {
    window.localStorage.setItem(
      'calcRepo.preferences.v1',
      JSON.stringify({ errorUx: 'bogus' }),
    );
    const { result } = renderHook(() => usePreferences());
    expect(result.current.preferences.errorUx).toBe('verbose');
  });

  it('accepts each of the three ErrorUx values', () => {
    const { result } = renderHook(() => usePreferences());
    for (const value of ['highlight', 'silent', 'verbose'] as const) {
      act(() => {
        result.current.update({ errorUx: value });
      });
      expect(result.current.preferences.errorUx).toBe(value);
    }
  });
});