import { useCallback, useEffect, useRef } from 'react';
import type { CalculatorMode } from '../core/modes';

export interface UrlSyncState {
  readonly mode?: CalculatorMode | undefined;
  readonly settings?: boolean | undefined;
  readonly history?: boolean | undefined;
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
  const settings = params.has('settings') ? params.get('settings') !== 'false' : undefined;
  const history = params.has('history') ? params.get('history') !== 'false' : undefined;
  const state: { mode?: CalculatorMode; settings?: boolean; history?: boolean } = {};
  if (mode) state.mode = mode;
  if (settings !== undefined) state.settings = settings;
  if (history !== undefined) state.history = history;
  return state;
}

function writeState(state: Partial<UrlSyncState>): string {
  const params = new URLSearchParams();
  if (state.mode) params.set('mode', state.mode);
  if (state.settings) params.set('settings', 'open');
  if (state.history) params.set('history', 'open');
  const str = params.toString();
  return str ? `?${str}` : '';
}

/**
 * Reads URL search params (mode, settings, history) and exposes helpers to
 * update them via `history.replaceState`. Designed to be called once from
 * AppShell so the URL is the single source of truth for deep links.
 */
export function useUrlParams(): {
  readonly initial: UrlSyncState;
  readonly write: (state: Partial<UrlSyncState>) => void;
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
      window.dispatchEvent(new CustomEvent<UrlSyncState>('calcrepo:url', { detail: readState(window.location.search) }));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const write = useCallback((state: Partial<UrlSyncState>) => {
    const next = writeState(state);
    const current = window.location.search;
    if (next === current) return;
    const url = `${window.location.pathname}${next}${window.location.hash}`;
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new CustomEvent<UrlSyncState>('calcrepo:url', { detail: readState(next) }));
  }, []);

  return { initial, write };
}

export function readUrlState(search: string): UrlSyncState {
  return readState(search);
}