import { useEffect, useState } from 'react';
import type { Preferences } from '../core/types';

const STORAGE_KEY = 'calcRepo.preferences.v1';

const DEFAULT_PREFERENCES: Preferences = { theme: 'system', reducedMotion: false };

function readFromStorage(): Preferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: parsed.theme === 'light' || parsed.theme === 'dark' ? parsed.theme : 'system',
      reducedMotion: Boolean(parsed.reducedMotion),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function writeToStorage(preferences: Preferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage may be unavailable (private mode, quota); ignore silently for foundation phase.
  }
}

export interface UsePreferencesResult {
  readonly preferences: Preferences;
  readonly update: (next: Partial<Preferences>) => void;
}

export function usePreferences(): UsePreferencesResult {
  const [preferences, setPreferences] = useState<Preferences>(() => readFromStorage());

  useEffect(() => {
    writeToStorage(preferences);
  }, [preferences]);

  const update = (next: Partial<Preferences>): void => {
    setPreferences((current) => ({ ...current, ...next }));
  };

  return { preferences, update };
}