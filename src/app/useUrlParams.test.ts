import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readUrlState } from './useUrlParams';

describe('useUrlParams', () => {
  const originalSearch = window.location.search;

  beforeEach(() => {
    // jsdom persists search across tests; reset each time.
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    window.history.replaceState(null, '', originalSearch || '/');
  });

  it('returns no state for an empty search string', () => {
    expect(readUrlState('')).toEqual({ settings: false, history: false });
  });

  it('parses a valid mode', () => {
    expect(readUrlState('?mode=scientific')).toEqual({
      mode: 'scientific',
      settings: false,
      history: false,
    });
  });

  it('ignores an invalid mode', () => {
    expect(readUrlState('?mode=nope')).toEqual({ settings: false, history: false });
  });

  it('parses the settings drawer flag', () => {
    expect(readUrlState('?settings=open')).toEqual({ settings: true, history: false });
  });

  it('treats settings=false as explicitly closed', () => {
    expect(readUrlState('?settings=false')).toEqual({ settings: false, history: false });
  });

  it('parses combined params', () => {
    expect(readUrlState('?mode=base&settings=open&history=open')).toEqual({
      mode: 'base',
      settings: true,
      history: true,
    });
  });

  it('handles a missing leading question mark', () => {
    expect(readUrlState('mode=tools')).toEqual({
      mode: 'tools',
      settings: false,
      history: false,
    });
  });

  it('treats missing drawer params as closed (used by popstate)', () => {
    // When the user navigates back, the URL drops ?settings=open; the
    // listener should still know the drawer is now closed (not "unknown").
    expect(readUrlState('?mode=basic').settings).toBe(false);
    expect(readUrlState('?mode=basic').history).toBe(false);
  });
});