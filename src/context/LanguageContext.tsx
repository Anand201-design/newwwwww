import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { DiagnosticResult, PlantProfileItem } from "../services/plantService";
import { safeLocalStorage } from "../utils/safeStorage";

export type SupportedLanguage = "en" | "es" | "hi" | "fr" | "de" | "zh" | "ta";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  shortLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English (EN)", shortLabel: "EN" },
  { code: "es", label: "Español (ES)", shortLabel: "ES" },
  { code: "hi", label: "हिन्दी (HI)", shortLabel: "HI" },
  { code: "fr", label: "Français (FR)", shortLabel: "FR" },
  { code: "de", label: "Deutsch (DE)", shortLabel: "DE" },
  { code: "zh", label: "中文 (ZH)", shortLabel: "ZH" },
  { code: "ta", label: "தமிழ் (TA)", shortLabel: "TA" },
];

export interface Translations {
  healthScore: string;
  confidence: string;
  disease: string;
  nutrition: string;
  recommendations: string;
  treatment: string;
  prevention: string;
  navDashboard: string;
  navIdentify: string;
  navDisease: string;
  navMyPlants: string;
  navHistory: string;
  navCare: string;
  navPlantTalk: string;
  navAssistant: string;
  navSettings: string;
  languageLabel: string;
  lightModeShort: string;
  darkModeShort: string;
  listen: string;
  pause: string;
  resume: string;
  stop: string;
  testVoice: string;
  tamilVoiceUnavailable: string;
}

const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    healthScore: "Plant Health Score",
    confidence: "Confidence",
    disease: "Primary Diagnosis",
    nutrition: "Nutritional Assessment",
    recommendations: "Care & Treatment Plan",
    treatment: "Recommended Treatment",
    prevention: "Long-Term Prevention",
    navDashboard: "Dashboard",
    navIdentify: "Identify Plant",
    navDisease: "Disease Detection",
    navMyPlants: "My Plants",
    navHistory: "Analysis History",
    navCare: "Care Recommendations",
    navPlantTalk: "Plant Talk",
    navAssistant: "AI Plant Assistant",
    navSettings: "Settings",
    languageLabel: "Language",
    lightModeShort: "Light",
    darkModeShort: "Dark",
    listen: "Listen",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    testVoice: "Test Voice",
    tamilVoiceUnavailable: "Tamil voice is not available on this device. Using default browser voice.",
  },
  es: {
    healthScore: "Puntuación de Salud",
    confidence: "Confianza",
    disease: "Diagnóstico Principal",
    nutrition: "Evaluación Nutricional",
    recommendations: "Plan de Cuidado y Tratamiento",
    treatment: "Tratamiento Recomendado",
    prevention: "Prevención a Largo Plazo",
    navDashboard: "Panel",
    navIdentify: "Identificar Planta",
    navDisease: "Detección de Enfermedades",
    navMyPlants: "Mis Plantas",
    navHistory: "Historial de Análisis",
    navCare: "Recomendaciones de Cuidado",
    navPlantTalk: "Charla de Plantas",
    navAssistant: "Asistente IA de Plantas",
    navSettings: "Ajustes",
    languageLabel: "Idioma",
    lightModeShort: "Claro",
    darkModeShort: "Oscuro",
    listen: "Escuchar",
    pause: "Pausar",
    resume: "Reanudar",
    stop: "Detener",
    testVoice: "Probar Voz",
    tamilVoiceUnavailable: "Tamil voice is not available.",
  },
  hi: {
    healthScore: "पौधे का स्वास्थ्य स्कोर",
    confidence: "विश्वास स्तर",
    disease: "मुख्य निदान",
    nutrition: "पोषण मूल्यांकन",
    recommendations: "देखभाल और उपचार योजना",
    treatment: "अनुशंसित उपचार",
    prevention: "दीर्घकालिक रोकथाम",
    navDashboard: "डैशबोर्ड",
    navIdentify: "पौधा पहचानें",
    navDisease: "रोग पहचान",
    navMyPlants: "मेरे पौधे",
    navHistory: "विश्लेषण इतिहास",
    navCare: "देखभाल सुझाव",
    navPlantTalk: "पौधे की बात",
    navAssistant: "AI पौधा सहायक",
    navSettings: "सेटिंग्स",
    languageLabel: "भाषा",
    lightModeShort: "लाइट",
    darkModeShort: "डार्क",
    listen: "सुनें",
    pause: "रोकें",
    resume: "जारी रखें",
    stop: "बंद करें",
    testVoice: "आवाज़ जांचें",
    tamilVoiceUnavailable: "Tamil voice is not available.",
  },
  fr: {
    healthScore: "Score de Santé",
    confidence: "Confiance",
    disease: "Diagnostic Principal",
    nutrition: "Évaluation Nutritionnelle",
    recommendations: "Plan de Soins et Traitement",
    treatment: "Traitement Recommandé",
    prevention: "Prévention à Long Terme",
    navDashboard: "Tableau de bord",
    navIdentify: "Identifier la Plante",
    navDisease: "Détection des Maladies",
    navMyPlants: "Mes Plantes",
    navHistory: "Historique d'Analyse",
    navCare: "Conseils de Soins",
    navPlantTalk: "Parole de Plante",
    navAssistant: "Assistant Plantes IA",
    navSettings: "Paramètres",
    languageLabel: "Langue",
    lightModeShort: "Clair",
    darkModeShort: "Sombre",
    listen: "Écouter",
    pause: "Pause",
    resume: "Reprendre",
    stop: "Arrêter",
    testVoice: "Tester la Voix",
    tamilVoiceUnavailable: "Tamil voice is not available.",
  },
  de: {
    healthScore: "Pflanzengesundheit",
    confidence: "Konfidenz",
    disease: "Hauptdiagnose",
    nutrition: "Nährstoffbewertung",
    recommendations: "Pflege- & Behandlungsplan",
    treatment: "Empfohlene Behandlung",
    prevention: "Langzeitprävention",
    navDashboard: "Dashboard",
    navIdentify: "Pflanze Erkennen",
    navDisease: "Krankheitserkennung",
    navMyPlants: "Meine Pflanzen",
    navHistory: "Analyseverlauf",
    navCare: "Pflegeempfehlungen",
    navPlantTalk: "Pflanzen-Talk",
    navAssistant: "KI-Pflanzenassistent",
    navSettings: "Einstellungen",
    languageLabel: "Sprache",
    lightModeShort: "Hell",
    darkModeShort: "Dunkel",
    listen: "Anhören",
    pause: "Pause",
    resume: "Fortsetzen",
    stop: "Stopp",
    testVoice: "Stimme Testen",
    tamilVoiceUnavailable: "Tamil voice is not available.",
  },
  zh: {
    healthScore: "植物健康评分",
    confidence: "置信度",
    disease: "主要诊断",
    nutrition: "营养评估",
    recommendations: "护理与治疗方案",
    treatment: "建议治疗措施",
    prevention: "长期预防措施",
    navDashboard: "仪表盘",
    navIdentify: "识别植物",
    navDisease: "病害检测",
    navMyPlants: "我的植物",
    navHistory: "分析历史",
    navCare: "护理建议",
    navPlantTalk: "植物心声",
    navAssistant: "AI 植物助手",
    navSettings: "设置",
    languageLabel: "语言",
    lightModeShort: "浅色",
    darkModeShort: "深色",
    listen: "朗读",
    pause: "暂停",
    resume: "继续",
    stop: "停止",
    testVoice: "测试语音",
    tamilVoiceUnavailable: "Tamil voice is not available.",
  },
  ta: {
    healthScore: "தாவர ஆரோக்கிய மதிப்பெண்",
    confidence: "நம்பகத்தன்மை",
    disease: "முதன்மை நோய் கண்டறிதல்",
    nutrition: "ஊட்டச்சத்து மதிப்பீடு",
    recommendations: "பராமரிப்பு மற்றும் சிகிச்சைத் திட்டம்",
    treatment: "பரிந்துரைக்கப்பட்ட சிகிச்சை",
    prevention: "நீண்டகால தடுப்பு முறைகள்",
    navDashboard: "முகப்புப் பலகை",
    navIdentify: "தாவரத்தை அடையாளம் காண்க",
    navDisease: "நோய் கண்டறிதல்",
    navMyPlants: "எனது தாவரங்கள்",
    navHistory: "பகுப்பாய்வு வரலாறு",
    navCare: "பராமரிப்பு பரிந்துரைகள்",
    navPlantTalk: "தாவர உரையாடல்",
    navAssistant: "AI தாவர உதவியாளர்",
    navSettings: "அமைப்புகள்",
    languageLabel: "மொழி",
    lightModeShort: "பகல்",
    darkModeShort: "இரவு",
    listen: "கேட்க",
    pause: "இடைநிறுத்து",
    resume: "தொடர்",
    stop: "நிறுத்து",
    testVoice: "குரல் சோதனை",
    tamilVoiceUnavailable: "தமிழ் குரல் இந்த சாதனத்தில் கிடைக்கவில்லை.",
  },
};

const TAMIL_DICTIONARY: Record<string, string> = {
  // Navigation & Sidebar
  "Dashboard": "முகப்புப் பலகை",
  "Identify Plant": "தாவரத்தை அடையாளம் காண்க",
  "Disease Detection": "நோய் கண்டறிதல்",
  "My Plants": "எனது தாவரங்கள்",
  "Analysis History": "பகுப்பாய்வு வரலாறு",
  "Care Recommendations": "பராமரிப்பு பரிந்துரைகள்",
  "Plant Talk": "தாவர உரையாடல்",
  "See what your plant may be telling you.": "உங்கள் தாவரம் உங்களிடம் என்ன சொல்லக்கூடும் என்பதைப் பாருங்கள்.",
  "Plant Talk is an AI-generated interpretation based on your plant's saved information and analysis history.":
    "தாவர உரையாடல் என்பது உங்கள் தாவரத்தின் சேமிக்கப்பட்ட தகவல்கள் மற்றும் பகுப்பாய்வு வரலாற்றின் அடிப்படையில் உருவாக்கப்பட்ட AI விளக்கமாகும்.",
  "Select a Plant": "ஒரு தாவரத்தைத் தேர்ந்தெடுக்கவும்",
  "Plant Nickname": "தாவர செல்லப்பெயர்",
  "Edit Nickname": "செல்லப்பெயரைத் திருத்து",
  "Save Nickname": "செல்லப்பெயரைச் சேமி",
  "Enter a friendly nickname (e.g. Milo)": "இனிய செல்லப்பெயரை உள்ளிடவும் (எ.கா. மிலோ)",
  "Plant Mood / Condition": "தாவர மனநிலை / நிலை",
  "Happy & Healthy": "மகிழ்ச்சி & ஆரோக்கியம்",
  "Thirsty": "தண்ணீர் தேவை",
  "Needs Sunlight": "சூரிய ஒளி தேவை",
  "Recovering": "குணமடைகிறது",
  "New Growth": "புதிய வளர்ச்சி",
  "Needs Nutrients": "ஊட்டச்சத்து தேவை",
  "Too Much Water": "அதிகப்படியான தண்ணீர்",
  "Wants a Quick Check-up": "விரைவான பரிசோதனை தேவை",
  "Today's Plant Message": "இன்றைய தாவரச் செய்தி",
  "Refresh Message": "செய்தியைப் புதுப்பி",
  "Why:": "ஏன்:",
  "What I need:": "எனக்கு என்ன தேவை:",
  "What helps me:": "எனக்கு உதவுவது:",
  "Please avoid:": "தவிர்க்க வேண்டியவை:",
  "Listen to Message": "செய்தியைக் கேட்க",
  "Plant Personality": "தாவர ஆளுமை",
  "Friendly Companion": "அன்பான தோழன்",
  "Calm & Wise": "அமைதியான & அறிவார்ந்த",
  "Playful Sprout": "சுறுசுறுப்பான தளிர்",
  "Expert Botanical Guide": "தாவரவியல் வழிகாட்டி",
  "Talk to Your Plant": "உங்கள் தாவரத்திடம் பேசுங்கள்",
  "Ask your plant how it's doing...": "உங்கள் தாவரத்தின் நலனைப் பற்றி கேளுங்கள்...",
  "How are you feeling today?": "இன்று நீ எப்படி இருக்கிறாய்?",
  "Do you need water today?": "இன்று உனக்கு தண்ணீர் தேவையா?",
  "Are you getting enough sunlight?": "உனக்கு போதுமான சூரிய ஒளி கிடைக்கிறதா?",
  "Why are your leaves changing color?": "உன் இலைகள் ஏன் நிறம் மாறுகின்றன?",
  "What can I do to help you grow better?": "நீ நன்றாக வளர நான் என்ன செய்யலாம்?",
  "Do you need fertilizer right now?": "இப்போது உனக்கு உரம் தேவையா?",
  "Are you recovering from your last issue?": "கடந்த பிரச்சினையிலிருந்து குணமடைந்து வருகிறாயா?",
  "Care Check-In": "பராமரிப்பு பதிவு",
  "Log an action you took today": "இன்று நீங்கள் செய்த பராமரிப்பைப் பதிவு செய்யுங்கள்",
  "I watered this plant": "நான் தண்ணீர் ஊற்றினேன்",
  "Moved to sunlight": "சூரிய ஒளியில் வைத்தேன்",
  "Added fertilizer": "உரம் இட்டேன்",
  "Trimmed damaged leaves": "சேதமடைந்த இலைகளை அகற்றினேன்",
  "Checked soil moisture": "மண் ஈரப்பதத்தைச் சரிபார்த்தேன்",
  "Inspect Leaf Now": "இப்போது இலையைப் பரிசோதிக்கவும்",
  "Plant Care Progress": "தாவர பராமரிப்பு முன்னேற்றம்",
  "Last Watered": "கடைசியாக நீர் ஊற்றியது",
  "Last Health Scan": "கடைசி ஆரோக்கியப் பரிசோதனை",
  "Care Actions This Week": "இந்த வார பராமரிப்புகள்",
  "No Plants Saved Yet": "இன்னும் தாவரங்கள் எதுவும் சேமிக்கப்படவில்லை",
  "Add a plant or identify one first to start hearing from your plants.":
    "உங்கள் தாவரங்களுடன் உரையாட முதலில் ஒரு தாவரத்தைச் சேர்க்கவும் அல்லது அடையாளம் காணவும்.",
  "Go to My Plants": "எனது தாவரங்களுக்குச் செல்",
  "Identify a Plant": "தாவரத்தை அடையாளம் காண்க",
  "Open Plant Talk": "தாவர உரையாடலைத் திற",
  "Talk to Plant": "தாவரத்திடம் பேசு",
  "Says:": "சொல்கிறது:",
  "AI Interpretation": "AI விளக்கம்",
  "Not logged yet": "இன்னும் பதிவு செய்யப்படவில்லை",
  "AI Plant Assistant": "AI தாவர உதவியாளர்",
  "Settings": "அமைப்புகள்",
  "Ask anything about your plant and get personalized care guidance.":
    "உங்கள் தாவரத்தைப் பற்றி எதையும் கேட்டு தனிப்பயனாக்கப்பட்ட பராமரிப்பு வழிகாட்டுதலைப் பெறுங்கள்.",
  "Ask something about your plant...": "உங்கள் தாவரத்தைப் பற்றி ஏதாவது கேளுங்கள்...",
  "Send": "அனுப்பு",
  "Select a plant": "ஒரு தாவரத்தைத் தேர்ந்தெடுக்கவும்",
  "General Plant Care (All Plants)": "பொதுத் தாவர பராமரிப்பு (அனைத்து தாவரங்களும்)",
  "Upload Image": "படத்தைப் பதிவேற்று",
  "Remove Image": "படத்தை அகற்று",
  "Clear Conversation": "உரையாடலை அழி",
  "Clear Conversation?": "உரையாடலை அழிக்கவா?",
  "This will clear the current chat messages. Your saved plants and analysis history will not be affected.":
    "இது தற்போதைய உரையாடல் செய்திகளை மட்டும் அழிக்கும். உங்கள் சேமிக்கப்பட்ட தாவரங்கள் மற்றும் பகுப்பாய்வு வரலாறு பாதிக்கப்படாது.",
  "Suggested Questions": "பரிந்துரைக்கப்பட்ட கேள்விகள்",
  "How often should I water my plant?": "எனது செடிக்கு எவ்வளவு அடிக்கடி தண்ணீர் ஊற்ற வேண்டும்?",
  "Why are my leaves turning yellow?": "எனது செடியின் இலைகள் ஏன் மஞ்சள் நிறமாக மாறுகின்றன?",
  "Does my plant need more sunlight?": "எனது செடிக்கு அதிக சூரிய ஒளி தேவையா?",
  "How can I improve my plant's growth?": "எனது செடியின் வளர்ச்சியை எவ்வாறு மேம்படுத்துவது?",
  "What fertilizer is suitable for my plant?": "எனது செடிக்கு எந்த உரம் பொருத்தமானது?",
  "What should I do if I see brown spots?": "இலைகளில் பழுப்பு நிறப் புள்ளிகள் இருந்தால் நான் என்ன செய்ய வேண்டும்?",
  "Using context from": "பயன்படுத்தப்படும் தாவர விவரம்:",
  "Thinking & analyzing plant guidance...": "தாவர பராமரிப்பு வழிகாட்டுதலை உருவாக்குகிறது...",
  "Attached Plant Photo": "இணைக்கப்பட்ட தாவரப் படம்",
  "Botanical Care Guidance": "தாவரவியல் பராமரிப்பு வழிகாட்டுதல்",
  "You": "நீங்கள்",
  "Plant Context Active": "தாவர விவரம் இணைக்கப்பட்டுள்ளது",
  "No specific plant selected": "குறிப்பிட்ட தாவரம் தேர்ந்தெடுக்கப்படவில்லை",
  "Analyze Photo in Full Diagnostics": "முழு நோய் கண்டறிதலில் படத்தை ஆய்வு செய்",
  "Botanical Health": "தாவரவியல் ஆரோக்கியம்",
  "Language": "மொழி",
  "Theme": "தோற்றம்",
  "Light": "பகல்",
  "Dark": "இரவு",
  "Auto": "தானியங்கி",
  "Botanical Collector": "தாவர சேகரிப்பாளர்",
  "Account Settings": "கணக்கு அமைப்புகள்",
  "Collection History": "சேகரிப்பு வரலாறு",

  // Dashboard Hero & Cards
  "Botanical Health & Diagnostics": "தாவரவியல் ஆரோக்கியம் & நோய் கண்டறிதல்",
  "Know Your Plant.": "உங்கள் தாவரத்தை அறிந்து கொள்ளுங்கள்.",
  "Keep It Healthy.": "அதை ஆரோக்கியமாக வைத்திருங்கள்.",
  "AI-powered plant identification, disease detection and personalized care insights.":
    "AI-ஆல் இயங்கும் தாவர அடையாளம் காணுதல், நோய் கண்டறிதல் மற்றும் தனிப்பயனாக்கப்பட்ட பராமரிப்பு வழிகாட்டுதல்கள்.",
  "Detect Disease": "நோயைக் கண்டறி",
  "View My Plants": "எனது தாவரங்களைப் பார்",
  "Healthy Specimen": "ஆரோக்கியமான தாவரம்",
  "Swiss Cheese Plant": "ஸ்விஸ் சீஸ் தாவரம்",
  "Health": "ஆரோக்கியம்",
  "Plant Health": "தாவர ஆரோக்கியம்",
  "Average collection vitality": "சராசரி தாவர ஆரோக்கிய நிலை",
  "Average health across your monitored plants":
    "கண்காணிக்கப்படும் தாவரங்களின் சராசரி ஆரோக்கியம்",
  "this week": "இந்த வாரம்",
  "Plants Monitored": "கண்காணிக்கப்படும் தாவரங்கள்",
  "Plants currently in your collection": "தற்போது உங்கள் தொகுப்பில் உள்ள தாவரங்கள்",
  "healthy": "ஆரோக்கியமானவை",
  "thriving in collection": "தொகுப்பில் செழித்து வளர்கின்றன",
  "Recent Analyses": "சமீபத்திய பகுப்பாய்வுகள்",
  "AI visual diagnostics": "AI காட்சி நோய் கண்டறிதல்",
  "AI plant analyses completed": "முடிக்கப்பட்ட AI தாவர பகுப்பாய்வுகள்",
  "Last analysis: Today": "கடைசி பகுப்பாய்வு: இன்று",
  "Last analysis: Yesterday": "கடைசி பகுப்பாய்வு: நேற்று",
  "Last analysis:": "கடைசி பகுப்பாய்வு:",
  "Plants Needing Attention": "கவனம் தேவைப்படும் தாவரங்கள்",
  "Check symptoms & care": "அறிகுறிகள் & பராமரிப்பைச் சரிபார்க்கவும்",
  "Plants showing symptoms or care needs":
    "அறிகுறிகள் அல்லது பராமரிப்பு தேவைப்படும் தாவரங்கள்",
  "Add your first plant to start monitoring":
    "கண்காணிப்பைத் தொடங்க உங்கள் முதல் தாவரத்தைச் சேர்க்கவும்",
  "All plants look healthy": "அனைத்து தாவரங்களும் ஆரோக்கியமாக உள்ளன",
  "Treatment required": "சிகிச்சை தேவை",
  "Care needed": "பராமரிப்பு தேவை",
  "Optimal status": "சிறந்த நிலை",
  "Ready to scan": "ஸ்கேன் செய்ய தயார்",
  "No plants yet": "இன்னும் தாவரங்கள் இல்லை",
  "Plant Health Summary": "தாவர ஆரோக்கிய சுருக்கம்",
  "Overall collection wellness overview": "ஒட்டுமொத்த தாவரத் தொகுப்பின் ஆரோக்கிய நிலை",
  "View All": "அனைத்தையும் பார்",
  "Health Score": "ஆரோக்கிய மதிப்பெண்",
  "Healthy & Thriving": "ஆரோக்கியமாக & செழிப்பாக உள்ளது",
  "Needs Care": "பராமரிப்பு தேவை",
  "Disease Detected": "நோய் கண்டறியப்பட்டது",
  "Daily Care Insight": "தினசரி பராமரிப்பு குறிப்பு",
  "Monstera Deliciosa · Seasonal Tip": "மான்ஸ்டெரா டெலிசியோசா · பருவகால குறிப்பு",
  "“Your Monstera is thriving. Rotate it a quarter turn this week to encourage balanced foliar growth toward the light.”":
    "“உங்கள் மான்ஸ்டெரா செழித்து வளர்கிறது. வெளிச்சத்தை நோக்கி சீரான இலை வளர்ச்சியை ஊக்குவிக்க இந்த வாரம் தொட்டியை கால் பங்கு திருப்பி வைக்கவும்.”",
  "Bright indirect morning light": "பிரகாசமான மறைமுக காலை வெயில்",
  "Listen": "கேட்க",
  "Pause": "இடைநிறுத்து",
  "Resume": "தொடர்",
  "Stop": "நிறுத்து",
  "Plants showing visible leaf symptoms or needing care adjustments":
    "இலைகளில் அறிகுறிகள் தென்படும் அல்லது பராமரிப்பு மாற்றங்கள் தேவைப்படும் தாவரங்கள்",
  "Check Plant Disease": "தாவர நோயைச் சரிபார்க்கவும்",
  "Diagnose": "பரிசோதி",
  "View": "பார்",
  "Monitored Plants": "கண்காணிக்கப்படும் தாவரங்கள்",
  "Active specimens in your botanical collection": "உங்கள் தாவரத் தொகுப்பில் உள்ள செயலில் உள்ள தாவரங்கள்",
  "All plants": "அனைத்து தாவரங்களும்",
  "Latest diagnostic scans & species checks": "சமீபத்திய நோய் கண்டறிதல் & இனப் பரிசோதனைகள்",
  "History": "வரலாறு",
  "Care Recommendations & Tasks": "பராமரிப்பு பரிந்துரைகள் & பணிகள்",
  "Personalized care schedule for your plants": "உங்கள் தாவரங்களுக்கான பிரத்யேக பராமரிப்பு அட்டவணை",
  "View all care plans": "அனைத்து பராமரிப்பு திட்டங்களையும் பார்",
  "Quick Plant Analysis": "விரைவான தாவர பகுப்பாய்வு",
  "Upload a photo to identify or check health": "தாவரத்தை அடையாளம் காண அல்லது ஆரோக்கியத்தைச் சரிபார்க்க புகைப்படத்தை பதிவேற்றவும்",
  "Analyzing your plant...": "உங்கள் தாவரம் பகுப்பாய்வு செய்யப்படுகிறது...",
  "Drag and drop a plant photo or browse": "தாவர புகைப்படத்தை இங்கே இழுத்து விடவும் அல்லது தேர்வு செய்யவும்",
  "Upload Photo": "புகைப்படம் பதிவேற்று",
  "Camera": "கேமரா",
  "Camera Capture": "கேமரா புகைப்படம்",
  "Cancel": "ரத்து செய்",
  "Capture & Analyze": "படம் எடுத்து பகுப்பாய்வு செய்",
  "Today": "இன்று",
  "Tomorrow": "நாளை",
  "In 2 days": "2 நாட்களில்",
  "Check soil moisture & mist fenestrated leaves": "மண்ணின் ஈரப்பதத்தை சரிபார்த்து இலைகளில் நீர் தெளிக்கவும்",
  "Apply organic bio-fungicide for early blight prevention": "இலைக்கருகல் நோயைத் தடுக்க இயற்கை பூஞ்சைக்கொல்லியைப் பயன்படுத்தவும்",
  "Fertigate with balanced organic nitrogen amendment": "சீரான இயற்கை நைட்ரஜன் உரத்தை இடவும்",
  "Rotate pot 90° for uniform sun exposure": "சீரான சூரிய ஒளிக்கு தொட்டியை 90° சுழற்றவும்",

  // Identify Plant & Disease Detection (AnalyzePlant.tsx)
  "Plant Identification": "தாவர அடையாளம் காணுதல்",
  "Plant Disease Detection": "தாவர நோய் கண்டறிதல்",
  "Upload a clear photo of leaves, flowers, or the whole plant to identify its species and care profile.":
    "தாவரத்தின் இனம் மற்றும் பராமரிப்பு விவரங்களை அறிய இலைகள், பூக்கள் அல்லது முழு தாவரத்தின் தெளிவான புகைப்படத்தை பதிவேற்றவும்.",
  "Upload a close-up photo of affected leaves or stems to detect diseases, nutrient deficiencies, and treatment steps.":
    "நோய்கள், ஊட்டச்சத்து குறைபாடுகள் மற்றும் சிகிச்சை முறைகளைக் கண்டறிய பாதிக்கப்பட்ட இலைகள் அல்லது தண்டுகளின் புகைப்படத்தை பதிவேற்றவும்.",
  "1. Upload Photo": "1. புகைப்படம் பதிவேற்று",
  "Clear leaf or full plant image": "தெளிவான இலை அல்லது முழு தாவரப் படம்",
  "Close-up of affected leaf area": "பாதிக்கப்பட்ட இலையின் அருகாமையில் எடுத்த படம்",
  "2. AI Analysis": "2. AI பகுப்பாய்வு",
  "Botanical species matching": "தாவரவியல் இனப் பொருத்தம்",
  "Pathogen & symptom scanning": "நோய்க்கிருமி & அறிகுறி பரிசோதனை",
  "3. Care & Results": "3. பராமரிப்பு & முடிவுகள்",
  "Detailed care requirements": "விரிவான பராமரிப்புத் தேவைகள்",
  "Treatment & recovery plan": "சிகிச்சை & மீட்புத் திட்டம்",
  "Plant Image": "தாவர புகைப்படம்",
  "Leaf / Symptom Image": "இலை / அறிகுறி புகைப்படம்",
  "Upload a clear plant photo": "தெளிவான தாவர புகைப்படத்தை பதிவேற்றவும்",
  "Upload a close-up photo of the affected leaf": "பாதிக்கப்பட்ட இலையின் அருகாமையில் எடுத்த புகைப்படத்தை பதிவேற்றவும்",
  "Drag and drop your image here, or use the buttons below. Supports JPG, PNG, and WEBP up to 10MB.":
    "உங்கள் படத்தை இங்கே இழுத்து விடவும் அல்லது கீழே உள்ள பொத்தான்களைப் பயன்படுத்தவும். 10MB வரையிலான JPG, PNG, WEBP படங்களை ஆதரிக்கிறது.",
  "Use Camera": "கேமராவைப் பயன்படுத்து",
  "Live Camera": "நேரடி கேமரா",
  "Capture Photo": "புகைப்படம் எடு",
  "Replace Photo": "புகைப்படத்தை மாற்று",
  "Remove": "நீக்கு",
  "Try with a sample plant:": "மாதிரி தாவரத்துடன் முயற்சிக்கவும்:",
  "Try with a sample leaf:": "மாதிரி இலையுடன் முயற்சிக்கவும்:",
  "Observed Symptoms (Optional)": "காணப்படும் அறிகுறிகள் (விருப்பத்தேர்வு)",
  "Select any visible symptoms to help improve diagnostic accuracy:":
    "கண்டறிதலின் துல்லியத்தை மேம்படுத்த தென்படும் அறிகுறிகளைத் தேர்ந்தெடுக்கவும்:",
  "Plant Name or Notes (Optional)": "தாவரத்தின் பெயர் அல்லது குறிப்புகள் (விருப்பத்தேர்வு)",
  "Optional Hint (If known)": "விருப்பக் குறிப்பு (தெரிந்தால்)",
  "Run Disease Detection": "நோய் கண்டறிதலைத் தொடங்கு",
  "No Plant Selected Yet": "இன்னும் தாவரம் தேர்ந்தெடுக்கப்படவில்லை",
  "No Leaf Image Analyzed Yet": "இன்னும் இலைப் படம் பகுப்பாய்வு செய்யப்படவில்லை",
  "Upload a photo or choose a sample plant on the left to identify the species and view its botanical care profile.":
    "தாவர இனத்தை அடையாளம் காணவும் அதன் பராமரிப்பு விவரங்களைப் பார்க்கவும் இடதுபுறத்தில் புகைப்படத்தை பதிவேற்றவும் அல்லது மாதிரி தாவரத்தைத் தேர்ந்தெடுக்கவும்.",
  "Upload a photo of a leaf showing spots, yellowing, or wilting to receive a diagnosis and treatment plan.":
    "நோய் கண்டறிதல் மற்றும் சிகிச்சைத் திட்டத்தைப் பெற புள்ளிகள், மஞ்சள் நிறம் அல்லது வாடிய இலையின் புகைப்படத்தை பதிவேற்றவும்.",
  "Species Identified": "தாவர இனம் அடையாளம் காணப்பட்டது",
  "Match": "பொருத்தம்",
  "About This Plant": "இந்த தாவரத்தைப் பற்றி",
  "Essential Care Guide": "அத்தியாவசிய பராமரிப்பு வழிகாட்டி",
  "Sunlight": "சூரிய ஒளி",
  "Bright Indirect Light": "பிரகாசமான மறைமுக ஒளி",
  "Watering": "நீர்ப்பாசனம்",
  "When top 2 inches of soil are dry": "மண்ணின் மேல் 2 அங்குலம் காய்ந்தவுடன்",
  "Temperature": "வெப்பநிலை",
  "18°C – 29°C (65°F – 85°F)": "18°C – 29°C (65°F – 85°F)",
  "Soil Type": "மண் வகை",
  "Well-draining peat & perlite mix": "நன்கு நீர் வடியும் பீட் & பெர்லைட் கலவை",
  "Maintenance Tips": "பராமரிப்பு குறிப்புகள்",
  "View Full Report": "முழு அறிக்கையைப் பார்",
  "Analyze Another": "மற்றொன்றை பகுப்பாய்வு செய்",
  "Check Another Leaf": "மற்றொரு இலையைச் சரிபார்",
  "Healthy Plant": "ஆரோக்கியமான தாவரம்",
  "Diagnosis": "நோய் கண்டறிதல்",
  "Confidence": "நம்பகத்தன்மை",
  "Severity": "தீவிரம்",
  "Detected Symptoms": "கண்டறியப்பட்ட அறிகுறிகள்",
  "Possible Nutrient Deficiency": "சாத்தியமான ஊட்டச்சத்து குறைபாடு",
  "Recommended Treatment": "பரிந்துரைக்கப்பட்ட சிகிச்சை",
  "Prevention & Recovery Care": "தடுப்பு & மீட்புப் பராமரிப்பு",
  "Full Diagnostic Report": "முழு நோய் கண்டறிதல் அறிக்கை",
  "Yellowing leaves": "மஞ்சள் நிற இலைகள்",
  "Brown spots": "பழுப்பு நிறப் புள்ளிகள்",
  "Wilting": "வாடுதல்",
  "White powdery coating": "வெள்ளை மாவு போன்ற படலம்",
  "Leaf curling": "இலை சுருளுதல்",
  "Stunted growth": "வளர்ச்சி குறைபாடு",
  "Black stem lesions": "தண்டில் கருப்பு புண்கள்",
  "Leaf edge burn": "இலை ஓரம் கருகுதல்",
  "Listen to Result": "முடிவைக் கேட்க",

  // LoadingAnalysis.tsx
  "AI botanical engine is inspecting leaf patterns, species markers, and health indicators.":
    "AI தாவரவியல் இயந்திரம் இலை அமைப்புகள், இன அடையாளங்கள் மற்றும் ஆரோக்கிய குறியீடுகளை ஆய்வு செய்கிறது.",
  "Image processed": "படம் செயலாக்கப்பட்டது",
  "Plant identified": "தாவரம் அடையாளம் காணப்பட்டது",
  "Disease analysis": "நோய் பகுப்பாய்வு",
  "Nutrition analysis": "ஊட்டச்சத்து பகுப்பாய்வு",
  "Health analysis": "ஆரோக்கிய பகுப்பாய்வு",
  "Recommendations ready": "பரிந்துரைகள் தயார்",
  "Done": "முடிந்தது",
  "Active": "நடைபெறுகிறது",

  // PlantResult.tsx & Diagnostic Cards
  "Back": "பின்செல்",
  "Export JSON": "JSON ஏற்றுமதி",
  "New Scan": "புதிய பரிசோதனை",
  "Diagnostic Report": "நோய் கண்டறிதல் அறிக்கை",
  "Analyzed Specimen": "பகுப்பாய்வு செய்யப்பட்ட தாவரம்",
  "Confidence:": "நம்பகத்தன்மை:",
  "Healthy": "ஆரோக்கியமானது",
  "Needs Attention": "கவனம் தேவை",
  "Overall Health": "ஒட்டுமொத்த ஆரோக்கியம்",
  "Out of 100": "100-க்கு",
  "Model Confidence": "AI நம்பகத்தன்மை",
  "Visual Symptoms": "காட்சி அறிகுறிகள்",
  "No abnormal visual symptoms detected": "அசாதாரண அறிகுறிகள் எதுவும் கண்டறியப்படவில்லை",
  "Condition": "நிலை",
  "Symptoms": "அறிகுறிகள்",
  "No disease symptoms observed.": "நோய் அறிகுறிகள் எதுவும் காணப்படவில்லை.",
  "Status": "நிலை",
  "Botanical Care Profile": "தாவரவியல் பராமரிப்பு விவரம்",
  "Recommended environment & maintenance": "பரிந்துரைக்கப்பட்ட சூழல் & பராமரிப்பு",
  "Bright Indirect": "பிரகாசமான மறைமுக ஒளி",
  "6+ hours daily": "தினமும் 6+ மணி நேரம்",
  "Moderate": "மிதமானது",
  "Keep soil evenly moist": "மண்ணை சீரான ஈரப்பதத்துடன் வைக்கவும்",
  "Optimal": "உகந்தது",
  "18°C – 28°C": "18°C – 28°C",
  "Soil": "மண்",
  "Well-Draining": "நன்கு நீர் வடியும் மண்",
  "Rich organic loamy mix": "சத்துள்ள இயற்கை வண்டல் மண் கலவை",
  "No specific treatment required.": "குறிப்பிட்ட சிகிச்சை எதுவும் தேவையில்லை.",
  "Maintain regular care routine.": "வழக்கமான பராமரிப்பு முறையைத் தொடரவும்.",
  "Report not found": "அறிக்கை கிடைக்கவில்லை",
  "The requested analysis could not be loaded.": "கோரப்பட்ட பகுப்பாய்வு அறிக்கையை ஏற்ற முடியவில்லை.",
  "Analyze a Plant": "தாவரத்தை பகுப்பாய்வு செய்",

  // MyPlants.tsx
  "My Plant Collection": "எனது தாவரத் தொகுப்பு",
  "Track vitality, watering schedules, and historical diagnostics for every plant you grow.":
    "நீங்கள் வளர்க்கும் ஒவ்வொரு தாவரத்தின் ஆரோக்கியம், நீர்ப்பாசன அட்டவணை மற்றும் நோய் கண்டறிதல் வரலாற்றைக் கண்காணிக்கவும்.",
  "Scan New Plant": "புதிய தாவரத்தை ஸ்கேன் செய்",
  "Add Plant": "தாவரத்தைச் சேர்",
  "Search by plant name, species, or location...": "தாவரத்தின் பெயர், இனம் அல்லது இடத்தின் அடிப்படையில் தேடுக...",
  "All Plants": "அனைத்து தாவரங்களும்",
  "No matching plants found": "பொருந்தும் தாவரங்கள் எதுவும் கிடைக்கவில்லை",
  "Try clearing your search filter or add a new plant to your collection.":
    "தேடல் வடிகட்டியை மாற்றி முயற்சிக்கவும் அல்லது புதிய தாவரத்தைச் சேர்க்கவும்.",
  "Moist soil": "ஈரப்பதமான மண்",
  "Plant Profile": "தாவர விவரம்",
  "Add Plant to Collection": "தொகுப்பில் தாவரத்தைச் சேர்",
  "Plant Common Name": "தாவரத்தின் பொதுப் பெயர்",
  "Scientific Name": "அறிவியல் பெயர்",
  "Location": "இடம்",
  "Category": "வகை",
  "Indoor Tropical": "உட்புற வெப்பமண்டல தாவரம்",
  "Vegetable": "காய்கறித் தாவரம்",
  "Flowering": "பூக்கும் தாவரம்",
  "Succulent": "சதைப்பற்றுள்ள தாவரம்",
  "Save Plant": "தாவரத்தைச் சேமி",

  // History.tsx
  "Complete archive of plant identifications, leaf disease diagnoses, and health reports.":
    "தாவர அடையாளங்கள், இலை நோய் கண்டறிதல்கள் மற்றும் ஆரோக்கிய அறிக்கைகளின் முழுமையான தொகுப்பு.",
  "Search history by plant or condition...": "தாவரம் அல்லது நிலையின் அடிப்படையில் வரலாற்றைத் தேடுக...",
  "All Scans": "அனைத்து பரிசோதனைகளும்",
  "Healthy Specimens": "ஆரோக்கியமான தாவரங்கள்",
  "Disease / Stress Detected": "நோய் / பாதிப்பு கண்டறியப்பட்டவை",
  "No analysis records found": "பகுப்பாய்வு பதிவுகள் எதுவும் கிடைக்கவில்லை",
  "Upload a plant photo to generate your first diagnostic report.":
    "உங்கள் முதல் நோய் கண்டறிதல் அறிக்கையை உருவாக்க தாவர புகைப்படத்தை பதிவேற்றவும்.",
  "View Report": "அறிக்கையைப் பார்",
  "View Details": "விவரங்களைப் பார்",
  "Recent scan": "சமீபத்திய பரிசோதனை",
  "Delete Analysis?": "பகுப்பாய்வை நீக்கவா?",
  "This analysis will be removed from your analysis history. This action cannot be undone.":
    "இந்த பகுப்பாய்வு உங்கள் பகுப்பாய்வு வரலாற்றிலிருந்து நீக்கப்படும். இந்தச் செயலை மீட்டெடுக்க முடியாது.",
  "Delete": "நீக்கு",
  "Deleting...": "நீக்கப்படுகிறது...",
  "Delete analysis": "பகுப்பாய்வை நீக்கு",
  "Analysis deleted successfully.": "பகுப்பாய்வு வெற்றிகரமாக நீக்கப்பட்டது.",
  "Unable to delete this analysis. Please try again.":
    "இந்தப் பகுப்பாய்வை நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  "No analysis history yet": "இன்னும் பகுப்பாய்வு வரலாறு இல்லை",
  "Upload a plant image to start your first analysis.":
    "உங்கள் முதல் பகுப்பாய்வைத் தொடங்க தாவரப் படத்தை பதிவேற்றவும்.",
  "No analyses yet": "இன்னும் பகுப்பாய்வுகள் இல்லை",

  // CareRecommendations.tsx
  "Botanical care schedules, environmental targets, and actionable tasks for your plants.":
    "உங்கள் தாவரங்களுக்கான பராமரிப்பு அட்டவணைகள், சூழல் இலக்குகள் மற்றும் செய்ய வேண்டிய பணிகள்.",
  "Completed": "முடிந்தவை",
  "Scheduled Care Tasks": "திட்டமிடப்பட்ட பராமரிப்புப் பணிகள்",
  "Add Task": "பணியைச் சேர்",
  "Add custom task for a plant...": "தாவரத்திற்கான புதிய பராமரிப்புப் பணியை உள்ளிடவும்...",
  "Add": "சேர்",
  "Plant Care Guides": "தாவர பராமரிப்பு வழிகாட்டிகள்",
  "Water": "நீர்",
  "Humidity": "ஈரப்பதம்",
  "Fertilizer": "உரம்",
  "Care Tip:": "பராமரிப்பு குறிப்பு:",
  "Every 7–10 days (top 5cm dry)": "7–10 நாட்களுக்கு ஒருமுறை (மேல் 5 செ.மீ காய்ந்தவுடன்)",
  "Daily in warm weather (consistent moisture)": "வெப்பமான காலநிலையில் தினமும் (சீரான ஈரப்பதம்)",
  "Every 4–5 days (deep root soak)": "4–5 நாட்களுக்கு ஒருமுறை (வேர் நனையும்படி)",
  "Every 3–4 days (avoid waterlogging)": "3–4 நாட்களுக்கு ஒருமுறை (நீர் தேங்காமல்)",
  "Full Sun (6–8 hrs direct)": "முழு சூரிய ஒளி (6–8 மணி நேரம்)",
  "Full Sun (6+ hrs)": "முழு சூரிய ஒளி (6+ மணி நேரம்)",
  "Balanced 20-20-20 monthly": "மாதம் ஒருமுறை சமச்சீர் 20-20-20 உரம்",
  "High-potassium & calcium feed biweekly": "இரு வாரங்களுக்கு ஒருமுறை பொட்டாசியம் & கால்சியம் உரம்",
  "Organic rose fertilizer every 3 weeks": "3 வாரங்களுக்கு ஒருமுறை இயற்கை ரோஜா உரம்",
  "Organic nitrogen & micronutrient boost": "இயற்கை நைட்ரஜன் & நுண்ணூட்டச்சத்து உரம்",
  "Wipe fenestrated leaves with a damp cloth monthly to maximize photosynthesis.":
    "ஒளிச்சேர்க்கையை அதிகரிக்க மாதம் ஒருமுறை ஈரத் துணியால் இலைகளைத் துடைக்கவும்.",
  "Prune lower leaves touching the soil and apply organic copper fungicide preventatively.":
    "மண்ணைத் தொடும் கீழ் இலைகளை அகற்றி, தடுப்பு நடவடிக்கையாக இயற்கை செப்பு பூஞ்சைக்கொல்லியைப் பயன்படுத்தவும்.",
  "Water at the base rather than overhead to prevent black spot and powdery mildew.":
    "கரும்புள்ளி மற்றும் சாம்பல் நோயைத் தடுக்க இலைகளின் மீது ஊற்றாமல் வேர்ப்பகுதியில் நீர் ஊற்றவும்.",
  "Check underside of curling leaves for aphids or mites and maintain even soil moisture.":
    "சுருண்ட இலைகளின் அடிப்பகுதியில் அசுவினிப் பூச்சிகள் உள்ளதா எனப் பார்த்து சீரான ஈரப்பதத்தை பராமரிக்கவும்.",
  "Water deeply until it flows from drainage holes; allow top 2 inches to dry.":
    "வடிகால் துளைகள் வழியாக நீர் வெளியேறும் வரை நன்கு ஊற்றவும்; மேல் 2 அங்குல மண் காய அனுமதிக்கவும்.",
  "Place near an east or south-facing window with filtered sunlight.":
    "வடிகட்டிய சூரிய ஒளி படும் கிழக்கு அல்லது தெற்கு நோக்கிய ஜன்னல் அருகே வைக்கவும்.",
  "Apply organic liquid fertilizer at half strength during active growth.":
    "வளர்ச்சிக் காலத்தில் இயற்கை திரவ உரத்தை பாதி அளவு கலந்து பயன்படுத்தவும்.",
  "Remove yellowing lower leaves with sterilized shears to redirect energy.":
    "சத்துக்களைச் சேமிக்க மஞ்சள் நிற கீழ் இலைகளை சுத்தமான கத்திரிக்கோலால் அகற்றவும்.",

  // PlantProfile.tsx
  "Back to My Plants": "எனது தாவரங்களுக்குத் திரும்பு",
  "Plant not found": "தாவரம் கிடைக்கவில்லை",
  "Run Health Scan": "ஆரோக்கிய பரிசோதனை செய்",
  "Delete Plant": "தாவரத்தை நீக்கு",
  "Current Health Score": "தற்போதைய ஆரோக்கிய மதிப்பெண்",
  "Ideal Care Conditions": "உகந்த பராமரிப்புச் சூழல்",
  "Bright Indirect / Morning Sun": "பிரகாசமான மறைமுக ஒளி / காலை வெயில்",
  "Every 5–7 Days": "5–7 நாட்களுக்கு ஒருமுறை",
  "20°C – 28°C": "20°C – 28°C",
  "55% – 70%": "55% – 70%",
  "Care Notes & Observations": "பராமரிப்பு குறிப்புகள் & அவதானிப்புகள்",
  "Monitor leaf margins and new growth weekly. Water when the top 3–5 cm of soil feels dry to the touch. Keep away from cold drafts and sudden temperature swings.":
    "இலை ஓரங்கள் மற்றும் புதிய தளிர்களை வாரந்தோறும் கண்காணிக்கவும். மேல் மண் 3–5 செ.மீ காய்ந்தவுடன் நீர் ஊற்றவும். கடும் குளிர் காற்று மற்றும் திடீர் வெப்பநிலை மாற்றங்களிலிருந்து பாதுகாக்கவும்.",
  "Diagnostic History": "நோய் கண்டறிதல் வரலாறு",
  "New Scan for This Plant": "இந்த தாவரத்திற்கு புதிய பரிசோதனை",
  "No diagnostic scans recorded for this plant yet.": "இந்த தாவரத்திற்கு இன்னும் நோய் கண்டறிதல் பதிவுகள் எதுவும் இல்லை.",

  // Settings.tsx
  "Manage your profile, theme appearance, language, voice reading, and notifications.":
    "உங்கள் சுயவிவரம், தோற்றம், மொழி, குரல் வாசிப்பு மற்றும் அறிவிப்புகளை நிர்வகிக்கவும்.",
  "User Profile": "பயனர் சுயவிவரம்",
  "Personalize your botanical workspace identity": "உங்கள் தாவரவியல் கணக்கு விவரங்களைத் தனிப்பயனாக்குங்கள்",
  "Edit Profile": "சுயவிவரத்தைத் திருத்து",
  "Save": "சேமி",
  "Full Name": "முழுப் பெயர்",
  "Email Address": "மின்னஞ்சல் முகவரி",
  "Appearance": "தோற்றம்",
  "Choose between Light, Dark, or System theme": "பகல், இரவு அல்லது கணினித் தோற்றத்தைத் தேர்ந்தெடுக்கவும்",
  "System": "கணினி",
  "Language & Voice Reading": "மொழி & குரல் வாசிப்பு",
  "Select display language and text-to-speech preferences":
    "காட்சி மொழி மற்றும் குரல் வாசிப்பு விருப்பங்களைத் தேர்ந்தெடுக்கவும்",
  "Application Language": "பயன்பாட்டு மொழி",
  "Voice Speed": "குரல் வேகம்",
  "Enable Audio Reading": "குரல் வாசிப்பை இயக்கு",
  "Show Listen buttons on analysis results": "பகுப்பாய்வு முடிவுகளில் 'கேட்க' பொத்தான்களைக் காண்பி",
  "Test Voice": "குரல் சோதனை",
  "Notifications & Data": "அறிவிப்புகள் & தரவு",
  "Manage alerts and export your plant records": "எச்சரிக்கைகளை நிர்வகித்து உங்கள் தாவரப் பதிவுகளை ஏற்றுமதி செய்யவும்",
  "Disease detection alerts": "நோய் கண்டறிதல் எச்சரிக்கைகள்",
  "Notify when plant needs immediate care": "தாவரத்திற்கு உடனடி சிகிச்சை தேவைப்படும்போது அறிவிக்கவும்",
  "Watering & care reminders": "நீர்ப்பாசனம் & பராமரிப்பு நினைவூட்டல்கள்",
  "Daily digest of scheduled plant tasks": "தினசரி திட்டமிடப்பட்ட தாவரப் பணிகளின் சுருக்கம்",
  "Export All Plant Data (JSON)": "அனைத்து தாவரத் தரவையும் ஏற்றுமதி செய் (JSON)",
  "Profile updated.": "சுயவிவரம் புதுப்பிக்கப்பட்டது.",
  "Application language updated.": "பயன்பாட்டு மொழி புதுப்பிக்கப்பட்டது.",
  "PlantCare data exported.": "PlantCare தரவு ஏற்றுமதி செய்யப்பட்டது.",
  "Tamil voice is not available on this device. Using default browser voice.":
    "தமிழ் குரல் இந்த சாதனத்தில் கிடைக்கவில்லை. உலாவியின் இயல்புநிலை குரல் பயன்படுத்தப்படுகிறது.",
  "Listening... Click to stop": "கேட்கிறது... நிறுத்த கிளிக் செய்யவும்",
  "Voice input": "குரல் உள்ளீடு",
  "Voice Tone & Clarity": "குரல் தொனி & தெளிவு",
  "Soft & Clear (Recommended)": "மென்மையான & தெளிவான குரல் (பரிந்துரைக்கப்படுகிறது)",
  "Warm & Soothing": "இனிமையான & அமைதியான குரல்",
  "Natural & Balanced": "இயல்பான & சமநிலையான குரல்",
  "Voice Profile": "குரல் தேர்வு",
  "Auto — Softest & Clearest Voice": "தானியங்கி — மென்மையான & தெளிவான குரல்",

  // Plant Talk Intelligence Suite
  "Plant Intelligence & Vitals": "தாவர நுண்ணறிவு & நிலை விவரங்கள்",
  "Current Plant Condition": "தற்போதைய தாவர நிலை",
  "Why PlantCare AI Thinks This": "PlantCare AI இதை ஏன் கூறுகிறது?",
  "What My Plant Needs Now": "எனது தாவரத்திற்கு இப்போது என்ன தேவை?",
  "What To Do Today": "இன்று செய்ய வேண்டியவை",
  "What To Watch For Next": "அடுத்து கவனிக்க வேண்டியவை (3–7 நாட்கள்)",
  "How My Plant Has Changed Over Time": "காலப்போக்கில் தாவரத்தின் வளர்ச்சி & ஆரோக்கிய மாற்றம்",
  "Prognosis & Care Outlook": "எதிர்கால கணிப்பு & வளர்ச்சி வாய்ப்பு",
  "Growth & Health Timeline": "வளர்ச்சி & ஆரோக்கிய காலவரிசை",
  "Latest Leaf Scan Findings": "சமீபத்திய இலை ஸ்கேன் முடிவுகள்",
  "Disease Severity:": "நோயின் தீவிரம்:",
  "Symptoms Identified:": "கண்டறியப்பட்ட அறிகுறிகள்:",
  "Nutrient Deficiency:": "ஊட்டச்சத்து குறைபாடு:",
  "Recommended Treatments:": "பரிந்துரைக்கப்பட்ட சிகிச்சைகள்:",
  "No historical scans for this plant yet": "இந்த தாவரத்திற்கு இன்னும் முந்தைய ஸ்கேன் பதிவுகள் இல்லை",
  "Take Leaf Photo Scan": "இலை புகைப்பட பரிசோதனை செய்",
  "Scan leaf to inspect for early disease or nutrient needs.": "நோய் அல்லது ஊட்டச்சத்து தேவைகளை அறிய இலையை ஸ்கேன் செய்யவும்.",
  "Improving": "முன்னேறுகிறது",
  "Stable": "சீரானது",
  "Under Observation": "கண்காணிப்பில் உள்ளது",
  "Healthy Foliage & Growth": "ஆரோக்கியமான இலைகள் & வளர்ச்சி",
  "Quick Actions Today": "இன்றைய உடனடி பராமரிப்பு",
};

const TAMIL_PLANT_NAMES: Record<string, string> = {
  "Monstera Deliciosa": "மான்ஸ்டெரா டெலிசியோசா (Monstera Deliciosa)",
  "Tomato": "தக்காளி (Tomato)",
  "Tomato (Bed A4)": "தக்காளி - பாத்தி A4 (Tomato)",
  "Garden Rose": "தோட்ட ரோஜா (Garden Rose)",
  "Rose": "ரோஜா (Rose)",
  "Chilli": "மிளகாய் (Chilli)",
  "Chilli Pepper": "மிளகாய் செடி (Chilli Pepper)",
  "Fiddle Leaf Fig": "ஃபிடில் லீஃப் அத்தி (Fiddle Leaf Fig)",
  "Peace Lily": "பீஸ் லில்லி (Peace Lily)",
  "Snake Plant": "பாம்பு கற்றாழை (Snake Plant)",
  "Areca Palm": "அரிகா பனை (Areca Palm)",
  "Potato": "உருளைக்கிழங்கு (Potato)",
  "Apple": "ஆப்பிள் (Apple)",
  "Bell Pepper": "குடைமிளகாய் (Bell Pepper)",
};

const TAMIL_DISEASE_NAMES: Record<string, string> = {
  "Healthy": "ஆரோக்கியமானது",
  "Healthy Foliage": "ஆரோக்கியமான இலைகள்",
  "Early Blight": "ஆரம்பகால இலைக்கருகல் நோய் (Early Blight)",
  "Late Blight": "பிற்கால இலைக்கருகல் நோய் (Late Blight)",
  "Powdery Mildew": "சாம்பல் நோய் (Powdery Mildew)",
  "Black Spot": "கரும்புள்ளி நோய் (Black Spot)",
  "Bacterial Spot": "பாக்டீரியா இலைப்புள்ளி (Bacterial Spot)",
  "Leaf Curl": "இலை சுருள் நோய் (Leaf Curl)",
  "Nitrogen Deficiency": "நைட்ரஜன் குறைபாடு (Nitrogen Deficiency)",
  "Interveinal Chlorosis": "நரம்பிடை மஞ்சள் நோய் (Interveinal Chlorosis)",
  "Mild Stress": "லேசான பாதிப்பு",
  "Moderate Stress": "மிதமான பாதிப்பு",
  "Severe Stress": "கடுமையான பாதிப்பு",
  "Disease Suspected": "நோய் சந்தேகிக்கப்படுகிறது",
};

const TAMIL_SEVERITY: Record<string, string> = {
  "None": "ஏதுமில்லை",
  "Low": "குறைவு",
  "Mild": "லேசானது",
  "Moderate": "மிதமானது",
  "High": "அதிகம்",
  "Severe": "கடுமையானது",
  "Healthy": "ஆரோக்கியமானது",
};

const TAMIL_DEFICIENCY: Record<string, string> = {
  "None": "ஏதுமில்லை",
  "None Detected": "குறைபாடு எதுவும் கண்டறியப்படவில்லை",
  "None (Optimal NPK balance)": "ஏதுமில்லை (சீரான NPK ஊட்டச்சத்து நிலை)",
  "Optimal macro & micro nutrient levels": "சீரான பேரூட்ட மற்றும் நுண்ணூட்டச்சத்து நிலை",
  "Nitrogen (N) / Magnesium (Mg)": "நைட்ரஜன் (N) / மெக்னீசியம் (Mg) குறைபாடு",
  "Potassium (K) / Calcium (Ca) mild imbalance": "பொட்டாசியம் (K) / கால்சியம் (Ca) லேசான சமநிலையின்மை",
  "Mild Potassium (K) deficiency": "லேசான பொட்டாசியம் (K) குறைபாடு",
  "Magnesium (Mg) & Iron (Fe) deficiency": "மெக்னீசியம் (Mg) & இரும்புச்சத்து (Fe) குறைபாடு",
  "Calcium (Ca) & Boron (B)": "கால்சியம் (Ca) & போரான் (B) குறைபாடு",
};

const TAMIL_SYMPTOMS_AND_RECS: Record<string, string> = {
  // Symptoms
  "Concentric dark brown rings on lower leaves": "கீழ் இலைகளில் வட்ட வடிவ அடர் பழுப்பு நிற வளையங்கள்",
  "Yellow chlorotic halo around leaf spots": "இலைப் புள்ளிகளைச் சுற்றி மஞ்சள் நிற வளையம்",
  "Gradual lower foliage wilting": "கீழ் இலைகள் படிப்படியாக வாடுதல்",
  "Target-like concentric brown lesions on older leaves": "முதிர்ந்த இலைகளில் வட்ட வடிவ பழுப்பு நிற புள்ளிகள்",
  "Yellowing halo surrounding dark leaf spots": "கருப்பு இலைப் புள்ளிகளைச் சுற்றி மஞ்சள் நிற வளையம்",
  "Lower stem browning and early defoliation": "கீழ் தண்டு பழுப்பு நிறமாதல் மற்றும் இலை உதிர்தல்",
  "Deep glossy green foliage": "அடர் பளபளப்பான பச்சை இலைகள்",
  "Strong turgor pressure and clean leaf margins": "உறுதியான இலைகள் மற்றும் தெளிவான இலை ஓரங்கள்",
  "Active apical bud development": "புதிய நுனி மொட்டுகளின் ஆரோக்கியமான வளர்ச்சி",
  "Vibrant emerald-green foliage with natural fenestrations": "இயற்கையான துளைகளுடன் கூடிய பிரகாசமான மரகதப் பச்சை இலைகள்",
  "Strong petiole posture and healthy aerial roots": "வலுவான இலைக்காம்புகள் மற்றும் ஆரோக்கியமான விழுது வேர்கள்",
  "No necrotic lesions or pest damage detected": "இலைகளில் புள்ளிகள் அல்லது பூச்சித் தாக்குதல் எதுவும் கண்டறியப்படவில்லை",
  "Circular black spots with fringed margins on upper leaf surface": "இலையின் மேற்பரப்பில் ஓரங்கள் சிதைந்த வட்ட வடிவ கரும்புள்ளிகள்",
  "Yellowing around infected lesions": "பாதிக்கப்பட்ட புள்ளிகளைச் சுற்றி மஞ்சள் நிறமாதல்",
  "Premature dropping of lower leaves": "கீழ் இலைகள் முன்கூட்டியே உதிர்தல்",
  "Upward curling and puckering of young leaves": "இளம் இலைகள் மேல்நோக்கி சுருண்டு சுருக்கமடைதல்",
  "Pale yellow discoloration between leaf veins": "இலை நரம்புகளுக்கு இடையே வெளிறிய மஞ்சள் நிற மாற்றம்",
  "Stunted shoot growth and flower drop": "தளிர் வளர்ச்சி குன்றுதல் மற்றும் பூக்கள் உதிர்தல்",
  "Interveinal yellowing on older leaves": "முதிர்ந்த இலைகளில் நரம்புகளுக்கு இடையே மஞ்சள் நிறமாதல்",
  "Slight upward leaf margin curling": "இலை ஓரங்கள் லேசாக மேல்நோக்கி சுருளுதல்",
  "Reduced flower set on upper nodes": "மேல் கணுக்களில் பூக்கள் பிடிப்பது குறைதல்",
  "Water-soaked dark green to brown leaf patches": "நீர் கோர்த்த அடர் பச்சை முதல் பழுப்பு நிற இலைத் திட்டுகள்",
  "White cottony fungal growth on leaf undersides": "இலையின் அடிப்பகுதியில் வெள்ளை பஞ்சு போன்ற பூஞ்சை வளர்ச்சி",
  "Rapid browning and curling of petioles": "இலைக்காம்புகள் விரைவாக பழுப்பு நிறமாகி சுருளுதல்",

  // Treatments
  "Prune and dispose of infected lower leaves immediately": "பாதிக்கப்பட்ட கீழ் இலைகளை உடனடியாக அகற்றி அழிக்கவும்",
  "Apply organic copper-based fungicide every 7–10 days": "7–10 நாட்களுக்கு ஒருமுறை இயற்கை செப்பு பூஞ்சைக்கொல்லியைத் தெளிக்கவும்",
  "Avoid overhead watering to keep foliage dry": "இலைகள் ஈரமாவதைத் தவிர்க்க மேலிருந்து நீர் ஊற்றுவதைத் தவிர்க்கவும்",
  "Prune affected lower leaves with sterilized shears": "பாதிக்கப்பட்ட கீழ் இலைகளை சுத்தமான கத்திரிக்கோலால் அகற்றவும்",
  "Apply copper oxychloride or neem-based bio-fungicide every 7 days": "7 நாட்களுக்கு ஒருமுறை காப்பர் ஆக்ஸிகுளோரைடு அல்லது வேப்ப எண்ணெய் பூஞ்சைக்கொல்லியைத் தெளிக்கவும்",
  "Supplement with balanced potassium-calcium organic fertilizer": "சமச்சீர் பொட்டாசியம்-கால்சியம் இயற்கை உரத்தை இடவும்",
  "No chemical treatment required — specimen is healthy": "இரசாயன சிகிச்சை தேவையில்லை — தாவரம் ஆரோக்கியமாக உள்ளது",
  "Continue current watering and sunlight regimen": "தற்போதைய நீர்ப்பாசனம் மற்றும் சூரிய ஒளி முறையைத் தொடரவும்",
  "No disease treatment needed — plant is in optimal condition": "நோய் சிகிச்சை தேவையில்லை — தாவரம் மிகச்சிறந்த நிலையில் உள்ளது",
  "Wipe leaves gently with a damp cloth monthly to maximize photosynthesis": "ஒளிச்சேர்க்கையை அதிகரிக்க மாதம் ஒருமுறை ஈரத் துணியால் இலைகளை மெதுவாகத் துடைக்கவும்",
  "Remove and destroy fallen and spotted leaves immediately": "உதிர்ந்த மற்றும் புள்ளிகள் உள்ள இலைகளை உடனடியாக அகற்றி அழிக்கவும்",
  "Spray neem oil or sulfur-based organic fungicide every 7–10 days": "7–10 நாட்களுக்கு ஒருமுறை வேப்ப எண்ணெய் அல்லது கந்தக இயற்கை பூஞ்சைக்கொல்லியைத் தெளிக்கவும்",
  "Disinfect pruning shears with 70% isopropyl alcohol between cuts": "கவாத்து செய்யும்போது கத்திரிக்கோலை 70% ஆல்கஹால் கொண்டு சுத்தம் செய்யவும்",
  "Apply organic neem oil spray (5ml/L) to control whitefly and aphid vectors": "வெள்ளை ஈ மற்றும் அசுவினிப் பூச்சிகளைக் கட்டுப்படுத்த வேப்ப எண்ணெய் (5 மி.லி/லிட்டர்) தெளிக்கவும்",
  "Foliar spray of Epsom salt (Magnesium sulfate 2g/L) and chelated micronutrients": "எப்சம் உப்பு (மெக்னீசியம் சல்பேட் 2 கிராம்/லிட்டர்) மற்றும் நுண்ணூட்டச்சத்து கரைசலை இலைவழித் தெளிக்கவும்",
  "Remove severely curled terminal shoots if viral infection is suspected": "வைரஸ் தொற்று சந்தேகிக்கப்பட்டால் கடுமையாக சுருண்ட நுனித் தளிர்களை அகற்றவும்",
  "Foliar spray of Epsom salt (1 tsp per gallon) for magnesium": "மெக்னீசியம் சத்திற்கு எப்சம் உப்பு கரைசலை இலைகளில் தெளிக்கவும்",
  "Top-dress soil with well-rotted organic compost": "மண்ணின் மேல் நன்கு மட்கிய இயற்கை தொழுஉரத்தை இடவும்",
  "Maintain consistent soil moisture without waterlogging": "நீர் தேங்காமல் சீரான மண் ஈரப்பதத்தை பராமரிக்கவும்",
  "Remove heavily infected leaves and stems immediately": "கடுமையாக பாதிக்கப்பட்ட இலைகள் மற்றும் தண்டுகளை உடனடியாக அகற்றவும்",
  "Apply systemic copper or bio-fungicide treatment": "செப்பு அல்லது உயிரி-பூஞ்சைக்கொல்லி சிகிச்சையைப் பயன்படுத்தவும்",
  "Reduce ambient humidity and halt overhead misting": "சுற்றுப்புற ஈரப்பதத்தைக் குறைத்து இலைகளின் மேல் நீர் தெளிப்பதை நிறுத்தவும்",

  // Prevention
  "Mulch around base to prevent soil splash onto lower leaves": "மண் துகள்கள் கீழ் இலைகளில் தெரிப்பதைத் தடுக்க வேர்ப்பகுதியைச் சுற்றி நிலப்போர்வை (Mulch) இடவும்",
  "Ensure 45–60 cm spacing between plants for airflow": "நல்ல காற்றோட்டத்திற்கு செடிகளுக்கு இடையே 45–60 செ.மீ இடைவெளி விடவும்",
  "Rotate solanaceous crops every season": "ஒவ்வொரு பருவத்திலும் பயிர் சுழற்சி முறையைப் பின்பற்றவும்",
  "Use drip irrigation at the soil line to keep foliage dry": "இலைகள் உலர்ந்திருக்க சொட்டு நீர்ப்பாசன முறையைப் பயன்படுத்தவும்",
  "Mulch with organic straw to prevent soil-borne spore splash": "மண்ணில் உள்ள பூஞ்சை வித்துக்கள் பரவாமல் தடுக்க வைக்கோல் நிலப்போர்வை இடவும்",
  "Maintain 6 hours of direct morning sunlight": "தினமும் 6 மணி நேரம் நேரடி காலை வெயில் கிடைக்குமாறு பராமரிக்கவும்",
  "Deadhead spent blooms to encourage new flowering": "புதிய பூக்கள் பூக்க வாடிய பூக்களை கிள்ளி விடவும்",
  "Provide bright indirect light (east or filtered south window)": "பிரகாசமான மறைமுக சூரிய ஒளியை வழங்கவும்",
  "Water when the top 5 cm of soil feels dry to the touch": "மண்ணின் மேல் 5 செ.மீ காய்ந்தவுடன் நீர் ஊற்றவும்",
  "Provide a moss pole for vertical climbing support": "கொடி படர்வதற்கு தென்னை நார் குச்சியை (Moss pole) ஆதாரமாக வைக்கவும்",
  "Water only at the root zone in the early morning": "அதிகாலையில் வேர்ப்பகுதியில் மட்டும் நீர் ஊற்றவும்",
  "Prune interior branches to improve canopy air circulation": "செடியின் உட்பகுதியில் காற்றோட்டத்தை மேம்படுத்த உள்கிளைகளை கவாத்து செய்யவும்",
  "Inspect underside of young leaves twice weekly for sap-sucking pests": "இளம் இலைகளின் அடிப்பகுதியில் சாறு உறிஞ்சும் பூச்சிகள் உள்ளதா என வாரம் இருமுறை ஆய்வு செய்யவும்",
  "Install yellow sticky traps around the garden bed": "தோட்டத்தில் மஞ்சள் ஒட்டும் பொறிகளை வைக்கவும்",
  "Maintain soil pH between 6.0 and 6.8 for optimal nutrient uptake": "சிறந்த ஊட்டச்சத்து உறிஞ்சுதலுக்கு மண்ணின் pH அளவை 6.0 முதல் 6.8-க்குள் பராமரிக்கவும்",
  "Test soil pH (ideal 6.0–6.8 for Capsicum)": "மண்ணின் pH அளவைப் பரிசோதிக்கவும் (மிளகாய்க்கு 6.0–6.8 உகந்தது)",
  "Inspect undersides of leaves weekly for aphids": "அசுவினிப் பூச்சிகள் உள்ளதா என வாரந்தோறும் இலைகளின் அடிப்பகுதியைச் சரிபார்க்கவும்",
  "Use certified disease-free seed tubers": "சான்றளிக்கப்பட்ட நோய் எதிர்ப்பு சக்தியுள்ள விதைக் கிழங்குகளைப் பயன்படுத்தவும்",
  "Hill soil around plant base to protect tubers from spores": "கிழங்குகளைப் பாதுகாக்க செடியின் அடிப்பகுதியைச் சுற்றி மண் அணைக்கவும்",
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
  tr: (text: string) => string;
  localizePlantName: (name?: string) => string;
  localizeDiseaseName: (name?: string) => string;
  localizeSeverity: (sev?: string) => string;
  localizeDeficiency: (def?: string) => string;
  localizeDiagnosticResult: (result: DiagnosticResult) => DiagnosticResult;
  localizePlantProfile: (plant: PlantProfileItem) => PlantProfileItem;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = safeLocalStorage.getItem("plantcare_lang") as SupportedLanguage | null;
      if (saved && TRANSLATIONS[saved]) return saved;
    } catch {
      // fallback
    }
    return "en";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      safeLocalStorage.setItem("plantcare_lang", lang);
    } catch {
      // ignore
    }
  }, []);

  const tr = useCallback(
    (text: string): string => {
      if (!text) return "";
      if (language === "ta") {
        return TAMIL_DICTIONARY[text] || TAMIL_SYMPTOMS_AND_RECS[text] || text;
      }
      return text;
    },
    [language]
  );

  const localizePlantName = useCallback(
    (name?: string): string => {
      if (!name) return "";
      if (language === "ta") {
        return TAMIL_PLANT_NAMES[name] || name;
      }
      return name;
    },
    [language]
  );

  const localizeDiseaseName = useCallback(
    (name?: string): string => {
      if (!name) return "";
      if (language === "ta") {
        return TAMIL_DISEASE_NAMES[name] || name;
      }
      return name;
    },
    [language]
  );

  const localizeSeverity = useCallback(
    (sev?: string): string => {
      if (!sev) return "";
      if (language === "ta") {
        return TAMIL_SEVERITY[sev] || sev;
      }
      return sev;
    },
    [language]
  );

  const localizeDeficiency = useCallback(
    (def?: string): string => {
      if (!def) return "";
      if (language === "ta") {
        return TAMIL_DEFICIENCY[def] || def;
      }
      return def;
    },
    [language]
  );

  const localizeDiagnosticResult = useCallback(
    (result: DiagnosticResult): DiagnosticResult => {
      if (!result || language !== "ta") return result;
      return {
        ...result,
        plant_name: TAMIL_PLANT_NAMES[result.plant_name] || result.plant_name,
        disease_name: TAMIL_DISEASE_NAMES[result.disease_name] || result.disease_name,
        severity: TAMIL_SEVERITY[result.severity] || result.severity,
        overall_status:
          TAMIL_DISEASE_NAMES[result.overall_status] ||
          TAMIL_SEVERITY[result.overall_status] ||
          result.overall_status,
        possible_nutrient_deficiency: result.possible_nutrient_deficiency
          ? TAMIL_DEFICIENCY[result.possible_nutrient_deficiency] ||
            result.possible_nutrient_deficiency
          : result.possible_nutrient_deficiency,
        symptoms: (result.symptoms || []).map(
          (s) => TAMIL_SYMPTOMS_AND_RECS[s] || TAMIL_DICTIONARY[s] || s
        ),
        treatment_recommendations: (result.treatment_recommendations || []).map(
          (r) => TAMIL_SYMPTOMS_AND_RECS[r] || TAMIL_DICTIONARY[r] || r
        ),
        prevention_recommendations: (result.prevention_recommendations || []).map(
          (p) => TAMIL_SYMPTOMS_AND_RECS[p] || TAMIL_DICTIONARY[p] || p
        ),
      };
    },
    [language]
  );

  const localizePlantProfile = useCallback(
    (plant: PlantProfileItem): PlantProfileItem => {
      if (!plant || language !== "ta") return plant;
      return {
        ...plant,
        plantName: TAMIL_PLANT_NAMES[plant.plantName] || plant.plantName,
        latestDisease: plant.latestDisease
          ? TAMIL_DISEASE_NAMES[plant.latestDisease] || plant.latestDisease
          : plant.latestDisease,
        latestStatus: plant.latestStatus
          ? TAMIL_DISEASE_NAMES[plant.latestStatus] || plant.latestStatus
          : plant.latestStatus,
      };
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language] || TRANSLATIONS.en,
        tr,
        localizePlantName,
        localizeDiseaseName,
        localizeSeverity,
        localizeDeficiency,
        localizeDiagnosticResult,
        localizePlantProfile,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
