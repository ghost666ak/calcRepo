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
    readonly autoSaveHistoryHint: string;
    readonly maxEntries: string;
    readonly feedback: string;
    readonly errorUx: string;
    readonly errorUxVerbose: string;
    readonly errorUxVerboseHint: string;
    readonly errorUxHighlight: string;
    readonly errorUxHighlightHint: string;
    readonly errorUxSilent: string;
    readonly errorUxSilentHint: string;
  };
  readonly actions: {
    readonly copy: string;
    readonly copyDone: string;
    readonly repeat: string;
    readonly repeatHint: string;
    readonly clear: string;
    readonly backspace: string;
    readonly save: string;
    readonly remove: string;
  };
  readonly history: {
    readonly autoSaveOffNotice: string;
    readonly inlineAutoSaveHint: string;
    readonly saveEntry: string;
    readonly removeEntry: string;
  };
  readonly historyPanel: {
    readonly all: string;
    readonly pinnedOnly: string;
    readonly clearUnpinned: string;
    readonly empty: string;
    readonly reuse: string;
    readonly pin: string;
    readonly unpin: string;
    readonly remove: string;
  };
}

/** English bundle — exported separately so useTranslation can fall back
 *  per-key when a partial translation is missing a string. */
export const EN_MESSAGES: Messages = {
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
    rememberHistory: 'Auto-save calculation history',
    autoSaveHistoryHint: 'When off, use the Save button on each entry below the calculator to keep it.',
    maxEntries: 'Maximum entries',
    feedback: 'Feedback',
    errorUx: 'Error feedback level',
    errorUxVerbose: 'Verbose',
    errorUxVerboseHint: 'Message text + character highlight + caret.',
    errorUxHighlight: 'Highlight only',
    errorUxHighlightHint: 'Underline the bad character; no message text.',
    errorUxSilent: 'Silent',
    errorUxSilentHint: 'Auto-correct quietly; no on-screen indicator.',
  },
  actions: {
    copy: 'Copy',
    copyDone: 'Copied!',
    repeat: 'Repeat last result',
    repeatHint: 'Appends the previous result to the expression with "+"',
    clear: 'Clear',
    backspace: 'Backspace',
    save: 'Save',
    remove: 'Remove',
  },
  history: {
    autoSaveOffNotice: 'Auto-save history is off. Enable it in settings to start recording calculations.',
    inlineAutoSaveHint: 'Auto-save is off — tap Save to keep an entry.',
    saveEntry: 'Save to history',
    removeEntry: 'Discard',
  },
  historyPanel: {
    all: 'All',
    pinnedOnly: 'Pinned only',
    clearUnpinned: 'Clear unpinned',
    empty: 'No history yet.',
    reuse: 'Reuse',
    pin: 'Pin',
    unpin: 'Unpin',
    remove: 'Remove',
  },
};

const HI: Messages = {
  app: {
    title: 'calcRepo',
    tagline: 'स्टैटिक डेवलपर कैलकुलेटर',
  },
  modes: {
    basic: 'बेसिक',
    scientific: 'साइंटिफिक',
    base: 'बेस',
    programmer: 'प्रोग्रामर',
    tools: 'टूल्स',
  },
  settings: {
    title: 'सेटिंग्स',
    close: 'बंद करें',
    appearance: 'दिखावट',
    theme: 'थीम',
    language: 'भाषा',
    reducedMotion: 'एनिमेशन कम करें',
    offline: 'ऑफ़लाइन और कैश',
    cacheLevel: 'कैश स्तर',
    cacheLevelShell: 'केवल ऐप शेल — सबसे छोटा',
    cacheLevelAssets: 'ऐप शेल + एसेट (अनुशंसित)',
    cacheLevelExtended: 'विस्तारित — पिछला पेज भी कैश करें',
    clearCache: 'कैश फ़ाइलें साफ़ करें',
    cacheCleared: 'कैश फ़ाइलें साफ़ हो गईं।',
    cacheSize: 'कैश आकार: {size}',
    updates: 'ऐप अपडेट',
    autoUpdate: 'अपडेट स्वतः लागू करें',
    checkForUpdate: 'अपडेट जाँचें',
    updateAvailable: 'नया संस्करण उपलब्ध है।',
    applyUpdate: 'अभी लागू करें',
    noUpdateAvailable: 'आप नवीनतम संस्करण पर हैं।',
    privacy: 'गोपनीयता',
    privacyNote: 'इतिहास और पसंदीदा इसी डिवाइस पर रहते हैं। कोई डेटा कहीं नहीं भेजा जाता।',
    rememberHistory: 'गणना इतिहास ऑटो-सेव',
    autoSaveHistoryHint: 'बंद होने पर, कैलकुलेटर के नीचे हर एंट्री पर Save बटन दबाकर रखें।',
    maxEntries: 'अधिकतम एंट��रियाँ',
    feedback: 'फ़ीडबैक',
    errorUx: 'त्रुटि फ़ीडबैक स्तर',
    errorUxVerbose: 'विस्तृत',
    errorUxVerboseHint: 'संदेश + अक्षर हाइलाइट + कैरेट।',
    errorUxHighlight: 'केवल हाइलाइट',
    errorUxHighlightHint: 'गलत अक्षर रेखांकित; कोई संदेश नहीं।',
    errorUxSilent: 'मौन',
    errorUxSilentHint: 'शांति से ऑटो-सही; कोई संकेत नहीं।',
  },
  actions: {
    copy: 'कॉपी',
    copyDone: 'कॉपी हो गया!',
    repeat: 'अंतिम परिणाम दोहराएँ',
    repeatHint: 'पिछले परिणाम को अभिव्यक्ति में "+" से जोड़ता है',
    clear: 'साफ़',
    backspace: 'बैकस्पेस',
    save: 'सेव',
    remove: 'हटाएँ',
  },
  history: {
    autoSaveOffNotice: 'ऑटो-सेव इतिहास बंद है। गणना रिकॉर्ड करने के लिए सेटिंग्स में इसे चालू करें।',
    inlineAutoSaveHint: 'ऑटो-सेव बंद है — एंट्री रखने के लिए Save दबाएँ।',
    saveEntry: 'इतिहास में सेव',
    removeEntry: 'हटाएँ',
  },
  historyPanel: {
    all: 'सभी',
    pinnedOnly: 'केवल पिन किया हुआ',
    clearUnpinned: 'अनपिन साफ़ करें',
    empty: 'अभी कोई इतिहास नहीं।',
    reuse: 'पुनः उपयोग',
    pin: 'पिन',
    unpin: 'अनपिन',
    remove: 'हटाएँ',
  },
};

const MESSAGES: Record<string, Messages> = {
  en: EN_MESSAGES,
  hi: HI,
};

export function getMessages(language: string): Messages {
  // Unknown languages — and partially translated ones — fall back to the
  // English bundle. Per-key fallback happens inside useTranslation's lookup.
  return MESSAGES[language] ?? EN_MESSAGES;
}
