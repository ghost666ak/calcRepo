import { useCallback, useEffect, useRef } from 'react';
import type { CalculatorMode } from '../core/modes';

export interface UrlSyncState {
  readonly mode?: CalculatorMode | undefined;
  readonly settings: boolean;
  readonly history: boolean;
}

const VALID_MODES: readonly CalculatorMode[] = ['basic', 'scientific', 'base', 'programmer', 'tools'];

function parseSearch(search: string): URLSearchParams {
  // URLSearchParams handles leading "?" gracefully but be defensive.
  return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
}

function readState(search: string): UrlSyncState {
  const params = parseSearch(search);
  const rawMode = params.get('mode');
  const mode = VALID_MODES.includes(rawMode as CalculatorMode)
    ? (rawMode as CalculatorMode)
    : undefined;
  return {
    mode,
    settings: params.has('settings') && params.get('settings') !== 'false',
    history: params.has('history') && params.get('history') !== 'false',
  };
}

function writeState(state: Partial<UrlSyncState>): string {
  const params = new URLSearchParams();
  if (state.mode) params.set('mode', state.mode);
  if (state.settings) params.set('settings', 'open');
  if (state.history) params.set('history', 'open');
  const str = params.toString();
  return str ? `?${str}` : '';
}

export interface WriteOptions {
  /**
   * Use `pushState` (true) to add a new history entry — typically when a
   * drawer/modal is just opened so the browser back button closes it.
   * Defaults to `replaceState` (false) for in-place updates like mode changes.
   */
  readonly push?: boolean;
}

/**
 * Reads URL search params (mode, settings, history) and exposes helpers to
 * update them. `write({...}, { push: true })` adds a history entry; without
 * the flag, `replaceState` is used. Designed to be called once from AppShell
 * so the URL is the single source of truth for deep links and back-button
 * handling.
 */
export function useUrlParams(): {
  readonly initial: UrlSyncState;
  readonly write: (state: Partial<UrlSyncState>, options?: WriteOptions) => void;
} {
  const initialRef = useRef<UrlSyncState | null>(null);
  if (initialRef.current === null) {
    initialRef.current = readState(window.location.search);
  }
  const initial = initialRef.current;

  useEffect(() => {
    const onPop = () => {
      // The shell observes the URL via its own listener; this hook only
      // re-reads on back/forward navigation. Components subscribe elsewhere.
      window.dispatchEvent(
        new CustomEvent<UrlSyncState>('calcrepo:url', {
          detail: readState(window.location.search),
        }),
      );
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const write = useCallback((state: Partial<UrlSyncState>, options?: WriteOptions) => {
    const next = writeState(state);
    const current = window.location.search;
    if (next === current) return;
    const url = `${window.location.pathname}${next}${window.location.hash}`;
    if (options?.push) {
      window.history.pushState(null, '', url);
    } else {
      window.history.replaceState(null, '', url);
    }
    window.dispatchEvent(
      new CustomEvent<UrlSyncState>('calcrepo:url', { detail: readState(next) }),
    );
  }, []);

  return { initial, write };
}

export function readUrlState(search: string): UrlSyncState {
  return readState(search);
}