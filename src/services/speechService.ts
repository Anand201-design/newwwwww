import { safeLocalStorage } from "../utils/safeStorage";

export type VoiceTonePreset = "soft-clear" | "warm-calm" | "natural-balanced";

export interface SpeechSettings {
  voiceInputEnabled: boolean;
  audioOutputEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  speechVolume?: number;
  voiceTone: VoiceTonePreset;
  preferredVoiceURI: string;
}

const SPEECH_SETTINGS_KEY = "plantcare_speech_settings";
const LANGUAGE_STORAGE_KEY = "plantcare_lang";
const SOFT_VOICE_MIGRATION_VERSION = 4;

export const DEFAULT_SPEECH_RATE = 0.9;
export const DEFAULT_SPEECH_PITCH = 1.0;
export const DEFAULT_SPEECH_VOLUME = 0.8;

export const LANGUAGE_TO_BCP47: Record<string, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  zh: "zh-CN",
};

export const SAMPLE_VOICE_TEXT: Record<string, string> = {
  en: "Your plant may need a little more water. Please check the top layer of the soil before watering, and keep it in gentle indirect light.",
  ta: "உங்கள் செடிக்குச் சற்று தண்ணீர் தேவைப்படலாம். தண்ணீர் ஊற்றும் முன் மேல் மண்ணின் ஈரப்பதத்தை அன்புடன் சரிபார்க்கவும்.",
  hi: "आपके पौधे को थोड़े और पानी की आवश्यकता हो सकती है। कृपया पानी देने से पहले मिट्टी की ऊपरी परत की जांच करें।",
  te: "మీ మొక్కకు కొద్దిగా నీరు అవసరం కావచ్చు. నీరు పోసే ముందు మట్టిని ఒకసారి పరిశీలించండి.",
  ml: "നിങ്ങളുടെ ചെടിക്ക് കുറച്ച് വെള്ളം ആവശ്യമായി വന്നേക്കാം. നനയ്ക്കുന്നതിന് മുമ്പ് മണ്ണ് പരിശോധിക്കുക.",
  kn: "ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಸ್ವಲ್ಪ ನೀರು ಬೇಕಾಗಬಹುದು. ನೀರುಣಿಸುವ ಮೊದಲು ಮಣ್ಣಿನ ಮೇಲ್ಪದರವನ್ನು ಪರೀಕ್ಷಿಸಿ.",
  bn: "আপনার গাছে কিছুটা জলের প্রয়োজন হতে পারে। জল দেওয়ার আগে মাটির ওপরের স্তর পরীক্ষা করুন।",
  mr: "तुमच्या झाडाला थोडे पाणी हवे असू शकते. पाणी देण्यापूर्वी मातीचा वरचा थर तपासा.",
  gu: "તમારા છોડને થોડું પાણી જોઈ શકે છે. પાણી આપતા પહેલા માટીનું ઉપરનું સ્તર તપાસો.",
  es: "Es posible que tu planta necesite un poco más de agua. Por favor, revisa la capa superior de la tierra antes de regar.",
  fr: "Votre plante a peut-être besoin d'un peu plus d'eau. Veuillez vérifier la couche supérieure du terreau avant d'arroser.",
  de: "Ihre Pflanze benötigt möglicherweise etwas mehr Wasser. Bitte prüfen Sie vor dem Gießen die oberste Erdschicht.",
  zh: "您的植物可能需要一点水分。请在浇水前先轻轻检查表层土壤是否干燥。",
};

/**
 * Calm, polite, soft, and professional prosody presets:
 * - Default ("soft-clear"): rate 0.9, pitch 1.0, volume 0.8
 * - Slightly slower rate and softer volume for a gentle, reassuring plant-care tone
 */
export const VOICE_TONE_PRESETS: Record<
  VoiceTonePreset,
  { rate: number; pitch: number; volume: number; label: string }
> = {
  "soft-clear": {
    rate: DEFAULT_SPEECH_RATE,
    pitch: DEFAULT_SPEECH_PITCH,
    volume: DEFAULT_SPEECH_VOLUME,
    label: "Soft & Clear (Recommended)",
  },
  "warm-calm": {
    rate: 0.88,
    pitch: 0.98,
    volume: 0.78,
    label: "Warm & Soothing",
  },
  "natural-balanced": {
    rate: 0.92,
    pitch: 1.0,
    volume: 0.82,
    label: "Natural & Balanced",
  },
};

export const getSpeechLocale = (langCode?: string): string => {
  let storedLang: string | null = null;
  try {
    storedLang = safeLocalStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // ignore
  }
  const code = langCode || storedLang || "en";
  if (code.includes("-")) return code;
  return LANGUAGE_TO_BCP47[code] || "en-US";
};

export const getStoredSpeechSettings = (): SpeechSettings => {
  const defaults: SpeechSettings = {
    voiceInputEnabled: true,
    audioOutputEnabled: true,
    speechRate: DEFAULT_SPEECH_RATE,
    speechPitch: DEFAULT_SPEECH_PITCH,
    speechVolume: DEFAULT_SPEECH_VOLUME,
    voiceTone: "soft-clear",
    preferredVoiceURI: "",
  };

  try {
    const raw = safeLocalStorage.getItem(SPEECH_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate older settings to the calm, polite Soft & Clear profile (rate 0.9, pitch 1.0, volume 0.8)
      if (!parsed._softVoiceVersion || parsed._softVoiceVersion < SOFT_VOICE_MIGRATION_VERSION) {
        const migrated: SpeechSettings = {
          ...defaults,
          ...parsed,
          speechRate: DEFAULT_SPEECH_RATE,
          speechPitch: DEFAULT_SPEECH_PITCH,
          speechVolume: DEFAULT_SPEECH_VOLUME,
          voiceTone: "soft-clear",
        };
        safeLocalStorage.setItem(
          SPEECH_SETTINGS_KEY,
          JSON.stringify({ ...migrated, _softVoiceVersion: SOFT_VOICE_MIGRATION_VERSION })
        );
        return migrated;
      }
      return {
        ...defaults,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }
  return defaults;
};

export const saveStoredSpeechSettings = (settings: SpeechSettings) => {
  try {
    safeLocalStorage.setItem(
      SPEECH_SETTINGS_KEY,
      JSON.stringify({ ...settings, _softVoiceVersion: SOFT_VOICE_MIGRATION_VERSION })
    );
  } catch {
    // ignore
  }
};

export const isSpeechSynthesisSupported = (): boolean => {
  try {
    return typeof window !== "undefined" && "speechSynthesis" in window && Boolean(window.speechSynthesis);
  } catch {
    return false;
  }
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  const win = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
};

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onEnd?: () => void;
  onError?: (err?: string) => void;
  onVoiceFallbackWarning?: (msg: string) => void;
}

export interface VoiceMatchResult {
  voice: SpeechSynthesisVoice | null;
  isExactMatch: boolean;
  isFallback: boolean;
  voicesLoaded: boolean;
}

/**
 * Priority voice markers for warm, polite, soft, natural, and professional delivery
 */
const HIGH_PRIORITY_ENGLISH_VOICES: string[] = [
  "microsoft aria online (natural)",
  "microsoft jenny online (natural)",
  "microsoft neerja online (natural)",
  "microsoft sonia online (natural)",
  "microsoft libby online (natural)",
  "microsoft clara online (natural)",
  "microsoft ava online (natural)",
  "google uk english female",
  "google us english",
  "samantha (enhanced)",
  "ava (enhanced)",
  "allison (enhanced)",
  "samantha",
  "ava",
  "siri",
  "karen",
  "serena",
  "moira",
  "tessa",
  "neerja",
  "aria",
  "jenny",
  "zira",
];

const HIGH_PRIORITY_TAMIL_VOICES: string[] = [
  "microsoft pallavi online (natural)",
  "microsoft valluvar online (natural)",
  "google தமிழ்",
  "google tamil",
  "pallavi",
  "saranya",
  "kani",
  "vani",
  "valluvar",
];

const SOFT_CLEAR_VOICE_KEYWORDS: string[] = [
  "natural",
  "high-quality",
  "high quality",
  "neural",
  "online",
  "soft",
  "female",
  "google",
  "premium",
  "enhanced",
  "wavenet",
  "studio",
  // English soft/clear female & assistant voices
  "aria",
  "jenny",
  "neerja",
  "sonia",
  "libby",
  "clara",
  "ava",
  "samantha",
  "siri",
  "allison",
  "serena",
  "karen",
  "moira",
  "tessa",
  "victoria",
  "zira",
  "heera",
  "natasha",
  // Tamil voices
  "pallavi",
  "valluvar",
  "saranya",
  "kani",
  "vani",
  "tamil",
  "தமிழ்",
  // Hindi voices
  "swara",
  "lekha",
  "हिन्दी",
  // Spanish voices
  "elvira",
  "dalia",
  "paulina",
  "monica",
  "mónica",
  "helena",
  "sabina",
  // French voices
  "denise",
  "eloise",
  "amelie",
  "amélie",
  "audrey",
  "hortense",
  "julie",
  // German voices
  "katja",
  "amala",
  "anna",
  "hedda",
  // Chinese voices
  "xiaoxiao",
  "xiaoyi",
  "ting-ting",
  "tingting",
  "meijia",
  "yaoyao",
  "huihui",
];

/**
 * Indicators used to filter specifically for 'high-quality' or 'natural' browser voices
 */
const HIGH_QUALITY_NATURAL_MARKERS: string[] = [
  "natural",
  "high-quality",
  "high quality",
  "neural",
  "enhanced",
  "premium",
  "wavenet",
  "studio",
  "online",
  "google",
  "siri",
  "samantha",
  "aria",
  "jenny",
  "sonia",
  "libby",
  "clara",
  "ava",
  "allison",
  "serena",
  "karen",
  "moira",
  "tessa",
  "neerja",
  "pallavi",
  "valluvar",
  "swara",
  "elvira",
  "denise",
  "katja",
  "xiaoxiao",
];

const HARSH_OR_ROBOTIC_VOICE_KEYWORDS: string[] = [
  "compact",
  "espeak",
  "festival",
  "fred",
  "albert",
  "bad news",
  "bahh",
  "bells",
  "boing",
  "bubbles",
  "cellos",
  "deranged",
  "good news",
  "hysterical",
  "junior",
  "organ",
  "superstar",
  "trinoids",
  "whisper",
  "wobble",
  "zarvox",
  "david",
  "mark",
  "richard",
  "george",
  "stefan",
];

/**
 * Replaces structured UI section headers with warm, polite spoken transitions
 * before stripping emojis and formatting symbols.
 */
function replaceSectionLabelsWithSpokenTransitions(text: string, baseLang: string): string {
  let result = text;

  if (baseLang === "ta") {
    result = result
      .replace(/(?:🌱\s*)?பதில்\s*[:：]\s*/gi, "இதற்கான விவரம் இதோ. ")
      .replace(/(?:💡\s*)?செய்ய வேண்டியவை\s*[:：]\s*/gi, "நீங்கள் செய்யக்கூடிய எளிய வழிகள். ")
      .replace(/(?:⚠️\s*)?கவனிக்க வேண்டியவை\s*[:：]\s*/gi, "இதையும் அன்புடன் கவனத்தில் கொள்ளுங்கள். ");
  } else if (baseLang === "es") {
    result = result
      .replace(/(?:🌱\s*)?Respuesta\s*[:：]\s*/gi, "Esto es lo que encontré. ")
      .replace(/(?:💡\s*)?Qué hacer\s*[:：]\s*/gi, "Esto es lo que puedes hacer. ")
      .replace(/(?:⚠️\s*)?(?:Precaución|Atención|Qué vigilar)\s*[:：]\s*/gi, "Por favor, ten en cuenta también esto. ");
  } else if (baseLang === "hi") {
    result = result
      .replace(/(?:🌱\s*)?उत्तर\s*[:：]\s*/gi, "यहाँ जानकारी दी गई है। ")
      .replace(/(?:💡\s*)?क्या करें\s*[:：]\s*/gi, "आप यह कदम उठा सकते हैं। ")
      .replace(/(?:⚠️\s*)?ध्यान दें\s*[:：]\s*/gi, "कृपया इस बात का भी ध्यान रखें। ");
  } else if (baseLang === "fr") {
    result = result
      .replace(/(?:🌱\s*)?Réponse\s*[:：]\s*/gi, "Voici ce que j'ai trouvé. ")
      .replace(/(?:💡\s*)?Que faire\s*[:：]\s*/gi, "Voici ce que vous pouvez faire. ")
      .replace(/(?:⚠️\s*)?À surveiller\s*[:：]\s*/gi, "Veuillez également surveiller ceci. ");
  } else if (baseLang === "de") {
    result = result
      .replace(/(?:🌱\s*)?Antwort\s*[:：]\s*/gi, "Hier ist, was ich gefunden habe. ")
      .replace(/(?:💡\s*)?Was zu tun ist\s*[:：]\s*/gi, "Das können Sie tun. ")
      .replace(/(?:⚠️\s*)?Worauf Sie achten sollten\s*[:：]\s*/gi, "Bitte achten Sie auch hierauf. ");
  } else if (baseLang === "zh") {
    result = result
      .replace(/(?:🌱\s*)?解答\s*[:：]\s*/gi, "以下是我的分析。 ")
      .replace(/(?:💡\s*)?护理建议\s*[:：]\s*/gi, "您可以采取以下步骤。 ")
      .replace(/(?:⚠️\s*)?注意事项\s*[:：]\s*/gi, "同时也请留意以下情况。 ");
  }

  // Always also handle English headers in case mixed or default template is used
  result = result
    .replace(/(?:🌱\s*)?Answer\s*[:：]\s*/gi, "Here is what I found. ")
    .replace(/(?:💡\s*)?What to do\s*[:：]\s*/gi, "Here is what you can do. ")
    .replace(/(?:⚠️\s*)?Watch(?: out)? for\s*[:：]\s*/gi, "Please also watch out for this. ");

  return result;
}

/**
 * Softens harsh imperative or alarming phrasing in spoken output so the voice
 * always sounds polite, calm, supportive, and reassuring.
 * Note: Only modifies the text sent to SpeechSynthesis, never the visible UI.
 */
function softenSpokenTone(text: string, baseLang: string): string {
  if (baseLang !== "en") return text;

  return (
    text
      // Convert common "Do not <verb>" imperatives into polite "Please avoid <gerund>" or "Please try not to <verb>"
      .replace(/\bDo not overwater\b/gi, "Please avoid overwatering")
      .replace(/\bDon't overwater\b/gi, "Please avoid overwatering")
      .replace(/\bDo not water\b/gi, "Please avoid watering")
      .replace(/\bDon't water\b/gi, "Please avoid watering")
      .replace(/\bDo not fertilize\b/gi, "Please avoid fertilizing")
      .replace(/\bDo not apply\b/gi, "Please avoid applying")
      .replace(/\bDo not use\b/gi, "Please avoid using")
      .replace(/\bDo not place\b/gi, "Please avoid placing")
      .replace(/\bDo not expose\b/gi, "Please avoid exposing")
      .replace(/\bDo not leave\b/gi, "Please avoid leaving")
      .replace(/\bDo not let\b/gi, "Please try not to let")
      .replace(/(^|[.!?]\s+)Do not\s+/g, "$1Please try not to ")
      .replace(/(^|[.!?]\s+)Don't\s+/g, "$1Please try not to ")
      .replace(/\bdo not\s+/g, "please try not to ")
      .replace(/\bdon't\s+/g, "please try not to ")
      // Soften "Warning" / "Error" / "Immediately"
      .replace(/\bWarning\s*[:：]\s*/gi, "Please watch for ")
      .replace(/\bWarning\b/gi, "Please watch for")
      .replace(/\bError\s*[:：]\s*/gi, "Please check ")
      .replace(/\bError\b/gi, "Please check")
      .replace(/\bImmediately\b/g, "As soon as possible")
      .replace(/\bimmediately\b/g, "as soon as possible")
  );
}

/**
 * Prepares raw UI or AI text for polite, soft, natural Text-to-Speech delivery:
 * 1. Replaces structured section labels (🌱 Answer:, 💡 What to do:, ⚠️ Watch for:) with natural spoken transitions
 * 2. Removes all emojis and pictographs so TTS never reads emoji names aloud
 * 3. Strips markdown symbols (*, **, #, `, -, •)
 * 4. Converts bullet items into complete short sentences ending with periods
 * 5. Softens harsh phrasing ("Do not" -> "Please avoid" / "Please try not to", "Immediately" -> "As soon as possible")
 * 6. Normalizes ranges, units, and punctuation for smooth breathing pauses
 */
export function preparePoliteSpeechText(text: string, language?: string): string {
  if (!text) return "";

  const locale = getSpeechLocale(language).toLowerCase();
  const baseLang = locale.split("-")[0];
  const isTamil = baseLang === "ta";

  // Step 1: Replace section headers with polite spoken transitions
  let prepared = replaceSectionLabelsWithSpokenTransitions(text, baseLang);

  // Step 2: Convert bullet lines into distinct short sentences with periods
  const lines = prepared.split(/\r?\n/);
  const processedLines: string[] = [];

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Strip markdown heading hashes and bullet markers
    const wasBullet = /^[•●▪▸►\-*]\s+/.test(line);
    line = line
      .replace(/^#{1,6}\s+/, "")
      .replace(/^[•●▪▸►\-*]\s+/, "")
      .trim();

    if (!line) continue;

    // Ensure bullet points and standalone lines end with a clean sentence boundary
    if (wasBullet || !/[.!?।。:：,，;；]$/.test(line)) {
      line = `${line}.`;
    }
    processedLines.push(line);
  }

  prepared = processedLines.join(" ");

  // Step 3: Remove all emojis, variation selectors, and pictographs so TTS never reads emoji names aloud
  prepared = prepared
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1FA00}-\u{1FAFF}\u{2300}-\u{23FF}\u{2B50}\u{FE0F}\u{200D}]/gu,
      " "
    )
    // Remove markdown bold/italic/code/strikethrough symbols
    .replace(/\*\*|__|~~|`+/g, "")
    .replace(/\s*\*\s*/g, " ")
    // Convert inline bullet dots or arrows into gentle pauses
    .replace(/\s*[•●▪▸►·]\s*/g, ". ")
    .replace(/[↑↓→←]/g, " ");

  // Step 4: Expand temperature, measurement, and numeric ranges for natural pronunciation
  prepared = prepared
    .replace(
      /(\d+)\s*°\s*C\s*[–—-]\s*(\d+)\s*°\s*C/gi,
      isTamil ? "$1 முதல் $2 டிகிரி செல்சியஸ்" : "$1 to $2 degrees Celsius"
    )
    .replace(
      /(\d+)\s*°\s*F\s*[–—-]\s*(\d+)\s*°\s*F/gi,
      isTamil ? "$1 முதல் $2 டிகிரி பாரன்ஹீட்" : "$1 to $2 degrees Fahrenheit"
    )
    .replace(/(\d+)\s*°\s*C/gi, isTamil ? "$1 டிகிரி செல்சியஸ்" : "$1 degrees Celsius")
    .replace(/(\d+)\s*°\s*F/gi, isTamil ? "$1 டிகிரி பாரன்ஹீட்" : "$1 degrees Fahrenheit")
    .replace(/(\d+)\s*[–—-]\s*(\d+)/g, isTamil ? "$1 முதல் $2" : "$1 to $2")
    .replace(/\b(\d+)\s*cm\b/gi, isTamil ? "$1 சென்டிமீட்டர்" : "$1 centimeters")
    .replace(/\bN-P-K\b/gi, "N P K");

  // Step 5: Soften harsh imperatives into polite, reassuring phrasing
  prepared = softenSpokenTone(prepared, baseLang);

  // Step 6: Smooth out colons, slashes, and duplicate punctuation for natural pauses
  prepared = prepared
    .replace(/\s*[:：]\s*/g, ". ")
    .replace(/\s*\/\s*/g, ", ")
    .replace(/([.!?।。])\s*\.+/g, "$1 ")
    .replace(/\.\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*\./g, ". ")
    .replace(/\s{2,}/g, " ")
    .replace(/^\.\s*/, "")
    .trim();

  return prepared;
}

/**
 * Alias kept for backward compatibility across the project.
 */
export function formatTextForSoftClearSpeech(text: string, langCode?: string): string {
  return preparePoliteSpeechText(text, langCode);
}

/**
 * Splits prepared speech into calm, bite-sized sentence chunks so TTS speaks
 * sentence by sentence with natural breathing pauses (`150ms–200ms`) between thoughts.
 */
export function splitIntoPoliteSpeechChunks(text: string, maxChunkLength = 155): string[] {
  const cleaned = text.trim();
  if (!cleaned) return [];

  // Split on sentence boundaries while keeping punctuation attached
  const rawSentences = cleaned
    .split(/(?<=[.!?।。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const sentence of rawSentences) {
    if (sentence.length <= maxChunkLength) {
      chunks.push(sentence);
    } else {
      // Sub-split very long sentences on commas or semicolons so the voice never rushes
      const clauses = sentence
        .split(/(?<=[,;，；])\s+/)
        .map((c) => c.trim())
        .filter(Boolean);

      let current = "";
      for (const clause of clauses) {
        if (!current) {
          current = clause;
        } else if (current.length + 1 + clause.length <= maxChunkLength) {
          current = `${current} ${clause}`;
        } else {
          chunks.push(current);
          current = clause;
        }
      }
      if (current) {
        chunks.push(current);
      }
    }
  }

  return chunks.length > 0 ? chunks : [cleaned];
}

class TextToSpeechManager {
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private voiceListeners: Set<(voices: SpeechSynthesisVoice[]) => void> = new Set();
  private activeSessionId = 0;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private activeOnEnd: (() => void) | null = null;
  private isPausedState = false;
  private pendingNextChunkFn: (() => void) | null = null;

  constructor() {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window && window.speechSynthesis) {
        const synth = window.speechSynthesis;
        const handleVoicesChanged = () => {
          try {
            const list = synth.getVoices();
            if (list && list.length > 0) {
              this.cachedVoices = list;
              this.voicesLoaded = true;
              this.voiceListeners.forEach((listener) => {
                try {
                  listener(list);
                } catch {
                  // ignore
                }
              });
            }
          } catch {
            // ignore
          }
        };

        // Initial synchronous attempt
        handleVoicesChanged();

        // Listen for asynchronous voice list population
        try {
          if (typeof synth.addEventListener === "function") {
            synth.addEventListener("voiceschanged", handleVoicesChanged);
          } else if ("onvoiceschanged" in synth) {
            synth.onvoiceschanged = handleVoicesChanged;
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  }

  onVoicesChanged(listener: (voices: SpeechSynthesisVoice[]) => void): () => void {
    this.voiceListeners.add(listener);
    const current = this.getVoices();
    if (current.length > 0) {
      listener(current);
    }
    return () => {
      this.voiceListeners.delete(listener);
    };
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!isSpeechSynthesisSupported()) return [];
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.cachedVoices = voices;
        this.voicesLoaded = true;
        return voices;
      }
      return this.cachedVoices;
    } catch {
      return this.cachedVoices;
    }
  }

  ensureVoicesLoaded(timeoutMs = 350): Promise<SpeechSynthesisVoice[]> {
    if (!isSpeechSynthesisSupported()) return Promise.resolve([]);
    const existing = this.getVoices();
    if (existing.length > 0) {
      return Promise.resolve(existing);
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (voices: SpeechSynthesisVoice[]) => {
        if (settled) return;
        settled = true;
        unsubscribe();
        clearTimeout(timer);
        resolve(voices);
      };

      const unsubscribe = this.onVoicesChanged((voices) => {
        if (voices.length > 0) {
          finish(voices);
        }
      });

      const timer = setTimeout(() => {
        finish(this.getVoices());
      }, timeoutMs);
    });
  }

  /**
   * Checks whether a browser voice is a 'high-quality' or 'natural' voice
   * and not a harsh/robotic synthesis engine.
   */
  isHighQualityOrNaturalVoice(voice: SpeechSynthesisVoice): boolean {
    const nameLower = `${voice.name} ${voice.voiceURI}`.toLowerCase();

    for (const badKw of HARSH_OR_ROBOTIC_VOICE_KEYWORDS) {
      if (nameLower.includes(badKw)) {
        return false;
      }
    }

    for (const marker of HIGH_QUALITY_NATURAL_MARKERS) {
      if (nameLower.includes(marker)) {
        return true;
      }
    }

    return voice.localService === false;
  }

  /**
   * Filters a list of candidate voices to prefer 'high-quality' or 'natural' browser voices.
   * Falls back to non-robotic voices, or all candidate voices if none match.
   */
  filterHighQualityVoices(candidates: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    if (candidates.length <= 1) return candidates;

    const highQuality = candidates.filter((v) => this.isHighQualityOrNaturalVoice(v));
    if (highQuality.length > 0) {
      return highQuality;
    }

    const nonRobotic = candidates.filter((v) => {
      const nameLower = `${v.name} ${v.voiceURI}`.toLowerCase();
      return !HARSH_OR_ROBOTIC_VOICE_KEYWORDS.some((bad) => nameLower.includes(bad));
    });

    return nonRobotic.length > 0 ? nonRobotic : candidates;
  }

  /**
   * Scores a browser SpeechSynthesisVoice for polite warmth, softness, naturalness, and clarity.
   */
  scoreVoiceQuality(
    voice: SpeechSynthesisVoice,
    targetBcp47: string,
    baseLang: string
  ): number {
    const normLang = voice.lang.replace("_", "-").toLowerCase();
    const nameLower = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    let score = 0;

    // 1. Language & regional match priority
    if (normLang === targetBcp47) {
      score += 110;
    } else if (
      baseLang === "en" &&
      (normLang === "en-in" || normLang === "en-us" || normLang === "en-gb")
    ) {
      score += 95;
    } else if (normLang === baseLang || normLang.startsWith(`${baseLang}-`)) {
      score += 80;
    } else if (
      baseLang === "ta" &&
      (nameLower.includes("tamil") || voice.name.includes("தமிழ்"))
    ) {
      score += 95;
    }

    // 2. Top-tier named English / Tamil natural voices
    if (baseLang === "en") {
      for (let i = 0; i < HIGH_PRIORITY_ENGLISH_VOICES.length; i++) {
        if (nameLower.includes(HIGH_PRIORITY_ENGLISH_VOICES[i])) {
          score += 130 - i * 3;
          break;
        }
      }
    } else if (baseLang === "ta") {
      for (let i = 0; i < HIGH_PRIORITY_TAMIL_VOICES.length; i++) {
        if (nameLower.includes(HIGH_PRIORITY_TAMIL_VOICES[i])) {
          score += 130 - i * 5;
          break;
        }
      }
    }

    // 3. Neural / Natural / High-Quality high-definition voices
    if (
      nameLower.includes("natural") ||
      nameLower.includes("neural") ||
      nameLower.includes("high-quality") ||
      nameLower.includes("high quality")
    ) {
      score += 150;
    }
    if (
      nameLower.includes("online") ||
      nameLower.includes("premium") ||
      nameLower.includes("enhanced") ||
      nameLower.includes("wavenet") ||
      nameLower.includes("studio") ||
      nameLower.includes("soft")
    ) {
      score += 100;
    }
    if (nameLower.includes("google")) {
      score += 80;
    }

    // 4. Cloud-streamed high-clarity voices over legacy robotic local voices
    if (voice.localService === false) {
      score += 45;
    }

    // 5. General soft, warm, articulate voice markers
    for (const kw of SOFT_CLEAR_VOICE_KEYWORDS) {
      if (nameLower.includes(kw)) {
        score += 45;
        break;
      }
    }

    // 6. Soft female voice preference for calm assistant timbre
    if (nameLower.includes("female")) {
      score += 40;
    }

    // 7. Heavy penalty for harsh, metallic, robotic, or novelty voices
    for (const badKw of HARSH_OR_ROBOTIC_VOICE_KEYWORDS) {
      if (nameLower.includes(badKw)) {
        score -= 150;
      }
    }

    if (voice.default) {
      score += 10;
    }

    return score;
  }

  /**
   * Returns voices matching the language, prioritizing 'high-quality' or 'natural' voices first,
   * sorted from softest & most natural to standard.
   */
  getRankedVoicesForLanguage(
    langCodeOrLocale?: string,
    voicesList?: SpeechSynthesisVoice[]
  ): SpeechSynthesisVoice[] {
    const voices = voicesList ?? this.getVoices();
    if (!voices.length) return [];

    const targetBcp47 = getSpeechLocale(langCodeOrLocale).toLowerCase();
    const baseLang = targetBcp47.split("-")[0];

    const matching = voices.filter((v) => {
      const norm = v.lang.replace("_", "-").toLowerCase();
      if (norm === targetBcp47 || norm === baseLang || norm.startsWith(`${baseLang}-`)) {
        return true;
      }
      if (baseLang === "ta") {
        const nameLower = `${v.name} ${v.voiceURI}`.toLowerCase();
        return nameLower.includes("tamil") || v.name.includes("தமிழ்");
      }
      return false;
    });

    if (!matching.length) return [];

    // Filter for high-quality or natural voices first, while keeping remaining non-robotic voices after
    const highQualityPool = this.filterHighQualityVoices(matching);
    const highQualitySet = new Set(highQualityPool);
    const remainingPool = matching.filter((v) => !highQualitySet.has(v));

    const sortByScore = (list: SpeechSynthesisVoice[]) =>
      [...list].sort(
        (a, b) =>
          this.scoreVoiceQuality(b, targetBcp47, baseLang) -
          this.scoreVoiceQuality(a, targetBcp47, baseLang)
      );

    return [...sortByScore(highQualityPool), ...sortByScore(remainingPool)];
  }

  /**
   * Searches available browser voices for the softest, clearest Tamil voice using:
   * 1. "ta-IN" (exact locale match)
   * 2. "ta" (language code / prefix match)
   * 3. Google Tamil / Microsoft Valluvar / Pallavi / "Tamil" / "தமிழ்"
   */
  findTamilVoice(voicesList?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const rankedTamil = this.getRankedVoicesForLanguage("ta-IN", voicesList);
    return rankedTamil[0] || null;
  }

  /**
   * Fallback order if exact language voice is not available:
   * 1. Soft Indian English voice ("en-IN")
   * 2. Soft US/UK English voice ("en-US" / "en-GB")
   * 3. Default browser voice
   */
  hasNativeVoiceForLanguage(langCode: string): boolean {
    const voices = this.getVoices();
    if (!voices.length) return false;
    const targetBcp47 = getSpeechLocale(langCode).toLowerCase();
    const baseLang = targetBcp47.split("-")[0];
    return voices.some((v) => {
      const vLang = v.lang.replace("_", "-").toLowerCase();
      const nameLower = `${v.name} ${v.voiceURI}`.toLowerCase();
      if (vLang === targetBcp47 || vLang.startsWith(`${baseLang}-`) || vLang === baseLang) {
        return true;
      }
      if (baseLang === "ta" && (nameLower.includes("tamil") || v.name.includes("தமிழ்"))) return true;
      if (baseLang === "hi" && (nameLower.includes("hindi") || v.name.includes("हिन्दी"))) return true;
      if (baseLang === "te" && (nameLower.includes("telugu") || v.name.includes("తెలుగు"))) return true;
      if (baseLang === "ml" && (nameLower.includes("malayalam") || v.name.includes("മലയാളം"))) return true;
      if (baseLang === "kn" && (nameLower.includes("kannada") || v.name.includes("ಕನ್ನಡ"))) return true;
      if (baseLang === "bn" && (nameLower.includes("bengali") || v.name.includes("বাংলা"))) return true;
      if (baseLang === "mr" && (nameLower.includes("marathi") || v.name.includes("मराठी"))) return true;
      if (baseLang === "gu" && (nameLower.includes("gujarati") || v.name.includes("ગુજરાતી"))) return true;
      return false;
    });
  }

  findFallbackVoice(voicesList?: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const voices = voicesList ?? this.getVoices();
    if (!voices.length) return null;

    // 1. Soft high-quality en-IN voice
    const enInVoices = this.filterHighQualityVoices(
      voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === "en-in")
    );
    if (enInVoices.length > 0) {
      enInVoices.sort(
        (a, b) =>
          this.scoreVoiceQuality(b, "en-in", "en") -
          this.scoreVoiceQuality(a, "en-in", "en")
      );
      return enInVoices[0];
    }

    // 2. Ranked soft high-quality English voices (en-US, en-GB, etc.)
    const englishVoices = this.getRankedVoicesForLanguage("en-US", voices);
    if (englishVoices.length > 0) {
      return englishVoices[0];
    }

    // 3. Any high-quality/natural voice or default browser voice
    const highQualityAny = this.filterHighQualityVoices(voices);
    const defaultVoice =
      highQualityAny.find((v) => v.default) || voices.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    return highQualityAny[0] || voices[0] || null;
  }

  findBestVoice(langCodeOrLocale?: string): VoiceMatchResult {
    const voices = this.getVoices();
    if (!voices.length) {
      return {
        voice: null,
        isExactMatch: false,
        isFallback: false,
        voicesLoaded: this.voicesLoaded,
      };
    }

    const targetBcp47 = getSpeechLocale(langCodeOrLocale).toLowerCase();
    const baseLang = targetBcp47.split("-")[0];
    const settings = getStoredSpeechSettings();

    // 1. User's explicitly chosen voice if it matches the active language
    if (settings.preferredVoiceURI) {
      const preferred = voices.find((v) => v.voiceURI === settings.preferredVoiceURI);
      if (preferred && preferred.lang.replace("_", "-").toLowerCase().startsWith(baseLang)) {
        return {
          voice: preferred,
          isExactMatch: true,
          isFallback: false,
          voicesLoaded: true,
        };
      }
    }

    // 2. Dedicated Tamil voice search ("ta-IN", "ta", "Tamil") ranked by softness & clarity
    if (baseLang === "ta") {
      const tamilVoice = this.findTamilVoice(voices);
      if (tamilVoice) {
        return {
          voice: tamilVoice,
          isExactMatch: true,
          isFallback: false,
          voicesLoaded: true,
        };
      }

      const fallback = this.findFallbackVoice(voices);
      return {
        voice: fallback,
        isExactMatch: false,
        isFallback: true,
        voicesLoaded: true,
      };
    }

    // 3. Ranked soft & clear voices for the target language (en, es, hi, fr, de, zh)
    const rankedMatches = this.getRankedVoicesForLanguage(targetBcp47, voices);
    if (rankedMatches.length > 0) {
      return {
        voice: rankedMatches[0],
        isExactMatch: true,
        isFallback: false,
        voicesLoaded: true,
      };
    }

    // 4. Graceful fallback to softest available English or default voice
    const fallback = this.findFallbackVoice(voices);
    return {
      voice: fallback,
      isExactMatch: false,
      isFallback: true,
      voicesLoaded: true,
    };
  }

  hasLanguageVoice(langCodeOrLocale?: string): boolean {
    const { isExactMatch, voice } = this.findBestVoice(langCodeOrLocale);
    return Boolean(voice && isExactMatch);
  }

  private notifyAndClearPreviousOnEnd() {
    if (this.activeOnEnd) {
      const prev = this.activeOnEnd;
      this.activeOnEnd = null;
      try {
        prev();
      } catch {
        // ignore
      }
    }
  }

  speak(
    text: string,
    optionsOrOnEnd?: SpeakOptions | (() => void),
    onErrorCallback?: () => void,
    explicitLang?: string
  ) {
    let opts: SpeakOptions = {};
    if (typeof optionsOrOnEnd === "function") {
      opts = {
        onEnd: optionsOrOnEnd,
        onError: onErrorCallback ? () => onErrorCallback() : undefined,
        lang: explicitLang,
      };
    } else if (optionsOrOnEnd) {
      opts = optionsOrOnEnd;
    }

    if (!isSpeechSynthesisSupported() || !text) {
      opts.onEnd?.();
      return;
    }

    const settings = getStoredSpeechSettings();
    if (!settings.audioOutputEnabled) {
      opts.onEnd?.();
      return;
    }

    // Cleanly end any previous active speech session so buttons never overlap or stay stuck
    const sessionId = ++this.activeSessionId;
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    this.isPausedState = false;
    this.pendingNextChunkFn = null;
    this.notifyAndClearPreviousOnEnd();
    this.activeOnEnd = opts.onEnd || null;

    const finishSession = () => {
      if (sessionId !== this.activeSessionId) return;
      this.isPausedState = false;
      this.pendingNextChunkFn = null;
      if (this.activeOnEnd) {
        const endFn = this.activeOnEnd;
        this.activeOnEnd = null;
        endFn();
      }
    };

    const executeSpeak = (voices: SpeechSynthesisVoice[]) => {
      if (sessionId !== this.activeSessionId) return;

      try {
        window.speechSynthesis.cancel();

        const targetLocale = getSpeechLocale(opts.lang);
        const isTamil = targetLocale.toLowerCase().startsWith("ta");

        const preset =
          VOICE_TONE_PRESETS[settings.voiceTone || "soft-clear"] ||
          VOICE_TONE_PRESETS["soft-clear"];

        // Enforce calm, polite, soft speech ranges:
        // Default: rate = 0.9, pitch = 1.0, volume = 0.8
        const rawRate = opts.rate ?? settings.speechRate ?? preset.rate ?? DEFAULT_SPEECH_RATE;
        const rate = Math.max(0.75, Math.min(1.05, rawRate));

        const rawPitch = opts.pitch ?? settings.speechPitch ?? preset.pitch ?? DEFAULT_SPEECH_PITCH;
        const pitch = Math.max(0.85, Math.min(1.1, rawPitch));

        const rawVolume = opts.volume ?? settings.speechVolume ?? preset.volume ?? DEFAULT_SPEECH_VOLUME;
        const volume = Math.max(0.5, Math.min(1.0, rawVolume));

        // Prepare polite, emoji-free, natural speech text
        const politeText = preparePoliteSpeechText(text, targetLocale);
        if (!politeText) {
          finishSession();
          return;
        }

        const chunks = splitIntoPoliteSpeechChunks(politeText, 155);
        const match = this.findBestVoice(targetLocale);

        if (!match.isExactMatch && isTamil && voices.length > 0) {
          opts.onVoiceFallbackWarning?.(
            "No dedicated Tamil (ta-IN) voice was found on this device. Using a soft fallback voice."
          );
        }

        let currentChunkIndex = 0;
        let retriedWithFallback = false;

        const speakNextChunk = (useFallbackVoice = false) => {
          if (sessionId !== this.activeSessionId) return;
          if (this.isPausedState) {
            this.pendingNextChunkFn = () => speakNextChunk(useFallbackVoice);
            return;
          }

          if (currentChunkIndex >= chunks.length) {
            finishSession();
            return;
          }

          const chunkText = chunks[currentChunkIndex];
          const utterance = new SpeechSynthesisUtterance(chunkText);
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.volume = volume;

          if (useFallbackVoice) {
            const fallbackVoice = this.findFallbackVoice(voices);
            if (fallbackVoice) {
              utterance.voice = fallbackVoice;
              utterance.lang = fallbackVoice.lang || "en-US";
            } else {
              utterance.lang = "en-US";
            }
          } else if (match.voice && match.isExactMatch) {
            utterance.voice = match.voice;
            utterance.lang = match.voice.lang || targetLocale;
          } else if (isTamil) {
            if (match.voice) {
              utterance.voice = match.voice;
              utterance.lang = targetLocale;
            } else {
              utterance.lang = targetLocale;
            }
          } else if (match.voice) {
            utterance.voice = match.voice;
            utterance.lang = match.voice.lang || targetLocale;
          } else {
            utterance.lang = targetLocale;
          }

          utterance.onend = () => {
            if (sessionId !== this.activeSessionId) return;
            currentChunkIndex += 1;
            if (currentChunkIndex < chunks.length) {
              // Natural 165ms breathing pause between sentence chunks
              const pauseMs = chunkText.length < 38 ? 195 : 165;
              if (this.isPausedState) {
                this.pendingNextChunkFn = () => speakNextChunk(useFallbackVoice);
                return;
              }
              this.chunkTimer = setTimeout(() => {
                this.chunkTimer = null;
                speakNextChunk(useFallbackVoice);
              }, pauseMs);
            } else {
              finishSession();
            }
          };

          utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            if (sessionId !== this.activeSessionId) return;
            if (event.error === "canceled" || event.error === "interrupted") {
              return;
            }

            if (!retriedWithFallback && !useFallbackVoice) {
              retriedWithFallback = true;
              speakNextChunk(true);
              return;
            }

            finishSession();
          };

          window.speechSynthesis.speak(utterance);
        };

        speakNextChunk(false);
      } catch {
        finishSession();
      }
    };

    const currentVoices = this.getVoices();
    if (currentVoices.length > 0) {
      executeSpeak(currentVoices);
    } else {
      this.ensureVoicesLoaded(350).then((loadedVoices) => {
        executeSpeak(loadedVoices);
      });
    }
  }

  pause() {
    if (!isSpeechSynthesisSupported()) return;
    this.isPausedState = true;
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    try {
      window.speechSynthesis.pause();
    } catch {
      // ignore
    }
  }

  resume() {
    if (!isSpeechSynthesisSupported()) return;
    this.isPausedState = false;
    try {
      window.speechSynthesis.resume();
    } catch {
      // ignore
    }
    if (this.pendingNextChunkFn && !window.speechSynthesis.speaking) {
      const next = this.pendingNextChunkFn;
      this.pendingNextChunkFn = null;
      next();
    }
  }

  stop() {
    this.activeSessionId += 1;
    this.isPausedState = false;
    this.pendingNextChunkFn = null;
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
    this.notifyAndClearPreviousOnEnd();
    if (!isSpeechSynthesisSupported()) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  getSampleText(langCode?: string): string {
    let storedLang: string | null = null;
    try {
      storedLang = safeLocalStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // ignore
    }
    const activeCode = langCode || storedLang || "en";
    const baseCode = activeCode.split("-")[0].toLowerCase();
    return SAMPLE_VOICE_TEXT[baseCode] || SAMPLE_VOICE_TEXT.en;
  }

  testVoice(
    langCode?: string,
    onEnd?: () => void,
    onWarning?: (msg: string) => void
  ) {
    const sampleText = this.getSampleText(langCode);
    let storedLang: string | null = null;
    try {
      storedLang = safeLocalStorage.getItem(LANGUAGE_STORAGE_KEY);
    } catch {
      // ignore
    }
    const activeCode = langCode || storedLang || "en";
    const baseCode = activeCode.split("-")[0].toLowerCase();

    this.speak(sampleText, {
      lang: getSpeechLocale(baseCode),
      onEnd,
      onError: () => onEnd?.(),
      onVoiceFallbackWarning: onWarning,
    });
  }
}

export const tts = new TextToSpeechManager();
