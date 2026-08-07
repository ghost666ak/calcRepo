import { useEffect, useState } from 'react';
import type { AngleUnit, CacheLevel, ErrorUx, Language, Preferences, Theme } from '../core/types';

const STORAGE_KEY = 'calcRepo.preferences.v1';

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  reducedMotion: false,
  angleUnit: 'RAD',
  precisionDigits: 12,
  language: 'en',
  pwaAutoUpdate: true,
  cacheLevel: 'assets',
  errorUx: 'verbose',
};

function isAngleUnit(value: unknown): value is AngleUnit {
  return value === 'DEG' || value === 'RAD' || value === 'GRAD';
}

function isPrecision(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 64;
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isLanguage(value: unknown): value is Language {
  return value === 'en';
}

function isCacheLevel(value: unknown): value is CacheLevel {
  return value === 'shell' || value === 'assets' || value === 'extended';
}

function isErrorUx(value: unknown): value is ErrorUx {
  return value === 'verbose' || value === 'highlight' || value === 'silent';
}

function readFromStorage(): Preferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : 'system',
      reducedMotion: Boolean(parsed.reducedMotion),
      angleUnit: isAngleUnit(parsed.angleUnit) ? parsed.angleUnit : 'RAD',
      precisionDigits: isPrecision(parsed.precisionDigits) ? parsed.precisionDigits : 12,
      language: isLanguage(parsed.language) ? parsed.language : 'en',
      pwaAutoUpdate: parsed.pwaAutoUpdate === undefined ? true : Boolean(parsed.pwaAutoUpdate),
      cacheLevel: isCacheLevel(parsed.cacheLevel) ? parsed.cacheLevel : 'assets',
      errorUx: isErrorUx(parsed.errorUx) ? parsed.errorUx : 'verbose',
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