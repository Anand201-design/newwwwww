import { safeLocalStorage } from "../utils/safeStorage";

export type VoiceLanguageCode =
  | "en"
  | "ta"
  | "hi"
  | "te"
  | "ml"
  | "kn"
  | "bn"
  | "mr"
  | "gu"
  | "es"
  | "fr"
  | "de"
  | "zh";

export interface VoiceLanguageConfig {
  code: VoiceLanguageCode;
  bcp47: string;
  name: string;
  nativeName: string;
  badge: string;
  exampleQuestion: string;
  ttsSampleText: string;
  voiceKeywords: string[];
}

export const VOICE_LANGUAGES: VoiceLanguageConfig[] = [
  {
    code: "en",
    bcp47: "en-IN",
    name: "English",
    nativeName: "English",
    badge: "EN",
    exampleQuestion: "Why are my plant's leaves turning yellow?",
    ttsSampleText: "Your plant may need a little more water. Please check the top layer of the soil before watering.",
    voiceKeywords: ["english", "en-us", "en-in", "en-gb", "aria", "jenny", "neerja", "natural"],
  },
  {
    code: "ta",
    bcp47: "ta-IN",
    name: "Tamil",
    nativeName: "தமிழ்",
    badge: "தமிழ்",
    exampleQuestion: "என் செடியில் இலைகள் மஞ்சளாகிறது. என்ன செய்ய வேண்டும்?",
    ttsSampleText: "உங்கள் செடிக்குச் சற்று தண்ணீர் தேவைப்படலாம். தண்ணீர் ஊற்றும் முன் மேல் மண்ணின் ஈரப்பதத்தைச் சரிபார்க்கவும்.",
    voiceKeywords: ["tamil", "தமிழ்", "ta-in", "pallavi", "valluvar", "kani", "vani", "saranya"],
  },
  {
    code: "hi",
    bcp47: "hi-IN",
    name: "Hindi",
    nativeName: "हिन्दी",
    badge: "हिन्दी",
    exampleQuestion: "मेरे पौधे की पत्तियां पीली हो रही हैं, मुझे क्या करना चाहिए?",
    ttsSampleText: "आपके पौधे को थोड़े पानी की आवश्यकता हो सकती है। कृपया पानी देने से पहले मिट्टी की ऊपरी परत की जांच करें।",
    voiceKeywords: ["hindi", "हिन्दी", "hi-in", "swara", "madhur", "lekha", "kalpana", "hemant"],
  },
  {
    code: "te",
    bcp47: "te-IN",
    name: "Telugu",
    nativeName: "తెలుగు",
    badge: "తెలుగు",
    exampleQuestion: "నా మొక్క ఆకులు పసుపు రంగులోకి మారుతున్నాయి. నేను ఏమి చేయాలి?",
    ttsSampleText: "మీ మొక్కకు కొద్దిగా నీరు అవసరం కావచ్చు. నీరు పోసే ముందు మట్టిని ఒకసారి పరిశీలించండి.",
    voiceKeywords: ["telugu", "తెలుగు", "te-in", "mohan", "shruti", "chitra"],
  },
  {
    code: "ml",
    bcp47: "ml-IN",
    name: "Malayalam",
    nativeName: "മലയാളം",
    badge: "മലയാളം",
    exampleQuestion: "എന്റെ ചെടിയുടെ ഇലകൾ മഞ്ഞനിറമാകുന്നു. ഞാൻ എന്തുചെയ്യണം?",
    ttsSampleText: "നിങ്ങളുടെ ചെടിക്ക് കുറച്ച് വെള്ളം ആവശ്യമായി വന്നേക്കാം. നനയ്ക്കുന്നതിന് മുമ്പ് മണ്ണ് പരിശോധിക്കുക.",
    voiceKeywords: ["malayalam", "മലയാളം", "ml-in", "midhun", "sobhana"],
  },
  {
    code: "kn",
    bcp47: "kn-IN",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    badge: "ಕನ್ನಡ",
    exampleQuestion: "ನನ್ನ ಗಿಡದ ಎಲೆಗಳು ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುತ್ತಿವೆ. ನಾನೇನು ಮಾಡಬೇಕು?",
    ttsSampleText: "ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಸ್ವಲ್ಪ ನೀರು ಬೇಕಾಗಬಹುದು. ನೀರುಣಿಸುವ ಮೊದಲು ಮಣ್ಣಿನ ಮೇಲ್ಪದರವನ್ನು ಪರೀಕ್ಷಿಸಿ.",
    voiceKeywords: ["kannada", "ಕನ್ನಡ", "kn-in", "gagan", "sapna"],
  },
  {
    code: "bn",
    bcp47: "bn-IN",
    name: "Bengali",
    nativeName: "বাংলা",
    badge: "বাংলা",
    exampleQuestion: "আমার গাছের পাতা হলুদ হয়ে যাচ্ছে, এখন কি করা উচিত?",
    ttsSampleText: "আপনার গাছে কিছুটা জলের প্রয়োজন হতে পারে। জল দেওয়ার আগে মাটির ওপরের স্তর পরীক্ষা করুন।",
    voiceKeywords: ["bengali", "বাংলা", "bn-in", "bashkar", "tanishaa"],
  },
  {
    code: "mr",
    bcp47: "mr-IN",
    name: "Marathi",
    nativeName: "मराठी",
    badge: "मराठी",
    exampleQuestion: "माझ्या झाडाची पाने पिवळी पडत आहेत, मी काय करावे?",
    ttsSampleText: "तुमच्या झाडाला थोडे पाणी हवे असू शकते. पाणी देण्यापूर्वी मातीचा वरचा थर तपासा.",
    voiceKeywords: ["marathi", "मराठी", "mr-in", "aarohi", "manohar"],
  },
  {
    code: "gu",
    bcp47: "gu-IN",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    badge: "ગુજરાતી",
    exampleQuestion: "મારા છોડના પાંદડા પીળા પડી રહ્યા છે, મારે શું કરવું જોઈએ?",
    ttsSampleText: "તમારા છોડને થોડું પાણી જોઈ શકે છે. પાણી આપતા પહેલા માટીનું ઉપરનું સ્તર તપાસો.",
    voiceKeywords: ["gujarati", "ગુજરાતી", "gu-in", "dhwani", "niranjan"],
  },
];

export const VOICE_LANGUAGE_STORAGE_KEY = "plantcare_voice_lang";
export const AUTO_SPEAK_STORAGE_KEY = "plantcare_auto_speak";

export function getStoredVoiceLanguage(): VoiceLanguageCode {
  if (typeof window === "undefined") return "en";
  try {
    const stored = safeLocalStorage.getItem(VOICE_LANGUAGE_STORAGE_KEY);
    if (stored && VOICE_LANGUAGES.some((l) => l.code === stored)) {
      return stored as VoiceLanguageCode;
    }
    // Check if app language matches one of the voice languages
    const appLang = safeLocalStorage.getItem("plantcare_lang");
    if (appLang && VOICE_LANGUAGES.some((l) => l.code === appLang)) {
      return appLang as VoiceLanguageCode;
    }
  } catch {
    // ignore
  }
  return "en";
}

export function saveStoredVoiceLanguage(code: VoiceLanguageCode): void {
  if (typeof window !== "undefined") {
    try {
      safeLocalStorage.setItem(VOICE_LANGUAGE_STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }
}

export function getStoredAutoSpeak(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return safeLocalStorage.getItem(AUTO_SPEAK_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveStoredAutoSpeak(enabled: boolean): void {
  if (typeof window !== "undefined") {
    try {
      safeLocalStorage.setItem(AUTO_SPEAK_STORAGE_KEY, enabled ? "true" : "false");
    } catch {
      // ignore
    }
  }
}

export function getVoiceLanguageConfig(code: string): VoiceLanguageConfig {
  const found = VOICE_LANGUAGES.find((l) => l.code === code);
  return found || VOICE_LANGUAGES[0];
}
