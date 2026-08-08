import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { HistoryProvider, useHistory } from '../history';

function withProvider(): {
  Provider: ({ children }: { children: ReactNode }) => JSX.Element;
} {
  return {
    Provider: ({ children }) => <HistoryProvider>{children}</HistoryProvider>,
  };
}

describe('useHistory', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('does not record entries when disabled', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => useHistory(), { wrapper: Provider });
    act(() => {
      result.current.record({ kind: 'expression', expression: '1+1', result: '2', mode: 'basic' });
    });
    expect(result.current.entries).toEqual([]);
  });

  it('records entries when enabled and persists across remount', () => {
    const { Provider } = withProvider();
    const { result, unmount } = renderHook(() => useHistory(), { wrapper: Provider });
    act(() => {
      result.current.toggleEnabled();
    });
    act(() => {
      result.current.record({ kind: 'expression', expression: '1+1', result: '2', mode: 'basic' });
      result.current.record({ kind: 'expression', expression: '2+2', result: '4', mode: 'basic' });
    });
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.entries[0]?.expression).toBe('2+2');
    unmount();

    const second = renderHook(() => useHistory(), { wrapper: Provider });
    expect(second.result.current.entries).toHaveLength(2);
    expect(second.result.current.settings.enabled).toBe(true);
  });

  it('pins and removes entries', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => useHistory(), { wrapper: Provider });
    act(() => {
      result.current.toggleEnabled();
    });
    act(() => {
      result.current.record({ kind: 'expression', expression: '1+1', result: '2', mode: 'basic' });
    });
    const id = result.current.entries[0]?.id;
    expect(id).toBeDefined();
    act(() => {
      if (id) result.current.togglePin(id);
    });
    expect(result.current.entries[0]?.pinned).toBe(true);
    act(() => {
      if (id) result.current.remove(id);
    });
    expect(result.current.entries).toEqual([]);
  });

  it('keeps pinned entries when clearing', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => useHistory(), { wrapper: Provider });
    act(() => {
      result.current.toggleEnabled();
    });
    act(() => {
      result.current.record({ kind: 'expression', expression: '1+1', result: '2', mode: 'basic' });
    });
    const id = result.current.entries[0]?.id;
    act(() => {
      if (id) result.current.togglePin(id);
    });
    act(() => {
      result.current.record({ kind: 'expression', expression: '3+3', result: '6', mode: 'basic' });
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]?.pinned).toBe(true);
  });

  it('rejects invalid persisted entries on load', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key === 'calcRepo.history.entries.v1') {
        return JSON.stringify([{ id: 'a', expression: 'x', result: '1', mode: 'basic', createdAt: 0 }, { junk: true }]);
      }
      return null;
    });
    const { Provider } = withProvider();
    const { result } = renderHook(() => useHistory(), { wrapper: Provider });
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]?.id).toBe('a');
  });

  it('clamps the max entries setting', () => {
    const { Provider } = withProvider();
    const { result } = renderHook(() => useHistory(), { wrapper: Provider });
    act(() => {
      result.current.setMaxEntries(5000);
    });
    expect(result.current.settings.maxEntries).toBeLessThanOrEqual(1000);
  });
});
