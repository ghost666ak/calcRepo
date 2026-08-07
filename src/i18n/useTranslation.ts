import { useMemo } from 'react';
import { usePreferences } from '../state/preferences';
import { getMessages, type Messages } from './messages';

export interface Translator {
  /** Look up a message by dotted path. Returns the string with substitutions applied. */
  readonly t: (path: keyof Messages | string, vars?: Record<string, string | number>) => string;
  readonly messages: Messages;
}

/**
 * Lightweight i18n hook: resolves a translator for the user's preferred language.
 * Unknown languages fall back to English. Only English is bundled today.
 */
export function useTranslation(): Translator {
  const { preferences } = usePreferences();
  return useMemo(() => {
    const messages = getMessages(preferences.language);
    const lookup = (path: string): unknown => {
      const parts = path.split('.');
      let node: unknown = messages;
      for (const part of parts) {
        if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
          node = (node as Record<string, unknown>)[part];
        } else {
          return path;
        }
      }
      return node;
    };
    const t = (path: string, vars?: Record<string, string | number>): string => {
      const value = lookup(path);
      if (typeof value !== 'string') return path;
      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in vars ? String(vars[key]) : match,
      );
    };
    return { t, messages };
  }, [preferences.language]);
}
