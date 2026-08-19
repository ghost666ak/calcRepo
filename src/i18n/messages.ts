/**
 * Centralised UI messages. Only English is shipped today; the runtime is
 * ready to fall back to other languages by adding more top-level keys and
 * switching the language in preferences.
 */
export interface Messages {
  readonly app: {
    readonly title: string;
    readonly tagline: string;
    readonly historyButton: string;
    readonly settingsButton: string;
  };
  readonly nav: {
    readonly modeTabsLabel: string;
  };
  readonly modes: {
    readonly basic: string;
    readonly scientific: string;
    readonly base: string;
    readonly programmer: string;
    readonly tools: string;
  };
  readonly themes: {
    readonly light: string;
    readonly dark: string;
    readonly system: string;
    readonly hint: string;
    readonly moreLanguages: string;
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
    readonly cacheLevelMax: string;
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
    readonly clearAfterEquals: string;
    readonly clearAfterEqualsHint: string;
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
  readonly basic: {
    readonly equals: string;
    readonly hint: string;
  };
  readonly scientific: {
    readonly angleUnit: string;
    readonly angleUnitDeg: string;
    readonly angleUnitRad: string;
    readonly angleUnitGrad: string;
    readonly precision: string;
    readonly memoryLabel: string;
    readonly memoryAdd: string;
    readonly memorySubtract: string;
    readonly memoryRecall: string;
    readonly memoryClear: string;
    readonly memoryGroupLabel: string;
    readonly keypadFunctions: string;
    readonly keypadDigits: string;
  };
  readonly base: {
    readonly title: string;
    readonly description: string;
    readonly inputLabel: string;
    readonly resultLabel: string;
    readonly sourceBase: string;
    readonly targetBase: string;
    readonly sourceBasePresets: string;
    readonly targetBasePresets: string;
    readonly value: string;
    readonly copy: string;
    readonly swap: string;
    readonly fractionDigits: string;
    readonly digitsPerGroup: string;
    readonly truncated: string;
    readonly repeating: string;
    readonly outOfRange: string;
  };
  readonly programmer: {
    readonly title: string;
    readonly description: string;
    readonly settings: string;
    readonly keypad: string;
    readonly expression: string;
    readonly output: string;
    readonly outputBase: string;
    readonly outputCopyGroup: string;
    readonly wordWidth: string;
    readonly wordWidthBit: string;
    readonly signedness: string;
    readonly signed: string;
    readonly unsigned: string;
    readonly statusFlags: string;
    readonly overflow: string;
    readonly carry: string;
    readonly invalidBits: string;
    readonly raw: string;
    readonly bin: string;
    readonly oct: string;
    readonly dec: string;
    readonly hex: string;
  };
  readonly tools: {
    readonly title: string;
    readonly description: string;
    readonly placeholder: string;
    readonly tabsLabel: string;
    readonly bitInspector: string;
    readonly unicode: string;
    readonly ieee754: string;
    readonly bytes: string;
    readonly timestamp: string;
    readonly value: string;
    readonly width: string;
    readonly widthBit: string;
    readonly msb: string;
    readonly lsb: string;
    readonly statusCopied: string;
    readonly statusRoundTripOk: string;
    readonly statusRoundTripFailed: string;
    readonly statusInvalid: string;
    readonly inputLabel: string;
    readonly unit: string;
    readonly unitSeconds: string;
    readonly unitMillis: string;
    readonly isoUtc: string;
    readonly utc: string;
    readonly local: string;
    readonly epochSeconds: string;
    readonly epochMillis: string;
    readonly dayOfWeek: string;
    readonly dayNumber: string;
    readonly weekNumber: string;
    readonly parsedIso: string;
    readonly days: readonly [string, string, string, string, string, string, string];
  };
  readonly languages: {
    readonly en: string;
    readonly hi: string;
  };
  readonly status: {
    readonly ready: string;
    readonly loadingProgrammer: string;
    readonly loadingTools: string;
    readonly calculatingCache: string;
  };
  readonly history: {
    readonly autoSaveOffNotice: string;
    readonly inlineAutoSaveHint: string;
    readonly saveEntry: string;
    readonly removeEntry: string;
    readonly createdAtFallback: string;
    readonly expandAnswer: string;
    readonly collapseAnswer: string;
  };
  readonly historyPanel: {
    readonly title: string;
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
    historyButton: 'History',
    settingsButton: 'Settings',
  },
  nav: {
    modeTabsLabel: 'Calculator mode tabs',
  },
  modes: {
    basic: 'Basic',
    scientific: 'Scientific',
    base: 'Base',
    programmer: 'Programmer',
    tools: 'Tools',
  },
  themes: {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    hint: 'Follows your operating system when set to System.',
    moreLanguages: 'More languages coming soon — contributions welcome.',
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
    cacheLevelMax: 'Max — cache everything, work fully offline',
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
    clearAfterEquals: 'Clear after equals',
    clearAfterEqualsHint: 'Start a new calculation when a digit is pressed after =.',
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
  basic: {
    equals: '=',
    hint: 'Type expressions like 12*(5+3), then press =. Use AC to reset, ⌫ to delete the last character.',
  },
  scientific: {
    angleUnit: 'Angle unit',
    angleUnitDeg: 'Degrees',
    angleUnitRad: 'Radians',
    angleUnitGrad: 'Gradians',
    precision: 'Decimal precision',
    memoryLabel: 'Memory',
    memoryAdd: 'M+',
    memorySubtract: 'M−',
    memoryRecall: 'MR',
    memoryClear: 'MC',
    memoryGroupLabel: 'Memory registers',
    keypadFunctions: 'Scientific functions',
    keypadDigits: 'Scientific digit keypad',
  },
  base: {
    title: 'Base converter',
    description: 'Convert between bases 2–36 with exact integer/fractional arithmetic.',
    inputLabel: 'Input',
    resultLabel: 'Result',
    sourceBase: 'Source base',
    targetBase: 'Target base',
    sourceBasePresets: 'Source base presets',
    targetBasePresets: 'Target base presets',
    value: 'Value',
    copy: 'Copy converted value',
    swap: 'Swap source and target bases',
    fractionDigits: 'Fraction digits (1–128): {value}',
    digitsPerGroup: 'Digits per group (0–8): {value}',
    truncated: 'Output truncated to the configured fraction digit limit.',
    repeating: 'Repeating fraction shown in parentheses.',
    outOfRange: 'Base must be an integer from {min} to {max}.',
  },
  programmer: {
    title: 'Programmer',
    description: 'Mixed-base integer expressions with bitwise operators, configurable width, and signedness.',
    settings: 'Programmer settings',
    keypad: 'Programmer keypad',
    expression: 'Expression',
    output: 'Output',
    outputBase: 'Output base',
    outputCopyGroup: 'Output copy',
    wordWidth: 'Word width',
    wordWidthBit: '{value}-bit',
    signedness: 'Signedness',
    signed: 'signed',
    unsigned: 'unsigned',
    statusFlags: 'Status flags',
    overflow: 'overflow',
    carry: 'carry',
    invalidBits: 'invalid bits',
    raw: 'raw',
    bin: 'BIN',
    oct: 'OCT',
    dec: 'DEC',
    hex: 'HEX',
  },
  tools: {
    title: 'Tools',
    description: 'Standalone utilities for common developer tasks.',
    placeholder: 'Pick a tool',
    tabsLabel: 'Tool tabs',
    bitInspector: 'Bit inspector',
    unicode: 'Unicode & UTF-8',
    ieee754: 'IEEE-754',
    bytes: 'Bytes',
    timestamp: 'Timestamp',
    value: 'Value',
    width: 'Width',
    widthBit: '{value}-bit',
    msb: 'MSB',
    lsb: 'LSB',
    statusCopied: 'Copied',
    statusRoundTripOk: 'Round-trip OK',
    statusRoundTripFailed: 'Round-trip mismatch',
    statusInvalid: 'Invalid input',
    inputLabel: 'Input',
    unit: 'Unit',
    unitSeconds: 'Seconds',
    unitMillis: 'Milliseconds',
    isoUtc: 'ISO (UTC): {value}',
    utc: 'UTC: {value}',
    local: 'Local: {value}',
    epochSeconds: 'Epoch seconds: {value}',
    epochMillis: 'Epoch millis: {value}',
    dayOfWeek: 'Day of week: {value}',
    dayNumber: 'Day #{value}',
    weekNumber: 'Week #{value}',
    parsedIso: 'Parsed ISO: {value}',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  languages: {
    en: 'English',
    hi: 'हिन्दी (Hindi)',
  },
  status: {
    ready: 'Ready',
    loadingProgrammer: 'Loading programmer mode…',
    loadingTools: 'Loading tools…',
    calculatingCache: 'Calculating cache size…',
  },
  history: {
    autoSaveOffNotice: 'Auto-save history is off. Enable it in settings to start recording calculations.',
    inlineAutoSaveHint: 'Auto-save is off — tap Save to keep an entry.',
    saveEntry: 'Save to history',
    removeEntry: 'Discard',
    createdAtFallback: '(no date)',
    expandAnswer: 'Expand long answer',
    collapseAnswer: 'Collapse answer',
  },
  historyPanel: {
    title: 'History',
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
    historyButton: 'इतिहास',
    settingsButton: 'सेटिंग्स',
  },
  nav: {
    modeTabsLabel: 'कैलकुलेटर मोड टैब',
  },
  modes: {
    basic: 'बेसिक',
    scientific: 'साइंटिफिक',
    base: 'बेस',
    programmer: 'प्रोग्रामर',
    tools: 'टूल्स',
  },
  themes: {
    light: 'लाइट',
    dark: 'डार्क',
    system: 'सिस्टम',
    hint: 'System पर रहने पर ऑपरेटिंग सिस्टम का थीम फॉलो करता है।',
    moreLanguages: 'और भाषाएँ जल्द आ रही हैं — योगदान का स्वागत है।',
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
    cacheLevelMax: 'अधिकतम — सब कुछ कैश करें, पूर्णतः ऑफलाइन चलाएं',
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
    maxEntries: 'अधिकतम एंट्रियाँ',
    feedback: 'फ़ीडबैक',
    errorUx: 'त्रुटि फ़ीडबैक स्तर',
    errorUxVerbose: 'विस्तृत',
    errorUxVerboseHint: 'संदेश + अक्षर हाइलाइट + कैरेट।',
    errorUxHighlight: 'केवल हाइलाइट',
    errorUxHighlightHint: 'गलत अक्षर रेखांकित; कोई संदेश नहीं।',
    errorUxSilent: 'मौन',
    errorUxSilentHint: 'शांति से ऑटो-सही; कोई संकेत नहीं।',
    clearAfterEquals: 'के बाद साफ़ करें =',
    clearAfterEqualsHint: '= के बाद अंक दबाने पर नई गणना शुरू करें।',
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
  basic: {
    equals: '=',
    hint: '12*(5+3) जैसी अभिव्यक्ति टाइप करें, फिर = दबाएँ। AC से रीसेट, ⌫ से आखिरी अक्षर हटाएँ।',
  },
  scientific: {
    angleUnit: 'कोण इकाई',
    angleUnitDeg: 'डिग्री',
    angleUnitRad: 'रेडियन',
    angleUnitGrad: 'ग्रेडियन',
    precision: 'दशमलव सटीकता',
    memoryLabel: 'मेमोरी',
    memoryAdd: 'M+',
    memorySubtract: 'M−',
    memoryRecall: 'MR',
    memoryClear: 'MC',
    memoryGroupLabel: 'मेमोरी रजिस्टर',
    keypadFunctions: 'साइंटिफिक फ़ंक्शन',
    keypadDigits: 'साइंटिफिक अंक कीपैड',
  },
  base: {
    title: 'बेस कन्वर्टर',
    description: '2–36 के बीच बेस कन्वर्ट करें, सटीक पूर्णांक/भिन्न अंकगणित के साथ।',
    inputLabel: 'इनपुट',
    resultLabel: 'परिणाम',
    sourceBase: 'स्रोत बेस',
    targetBase: 'लक्ष्य बेस',
    sourceBasePresets: 'स्रोत बेस प्रीसेट',
    targetBasePresets: 'लक्ष्य बेस प्रीसेट',
    value: 'मान',
    copy: 'कन्वर्ट किया गया मान कॉपी करें',
    swap: 'स्रोत और लक्ष्य बेस बदलें',
    fractionDigits: 'भिन्न अंक (1–128): {value}',
    digitsPerGroup: 'प्रति समूह अ��क (0–8): {value}',
    truncated: 'आउटपुट भिन्न अंक सीमा तक ट्रंकेट किया गया।',
    repeating: 'पुनरावृत्त भिन्न कोष्ठक में दिखाया गया।',
    outOfRange: 'आधार {min} से {max} के बीच एक पूर्णांक होना चाहिए।',
  },
  programmer: {
    title: 'प्रोग्रामर',
    description: 'मिश्रित-बेस पूर्णांक अभिव्यक्तियाँ, बिटवाइज़ ऑपरेटर, कॉन्फ़िगरेबल चौड़ाई और साइन्डनेस।',
    settings: 'प्रोग्रामर सेटिंग्स',
    keypad: 'प्रोग्रामर कीपैड',
    expression: 'अभिव्यक्ति',
    output: 'आउटपुट',
    outputBase: 'आउटपुट बेस',
    outputCopyGroup: 'आउटपुट कॉपी',
    wordWidth: 'शब्द चौड़ाई',
    wordWidthBit: '{value}-बिट',
    signedness: 'साइन्डनेस',
    signed: 'साइन्ड',
    unsigned: 'अनसाइन्ड',
    statusFlags: 'स्थिति फ़्लैग',
    overflow: 'ओवरफ़्लो',
    carry: 'कैरी',
    invalidBits: 'अमान्य बिट',
    raw: 'रॉ',
    bin: 'बिन',
    oct: 'ऑक्ट',
    dec: 'डेसि',
    hex: 'हेक्स',
  },
  tools: {
    title: 'टूल्स',
    description: 'सामान्य डेवलपर कार्यों के लिए स्टैंडअलोन उपयोगिताएँ।',
    placeholder: 'कोई टूल चुनें',
    tabsLabel: 'टूल टैब',
    bitInspector: 'बिट इंस्पेक्टर',
    unicode: 'यूनिकोड और UTF-8',
    ieee754: 'IEEE-754',
    bytes: 'बाइट्स',
    timestamp: 'टाइमस्टैम्प',
    value: 'मान',
    width: 'चौड़ाई',
    widthBit: '{value}-बिट',
    msb: 'MSB',
    lsb: 'LSB',
    statusCopied: 'कॉपी हो गया',
    statusRoundTripOk: 'राउंड-ट्रिप ठीक',
    statusRoundTripFailed: 'राउंड-ट्रिप बेमेल',
    statusInvalid: 'अमान्य इनपुट',
    inputLabel: 'इनपुट',
    unit: 'इकाई',
    unitSeconds: 'सेकंड',
    unitMillis: 'मिलीसेकंड',
    isoUtc: 'ISO (UTC): {value}',
    utc: 'UTC: {value}',
    local: 'स्थानीय: {value}',
    epochSeconds: 'Epoch सेकंड: {value}',
    epochMillis: 'Epoch मिलीसेकंड: {value}',
    dayOfWeek: 'सप्ताह का दिन: {value}',
    dayNumber: 'दिन #{value}',
    weekNumber: 'सप्ताह #{value}',
    parsedIso: 'पार्स किया ISO: {value}',
    days: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  },
  languages: {
    en: 'English',
    hi: 'हिन्दी (Hindi)',
  },
  status: {
    ready: 'तैयार',
    loadingProgrammer: 'प्रोग्रामर मोड लोड हो रहा है…',
    loadingTools: 'टूल्स लोड हो रहे हैं…',
    calculatingCache: 'कैश आकार गिना जा रहा है…',
  },
  history: {
    autoSaveOffNotice: 'ऑटो-सेव इतिहास बंद है। गणना रिकॉर्ड करने के लिए सेटिंग्स में इसे चालू करें।',
    inlineAutoSaveHint: 'ऑटो-सेव बंद है — एंट्री रखने के लिए Save दबाएँ।',
    saveEntry: 'इतिहास में सेव',
    removeEntry: 'हटाएँ',
    createdAtFallback: '(कोई दिनांक नहीं)',
    expandAnswer: 'लंबा उत्तर विस्तृत करें',
    collapseAnswer: 'उत्तर संकुचित करें',
  },
  historyPanel: {
    title: 'इतिहास',
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
