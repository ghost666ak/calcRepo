/**
 * Centralised UI messages. Only English is shipped today; the runtime is
 * ready to fall back to other languages by adding more top-level keys and
 * switching the language in preferences.
 */
export interface Messages {
  readonly app: {
    readonly title: string;
    readonly tagline: string;
  };
  readonly modes: {
    readonly basic: string;
    readonly scientific: string;
    readonly base: string;
    readonly programmer: string;
    readonly tools: string;
  };
  readonly settings: {
    readonly title: string;
    readonly close: string;
    readonly appearance: string;
    readonly theme: string;
    readonly language: string;
    readonly reducedMotion: string;
    readonly offline: string;
    readonly cacheLevel: string;
    readonly cacheLevelShell: string;
    readonly cacheLevelAssets: string;
    readonly cacheLevelExtended: string;
    readonly clearCache: string;
    readonly cacheCleared: string;
    readonly cacheSize: string;
    readonly updates: string;
    readonly autoUpdate: string;
    readonly checkForUpdate: string;
    readonly updateAvailable: string;
    readonly applyUpdate: string;
    readonly noUpdateAvailable: string;
    readonly privacy: string;
    readonly privacyNote: string;
    readonly rememberHistory: string;
    readonly maxEntries: string;
  };
  readonly actions: {
    readonly copy: string;
    readonly repeat: string;
    readonly clear: string;
    readonly backspace: string;
  };
}

const EN: Messages = {
  app: {
    title: 'calcRepo',
    tagline: 'Static developer calculator',
  },
  modes: {
    basic: 'Basic',
    scientific: 'Scientific',
    base: 'Base',
    programmer: 'Programmer',
    tools: 'Tools',
  },
  settings: {
    title: 'Settings',
    close: 'Close',
    appearance: 'Appearance',
    theme: 'Theme',
    language: 'Language',
    reducedMotion: 'Reduce motion',
    offline: 'Offline & cache',
    cacheLevel: 'Cache level',
    cacheLevelShell: 'App shell only — smallest footprint',
    cacheLevelAssets: 'App shell + assets (recommended)',
    cacheLevelExtended: 'Extended — also cache the last page',
    clearCache: 'Clear cached files',
    cacheCleared: 'Cached files cleared.',
    cacheSize: 'Cached size: {size}',
    updates: 'App updates',
    autoUpdate: 'Apply updates automatically',
    checkForUpdate: 'Check for updates',
    updateAvailable: 'A newer version is ready.',
    applyUpdate: 'Apply update now',
    noUpdateAvailable: 'You are on the latest version.',
    privacy: 'Privacy',
    privacyNote: 'History and favorites stay on this device. No data is sent anywhere.',
    rememberHistory: 'Remember calculation history',
    maxEntries: 'Maximum entries',
  },
  actions: {
    copy: 'Copy',
    repeat: 'Repeat (+)',
    clear: 'Clear',
    backspace: 'Backspace',
  },
};

const MESSAGES: Record<string, Messages> = {
  en: EN,
};

export function getMessages(language: string): Messages {
  return MESSAGES[language] ?? EN;
}
