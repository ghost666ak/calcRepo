import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PreferencesProvider, usePreferences } from '../preferences';

function withProvider(): {
  Provider: ({ children }: { children: ReactNode }) => JSX.Element;
} {
  // renderHook doesn't auto-wrap; provide a wrapper that mounts the provider
  // around whatever hook the test wants to exercise.
  return {
    Provider: ({ children }) => <PreferencesProvider>{children}</PreferencesProvider>,
  };
}

describe('usePreferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('defaults errorUx to "verbose"', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => usePreferences(), { wrapper: Provider });
    expect(result.current.preferences.errorUx).toBe('verbose');
  });

  it('updates errorUx and persists across remount', () => {
    const { Provider } = withProvider();
    const { result, unmount } = renderHook(() => usePreferences(), { wrapper: Provider });
    act(() => {
      result.current.update({ errorUx: 'silent' });
    });
    expect(result.current.preferences.errorUx).toBe('silent');
    unmount();
    const remount = renderHook(() => usePreferences(), { wrapper: Provider });
    expect(remount.result.current.preferences.errorUx).toBe('silent');
  });

  it('falls back to clearAfterEquals=true when stored value is invalid', () => {
    window.localStorage.setItem(
      'calcRepo.preferences.v1',
      JSON.stringify({ clearAfterEquals: 'not-a-bool' }),
    );
    const { Provider } = withProvider();
    const { result } = renderHook(() => usePreferences(), { wrapper: Provider });
    expect(result.current.preferences.clearAfterEquals).toBe(true);
  });

  it('falls back to "verbose" when stored value is invalid', () => {
    window.localStorage.setItem(
      'calcRepo.preferences.v1',
      JSON.stringify({ errorUx: 'bogus' }),
    );
    const { Provider } = withProvider();
    const { result } = renderHook(() => usePreferences(), { wrapper: Provider });
    expect(result.current.preferences.errorUx).toBe('verbose');
  });

  it('accepts each of the three ErrorUx values', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => usePreferences(), { wrapper: Provider });
    for (const value of ['highlight', 'silent', 'verbose'] as const) {
      act(() => {
        result.current.update({ errorUx: value });
      });
      expect(result.current.preferences.errorUx).toBe(value);
    }
  });

  it('throws when used outside the provider (so missing wrapping is loud)', () => {
    expect(() => renderHook(() => usePreferences())).toThrow(/PreferencesProvider/);
  });

  it('defaults clearAfterEquals to true', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => usePreferences(), { wrapper: Provider });
    expect(result.current.preferences.clearAfterEquals).toBe(true);
  });

  it('updates clearAfterEquals and persists across remount', () => {
    const { Provider } = withProvider();
    const { result, unmount } = renderHook(() => usePreferences(), { wrapper: Provider });
    act(() => {
      result.current.update({ clearAfterEquals: false });
    });
    expect(result.current.preferences.clearAfterEquals).toBe(false);
    unmount();
    const remount = renderHook(() => usePreferences(), { wrapper: Provider });
    expect(remount.result.current.preferences.clearAfterEquals).toBe(false);
  });
});