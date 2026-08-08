import { useEffect } from 'react';
import type { Theme } from '../core/types';

/**
 * Resolve a Theme preference (which may be 'system') to the concrete 'light'
 * or 'dark' that should be applied right now.
 *
 * - 'light' / 'dark' pass through.
 * - 'system' returns whatever the OS currently reports.
 *
 * Safe to call during SSR or before the DOM is ready: it falls back to
 * 'light' and updates once the effect runs in the browser.
 */
export function resolveTheme(preference: Theme): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') return preference;
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Apply the resolved theme to <html> so the CSS tokens defined on :root
 * pick up the right values immediately (including body background, which
 * sits outside .app-shell).
 *
 * Also syncs `color-scheme` so native UI (scrollbars, form controls) matches.
 * For 'system', subscribes to OS changes and updates live.
 *
 * Returns the resolved theme so callers can react if needed.
 */
export function useTheme(preference: Theme): 'light' | 'dark' {
  const resolved = resolveTheme(preference);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;
  }, [resolved]);

  // When the user picked 'system', follow live OS changes.
  useEffect(() => {
    if (preference !== 'system') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (): void => {
      const next = mql.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      document.documentElement.style.colorScheme = next;
    };
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [preference]);

  return resolved;
}