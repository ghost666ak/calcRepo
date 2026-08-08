import { useMemo } from 'react';
import { usePreferences } from '../state/preferences';
import { getMessages, EN_MESSAGES, type Messages } from './messages';

export interface Translator {
  /** Look up a message by dotted path. Returns the string with substitutions applied. */
  readonly t: (path: keyof Messages | string, vars?: Record<string, string | number>) => string;
  readonly messages: Messages;
}

/**
 * Lightweight i18n hook: resolves a translator for the user's preferred language.
 * - Unknown languages fall back to the English bundle.
 * - Missing keys in a partial translation (e.g. Hindi) fall back per-key to
 *   English so a partially translated bundle still renders usefully.
 */
export function useTranslation(): Translator {
  const { preferences } = usePreferences();
  return useMemo(() => {
    const messages = getMessages(preferences.language);
    const lookup = (path: string): unknown => {
      const parts = path.split('.');
      // Try the requested language first…
      const fromMessages = traverse(messages, parts);
      if (typeof fromMessages === 'string') return fromMessages;
      // …then English so partially translated bundles still render.
      const fromEnglish = traverse(EN_MESSAGES, parts);
      if (typeof fromEnglish === 'string') return fromEnglish;
      return path;
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

function traverse(node: unknown, parts: readonly string[]): unknown {
  let current: unknown = node;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}
