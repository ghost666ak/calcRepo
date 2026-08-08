import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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
  return value === 'en' || value === 'hi';
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

/**
 * Shared preference state. We use a Context so that every `usePreferences()`
 * call sees the same instance — otherwise the call inside the SettingsDrawer
 * would hold private state and changes wouldn't reach AppShell's useTheme,
 * useTranslation, or any other consumer.
 */
const PreferencesContext = createContext<UsePreferencesResult | null>(null);

interface PreferencesProviderProps {
  readonly children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps): JSX.Element {
  const [preferences, setPreferences] = useState<Preferences>(() => readFromStorage());

  useEffect(() => {
    writeToStorage(preferences);
  }, [preferences]);

  // Stay in sync if a second tab updates preferences (e.g. user toggles theme
  // in another window). Without this, the other tab keeps showing stale
  // settings until it reloads.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<Preferences>;
        setPreferences({
          theme: isTheme(parsed.theme) ? parsed.theme : 'system',
          reducedMotion: Boolean(parsed.reducedMotion),
          angleUnit: isAngleUnit(parsed.angleUnit) ? parsed.angleUnit : 'RAD',
          precisionDigits: isPrecision(parsed.precisionDigits) ? parsed.precisionDigits : 12,
          language: isLanguage(parsed.language) ? parsed.language : 'en',
          pwaAutoUpdate: parsed.pwaAutoUpdate === undefined ? true : Boolean(parsed.pwaAutoUpdate),
          cacheLevel: isCacheLevel(parsed.cacheLevel) ? parsed.cacheLevel : 'assets',
          errorUx: isErrorUx(parsed.errorUx) ? parsed.errorUx : 'verbose',
        });
      } catch {
        // Ignore malformed payloads — next write will heal them.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = (next: Partial<Preferences>): void => {
    setPreferences((current) => ({ ...current, ...next }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, update }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): UsePreferencesResult {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used inside <PreferencesProvider>');
  }
  return ctx;
}