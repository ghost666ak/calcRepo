import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type HistoryKind = 'expression' | 'programmer';

export interface HistoryEntry {
  readonly id: string;
  readonly kind: HistoryKind;
  readonly expression: string;
  readonly result: string;
  readonly mode: string;
  readonly createdAt: number;
  readonly pinned: boolean;
}

export interface HistorySettings {
  readonly enabled: boolean;
  readonly maxEntries: number;
}

const DEFAULT_SETTINGS: HistorySettings = { enabled: false, maxEntries: 100 };
const SETTINGS_KEY = 'calcRepo.history.settings.v1';
const ENTRIES_KEY = 'calcRepo.history.entries.v1';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable (private mode, quota); ignore silently.
  }
}

function normalizeEntry(entry: unknown): HistoryEntry | null {
  if (!entry || typeof entry !== 'object') return null;
  const raw = entry as Record<string, unknown>;
  if (
    typeof raw['id'] !== 'string' ||
    typeof raw['expression'] !== 'string' ||
    typeof raw['result'] !== 'string' ||
    typeof raw['mode'] !== 'string' ||
    typeof raw['createdAt'] !== 'number'
  ) {
    return null;
  }
  const kind: HistoryKind = raw['kind'] === 'programmer' ? 'programmer' : 'expression';
  return {
    id: raw['id'],
    kind,
    expression: raw['expression'],
    result: raw['result'],
    mode: raw['mode'],
    createdAt: raw['createdAt'],
    pinned: Boolean(raw['pinned']),
  };
}

export function readSettings(): HistorySettings {
  const raw = readJson<Partial<HistorySettings>>(SETTINGS_KEY, {});
  return {
    enabled: Boolean(raw.enabled),
    maxEntries:
      typeof raw.maxEntries === 'number' && raw.maxEntries > 0 && raw.maxEntries <= 1000
        ? raw.maxEntries
        : DEFAULT_SETTINGS.maxEntries,
  };
}

export function writeSettings(settings: HistorySettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function readEntries(): readonly HistoryEntry[] {
  const raw = readJson<unknown[]>(ENTRIES_KEY, []);
  if (!Array.isArray(raw)) return [];
  const normalized: HistoryEntry[] = [];
  for (const entry of raw) {
    const parsed = normalizeEntry(entry);
    if (parsed) normalized.push(parsed);
  }
  return normalized;
}

export function writeEntries(entries: readonly HistoryEntry[]): void {
  writeJson(ENTRIES_KEY, entries);
}

export interface UseHistoryResult {
  readonly settings: HistorySettings;
  readonly entries: readonly HistoryEntry[];
  readonly toggleEnabled: () => void;
  readonly setMaxEntries: (next: number) => void;
  readonly record: (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'pinned'>) => void;
  readonly forceRecord: (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'pinned'>) => void;
  readonly clear: () => void;
  readonly togglePin: (id: string) => void;
  readonly remove: (id: string) => void;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `h_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

/**
 * Shared history state via Context so the SettingsDrawer's `toggleEnabled`
 * call reaches the BasicView's `settings.enabled` read on the same render —
 * otherwise they each have a private useState and the UI gets out of sync.
 */
const HistoryContext = createContext<UseHistoryResult | null>(null);

export function HistoryProvider({ children }: { readonly children: ReactNode }): JSX.Element {
  const [settings, setSettings] = useState<HistorySettings>(() => readSettings());
  const [entries, setEntries] = useState<readonly HistoryEntry[]>(() => readEntries());

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

  useEffect(() => {
    writeEntries(entries);
  }, [entries]);

  const toggleEnabled = useCallback(() => {
    setSettings((current) => ({ ...current, enabled: !current.enabled }));
  }, []);

  const setMaxEntries = useCallback((next: number) => {
    if (!Number.isFinite(next) || next <= 0) return;
    setSettings((current) => ({ ...current, maxEntries: Math.min(Math.floor(next), 1000) }));
  }, []);

  const record = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'pinned'>) => {
      if (!settings.enabled) return;
      const id = generateId();
      setEntries((current) => {
        const trimmed = current.filter(
          (existing) =>
            existing.pinned ||
            existing.expression !== entry.expression ||
            existing.result !== entry.result,
        );
        const nextEntry: HistoryEntry = {
          ...entry,
          id,
          createdAt: Date.now(),
          pinned: false,
        };
        const combined = [nextEntry, ...trimmed];
        const overflow = combined.length - settings.maxEntries;
        if (overflow <= 0) return combined;
        const pinned = combined.filter((entry) => entry.pinned);
        const recent = combined
          .filter((entry) => !entry.pinned)
          .slice(0, settings.maxEntries - pinned.length);
        return [...pinned, ...recent];
      });
    },
    [settings.enabled, settings.maxEntries],
  );

  // Same as record() but bypasses the enabled flag — used by the "Save" button
  // on each inline history entry so users who keep auto-save off can still
  // cherry-pick what to persist.
  const forceRecord = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'createdAt' | 'pinned'>) => {
      const id = generateId();
      setEntries((current) => {
        const trimmed = current.filter(
          (existing) =>
            existing.pinned ||
            existing.expression !== entry.expression ||
            existing.result !== entry.result,
        );
        const nextEntry: HistoryEntry = {
          ...entry,
          id,
          createdAt: Date.now(),
          pinned: false,
        };
        const combined = [nextEntry, ...trimmed];
        const overflow = combined.length - settings.maxEntries;
        if (overflow <= 0) return combined;
        const pinned = combined.filter((entry) => entry.pinned);
        const recent = combined
          .filter((entry) => !entry.pinned)
          .slice(0, settings.maxEntries - pinned.length);
        return [...pinned, ...recent];
      });
    },
    [settings.maxEntries],
  );

  const clear = useCallback(() => {
    setEntries((current) => current.filter((entry) => entry.pinned));
  }, []);

  const togglePin = useCallback((id: string) => {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, pinned: !entry.pinned } : entry)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }, []);

  return (
    <HistoryContext.Provider
      value={{ settings, entries, toggleEnabled, setMaxEntries, record, forceRecord, clear, togglePin, remove }}
    >
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory(): UseHistoryResult {
  const ctx = useContext(HistoryContext);
  if (!ctx) {
    throw new Error('useHistory must be used inside <HistoryProvider>');
  }
  return ctx;
}