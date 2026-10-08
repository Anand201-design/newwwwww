import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Sprout,
  Send,
  Camera,
  X,
  Trash2,
  Sparkles,
  AlertCircle,
  Leaf,
  ChevronDown,
  ScanLine,
  Mic,
  MicOff,
} from "lucide-react";
import {
  plantService,
  PlantProfileItem,
  DiagnosticResult,
  AssistantHistoryTurn,
} from "../services/plantService";
import { useLanguage, SupportedLanguage } from "../context/LanguageContext";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import { useSpeechRecognition } from "../hooks/useSpeech";
import { tts } from "../services/speechService";
import {
  validateImageFile,
  optimizeImageForAnalysis,
} from "../utils/imageOptimizer";
import { safeSessionStorage } from "../utils/safeStorage";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plantId?: string;
  plantName?: string;
  imageUrl?: string;
  createdAt: string;
}

const CHAT_STORAGE_KEY = "plantcare_assistant_conversation_v1";

const EXAMPLE_QUESTIONS_BY_LANG: Record<SupportedLanguage, string[]> = {
  en: [
    "💧 Can I water my plant now?",
    "☀️ Does it need more sunlight?",
    "🍃 Why are the leaves yellow?",
    "🩺 Is my plant sick?",
    "🌱 How can I help it grow?",
    "🧪 What fertilizer should I use?",
    "🆘 My plant is dying. What should I do?",
  ],
  ta: [
    "💧 இப்போது எனது செடிக்கு தண்ணீர் ஊற்றலாமா?",
    "☀️ இதற்கு அதிக சூரிய ஒளி தேவையா?",
    "🍃 இலைகள் ஏன் மஞ்சள் நிறமாக உள்ளன?",
    "🩺 எனது செடிக்கு நோய் பாதிப்பு உள்ளதா?",
    "🌱 செடி நன்றாக வளர நான் என்ன செய்யலாம்?",
    "🧪 எந்த உரத்தைப் பயன்படுத்த வேண்டும்?",
    "🆘 எனது செடி வாடுகிறது. நான் என்ன செய்ய வேண்டும்?",
  ],
  es: [
    "💧 ¿Puedo regar mi planta ahora?",
    "☀️ ¿Necesita más luz solar?",
    "🍃 ¿Por qué las hojas están amarillas?",
    "🩺 ¿Está enferma mi planta?",
    "🌱 ¿Cómo puedo ayudarla a crecer?",
    "🧪 ¿Qué fertilizante debo usar?",
    "🆘 Mi planta se está muriendo. ¿Qué hago?",
  ],
  hi: [
    "💧 क्या मैं अभी अपने पौधे को पानी दे सकता हूँ?",
    "☀️ क्या इसे अधिक धूप की ज़रूरत है?",
    "🍃 पत्तियां पीली क्यों हैं?",
    "🩺 क्या मेरा पौधा बीमार है?",
    "🌱 मैं इसे बढ़ने में कैसे मदद करूं?",
    "🧪 मुझे कौन सा उर्वरक उपयोग करना चाहिए?",
    "🆘 मेरा पौधा मुरझा रहा है। मैं क्या करूं?",
  ],
  fr: [
    "💧 Puis-je arroser ma plante maintenant ?",
    "☀️ A-t-elle besoin de plus de soleil ?",
    "🍃 Pourquoi les feuilles sont-elles jaunes ?",
    "🩺 Ma plante est-elle malade ?",
    "🌱 Comment l'aider à mieux pousser ?",
    "🧪 Quel engrais dois-je utiliser ?",
    "🆘 Ma plante dépérit. Que dois-je faire ?",
  ],
  de: [
    "💧 Kann ich meine Pflanze jetzt gießen?",
    "☀️ Braucht sie mehr Sonnenlicht?",
    "🍃 Warum sind die Blätter gelb?",
    "🩺 Ist meine Pflanze krank?",
    "🌱 Wie kann ich ihr beim Wachsen helfen?",
    "🧪 Welchen Dünger soll ich verwenden?",
    "🆘 Meine Pflanze geht ein. Was soll ich tun?",
  ],
  zh: [
    "💧 现在可以给植物浇水吗？",
    "☀️ 它需要更多阳光吗？",
    "🍃 为什么叶子变黄了？",
    "🩺 我的植物生病了吗？",
    "🌱 如何帮助它更快生长？",
    "🧪 我应该使用什么肥料？",
    "🆘 我的植物快枯萎了，该怎么办？",
  ],
};

const UI_TEXT_BY_LANG: Record<
  SupportedLanguage,
  {
    headerTitle: string;
    headerSubtitle: string;
    selectPlantLabel: string;
    generalCareOption: string;
    inputPlaceholder: string;
    sendButton: string;
    uploadImageButton: string;
    removeImageButton: string;
    clearConversationButton: string;
    clearDialogTitle: string;
    clearDialogBody: string;
    cancelButton: string;
    confirmClearButton: string;
    suggestedHeading: string;
    thinkingText: string;
    askByVoiceTooltip: string;
    startListeningLabel: string;
    listeningLabel: string;
    processingVoiceLabel: string;
    permissionDeniedMsg: string;
    speechUnavailableMsg: string;
    couldNotUnderstandMsg: string;
  }
> = {
  en: {
    headerTitle: "AI Plant Assistant",
    headerSubtitle: "Ask anything about your plant and get personalized care guidance.",
    selectPlantLabel: "Select a plant",
    generalCareOption: "General Plant Care (All Plants)",
    inputPlaceholder: "Ask something about your plant...",
    sendButton: "Send",
    uploadImageButton: "Upload Image",
    removeImageButton: "Remove Image",
    clearConversationButton: "Clear Conversation",
    clearDialogTitle: "Clear Conversation?",
    clearDialogBody:
      "This will clear the current chat messages. Your saved plants and analysis history will not be affected.",
    cancelButton: "Cancel",
    confirmClearButton: "Clear Conversation",
    suggestedHeading: "Quick Questions",
    thinkingText: "Thinking & preparing concise plant care advice...",
    askByVoiceTooltip: "Ask by voice",
    startListeningLabel: "🎤 Ask by Voice",
    listeningLabel: "🔴 Listening...",
    processingVoiceLabel: "Processing...",
    permissionDeniedMsg:
      "Microphone permission denied. Please allow microphone access or type your question.",
    speechUnavailableMsg:
      "Voice input is not supported in this browser. Please type your question.",
    couldNotUnderstandMsg:
      "Could not understand speech. Please speak clearly and try again.",
  },
  ta: {
    headerTitle: "AI தாவர உதவியாளர்",
    headerSubtitle:
      "உங்கள் தாவரத்தைப் பற்றி எதையும் கேட்டு எளிய பராமரிப்பு வழிகாட்டுதலைப் பெறுங்கள்.",
    selectPlantLabel: "ஒரு தாவரத்தைத் தேர்ந்தெடுக்கவும்",
    generalCareOption: "பொதுத் தாவர பராமரிப்பு (அனைத்து தாவரங்களும்)",
    inputPlaceholder: "உங்கள் தாவரத்தைப் பற்றி ஏதாவது கேளுங்கள்...",
    sendButton: "அனுப்பு",
    uploadImageButton: "படத்தைப் பதிவேற்று",
    removeImageButton: "படத்தை அகற்று",
    clearConversationButton: "உரையாடலை அழி",
    clearDialogTitle: "உரையாடலை அழிக்கவா?",
    clearDialogBody:
      "இது தற்போதைய உரையாடல் செய்திகளை மட்டும் அழிக்கும். உங்கள் சேமிக்கப்பட்ட தாவரங்கள் மற்றும் பகுப்பாய்வு வரலாறு பாதிக்கப்படாது.",
    cancelButton: "ரத்து செய்",
    confirmClearButton: "உரையாடலை அழி",
    suggestedHeading: "விரைவுக் கேள்விகள்",
    thinkingText: "எளிய தாவர பராமரிப்பு பதிலை உருவாக்குகிறது...",
    askByVoiceTooltip: "குரல் மூலம் கேளுங்கள்",
    startListeningLabel: "🎤 குரலில் கேட்க",
    listeningLabel: "🔴 கவனிக்கிறது...",
    processingVoiceLabel: "செயலாக்குகிறது...",
    permissionDeniedMsg:
      "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. அனுமதியை வழங்கவும் அல்லது உங்கள் கேள்வியை தட்டச்சு செய்யவும்.",
    speechUnavailableMsg:
      "இந்த உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. தயவுசெய்து உங்கள் கேள்வியை தட்டச்சு செய்யவும்.",
    couldNotUnderstandMsg:
      "பேச்சைப் புரிந்துகொள்ள முடியவில்லை. மீண்டும் தெளிவாகப் பேசவும்.",
  },
  es: {
    headerTitle: "Asistente IA de Plantas",
    headerSubtitle:
      "Pregunta cualquier cosa sobre tu planta y obtén orientación personalizada.",
    selectPlantLabel: "Seleccionar una planta",
    generalCareOption: "Cuidado general de plantas",
    inputPlaceholder: "Pregunta algo sobre tu planta...",
    sendButton: "Enviar",
    uploadImageButton: "Subir imagen",
    removeImageButton: "Quitar imagen",
    clearConversationButton: "Borrar conversación",
    clearDialogTitle: "¿Borrar conversación?",
    clearDialogBody:
      "Esto borrará los mensajes actuales del chat. Tus plantas guardadas y el historial de análisis no se eliminarán.",
    cancelButton: "Cancelar",
    confirmClearButton: "Borrar conversación",
    suggestedHeading: "Preguntas rápidas",
    thinkingText: "Preparando respuesta breve...",
    askByVoiceTooltip: "Preguntar por voz",
    startListeningLabel: "🎤 Preguntar por voz",
    listeningLabel: "🔴 Escuchando...",
    processingVoiceLabel: "Procesando...",
    permissionDeniedMsg:
      "Permiso de micrófono denegado. Permite el acceso o escribe tu pregunta.",
    speechUnavailableMsg:
      "La entrada de voz no es compatible con este navegador. Por favor escribe tu pregunta.",
    couldNotUnderstandMsg: "No se pudo entender la voz. Inténtalo de nuevo.",
  },
  hi: {
    headerTitle: "AI पौधा सहायक",
    headerSubtitle:
      "अपने पौधे के बारे में कुछ भी पूछें और सरल देखभाल मार्गदर्शन प्राप्त करें।",
    selectPlantLabel: "एक पौधा चुनें",
    generalCareOption: "सामान्य पौधा देखभाल (सभी पौधे)",
    inputPlaceholder: "अपने पौधे के बारे में कुछ पूछें...",
    sendButton: "भेजें",
    uploadImageButton: "छवि अपलोड करें",
    removeImageButton: "छवि हटाएं",
    clearConversationButton: "बातचीत साफ़ करें",
    clearDialogTitle: "बातचीत साफ़ करें?",
    clearDialogBody:
      "यह वर्तमान चैट संदेशों को साफ़ कर देगा। आपके सहेजे गए पौधे और विश्लेषण इतिहास सुरक्षित रहेंगे।",
    cancelButton: "रद्द करें",
    confirmClearButton: "बातचीत साफ़ करें",
    suggestedHeading: "त्वरित प्रश्न",
    thinkingText: "पौधे की देखभाल के सुझाव तैयार किए जा रहे हैं...",
    askByVoiceTooltip: "आवाज़ से पूछें",
    startListeningLabel: "🎤 बोलकर पूछें",
    listeningLabel: "🔴 सुन रहा है...",
    processingVoiceLabel: "प्रोसेस हो रहा है...",
    permissionDeniedMsg:
      "माइक्रोफ़ोन की अनुमति अस्वीकृत। कृपया अनुमति दें या अपना प्रश्न टाइप करें।",
    speechUnavailableMsg:
      "इस ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया अपना प्रश्न टाइप करें।",
    couldNotUnderstandMsg: "आवाज़ समझ नहीं आई। कृपया स्पष्ट रूप से बोलें।",
  },
  fr: {
    headerTitle: "Assistant Plantes IA",
    headerSubtitle:
      "Posez toutes vos questions sur votre plante et obtenez des conseils simples.",
    selectPlantLabel: "Sélectionner une plante",
    generalCareOption: "Soins généraux des plantes",
    inputPlaceholder: "Posez une question sur votre plante...",
    sendButton: "Envoyer",
    uploadImageButton: "Téléverser une image",
    removeImageButton: "Supprimer l'image",
    clearConversationButton: "Effacer la conversation",
    clearDialogTitle: "Effacer la conversation ?",
    clearDialogBody:
      "Cela effacera les messages actuels. Vos plantes enregistrées et l'historique d'analyse seront conservés.",
    cancelButton: "Annuler",
    confirmClearButton: "Effacer la conversation",
    suggestedHeading: "Questions rapides",
    thinkingText: "Préparation des conseils...",
    askByVoiceTooltip: "Demander par la voix",
    startListeningLabel: "🎤 Parler",
    listeningLabel: "🔴 Écoute...",
    processingVoiceLabel: "Traitement...",
    permissionDeniedMsg:
      "Accès au microphone refusé. Veuillez autoriser le micro ou saisir votre question.",
    speechUnavailableMsg:
      "La saisie vocale n'est pas prise en charge dans ce navigateur. Veuillez saisir votre question.",
    couldNotUnderstandMsg: "Impossible de comprendre la voix. Veuillez réessayer.",
  },
  de: {
    headerTitle: "KI-Pflanzenassistent",
    headerSubtitle:
      "Fragen Sie alles über Ihre Pflanze und erhalten Sie einfache Pflegehinweise.",
    selectPlantLabel: "Pflanze auswählen",
    generalCareOption: "Allgemeine Pflanzenpflege",
    inputPlaceholder: "Fragen Sie etwas über Ihre Pflanze...",
    sendButton: "Senden",
    uploadImageButton: "Bild hochladen",
    removeImageButton: "Bild entfernen",
    clearConversationButton: "Unterhaltung löschen",
    clearDialogTitle: "Unterhaltung löschen?",
    clearDialogBody:
      "Dadurch werden die aktuellen Chat-Nachrichten gelöscht. Gespeicherte Pflanzen und der Analyseverlauf bleiben erhalten.",
    cancelButton: "Abbrechen",
    confirmClearButton: "Unterhaltung löschen",
    suggestedHeading: "Schnelle Fragen",
    thinkingText: "Antwort wird erstellt...",
    askByVoiceTooltip: "Per Sprache fragen",
    startListeningLabel: "🎤 Sprachsuche",
    listeningLabel: "🔴 Höre zu...",
    processingVoiceLabel: "Verarbeite...",
    permissionDeniedMsg:
      "Mikrofonberechtigung verweigert. Bitte erlauben Sie den Zugriff oder tippen Sie Ihre Frage ein.",
    speechUnavailableMsg:
      "Spracheingabe wird in diesem Browser nicht unterstützt. Bitte tippen Sie Ihre Frage ein.",
    couldNotUnderstandMsg: "Sprache nicht verstanden. Bitte erneut versuchen.",
  },
  zh: {
    headerTitle: "AI 植物助手",
    headerSubtitle: "询问有关您植物的任何问题，获取简明实用的护理指导。",
    selectPlantLabel: "选择植物",
    generalCareOption: "通用植物护理（全部植物）",
    inputPlaceholder: "询问有关您植物的问题...",
    sendButton: "发送",
    uploadImageButton: "上传图片",
    removeImageButton: "移除图片",
    clearConversationButton: "清空对话",
    clearDialogTitle: "清空对话？",
    clearDialogBody: "这将清空当前聊天记录，您保存的植物和分析历史不会受到影响。",
    cancelButton: "取消",
    confirmClearButton: "清空对话",
    suggestedHeading: "快捷提问",
    thinkingText: "正在生成简明护理建议...",
    askByVoiceTooltip: "语音提问",
    startListeningLabel: "🎤 语音输入",
    listeningLabel: "🔴 正在倾听...",
    processingVoiceLabel: "处理中...",
    permissionDeniedMsg: "麦克风权限被拒绝。请允许访问麦克风或直接输入问题。",
    speechUnavailableMsg: "当前浏览器不支持语音输入，请直接输入您的问题。",
    couldNotUnderstandMsg: "未能识别语音，请清晰说话后重试。",
  },
};

export const PlantAssistant: React.FC = () => {
  const {
    language,
    tr,
    localizePlantProfile,
    localizeDiagnosticResult,
  } = useLanguage();

  const ui = UI_TEXT_BY_LANG[language] || UI_TEXT_BY_LANG.en;
  const exampleQuestions =
    EXAMPLE_QUESTIONS_BY_LANG[language] || EXAMPLE_QUESTIONS_BY_LANG.en;

  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = safeSessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [inputText, setInputText] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreviewUrl, setAttachedPreviewUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const baseTextBeforeSpeechRef = useRef<string>("");

  const handleSpeechResult = useCallback((transcript: string) => {
    const prefix = baseTextBeforeSpeechRef.current.trim();
    const nextText = prefix ? `${prefix} ${transcript}`.trim() : transcript;
    setInputText(nextText);
    inputRef.current?.focus();
  }, []);

  const {
    isSupported: isVoiceSupported,
    isListening,
    isProcessing: isVoiceProcessing,
    errorCode: voiceErrorCode,
    clearError: clearVoiceError,
    toggleListening,
    stopListening,
    locale: speechLocale,
  } = useSpeechRecognition(handleSpeechResult);

  const handleToggleVoice = () => {
    setErrorMessage(null);
    tts.stop();
    if (!isListening) {
      baseTextBeforeSpeechRef.current = inputText;
    }
    toggleListening();
  };

  const localizedVoiceError = voiceErrorCode
    ? voiceErrorCode === "permission-denied"
      ? ui.permissionDeniedMsg
      : voiceErrorCode === "unsupported"
        ? ui.speechUnavailableMsg
        : voiceErrorCode === "no-speech"
          ? ui.couldNotUnderstandMsg
          : ui.couldNotUnderstandMsg
    : null;

  useEffect(() => {
    Promise.all([
      plantService.getPlants().catch(() => []),
      plantService.getAnalysisHistory().catch(() => []),
    ]).then(([loadedPlants, loadedHistory]) => {
      setPlants(loadedPlants);
      setHistory(loadedHistory);
    });
  }, []);

  useEffect(() => {
    try {
      safeSessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending]);

  const rawSelectedPlant = plants.find((p) => p.id === selectedPlantId);
  const selectedPlant = rawSelectedPlant
    ? localizePlantProfile(rawSelectedPlant)
    : undefined;

  const selectedPlantAnalyses = rawSelectedPlant
    ? history.filter(
        (h) =>
          h.plant_name.toLowerCase().includes(rawSelectedPlant.plantName.toLowerCase()) ||
          rawSelectedPlant.plantName.toLowerCase().includes(h.plant_name.toLowerCase()) ||
          (h.scientific_name &&
            rawSelectedPlant.scientificName &&
            h.scientific_name.toLowerCase() ===
              rawSelectedPlant.scientificName.toLowerCase())
      )
    : [];

  const latestSelectedAnalysis = selectedPlantAnalyses[0]
    ? localizeDiagnosticResult(selectedPlantAnalyses[0])
    : undefined;

  const handleSelectImage = (file: File) => {
    setErrorMessage(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMessage(
        validation.error ||
          "Please upload a valid image (JPG, PNG, or WEBP under 10 MB)."
      );
      return;
    }
    const preview = URL.createObjectURL(file);
    setAttachedFile(file);
    setAttachedPreviewUrl(preview);
  };

  const handleRemoveImage = () => {
    if (attachedPreviewUrl && attachedPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(attachedPreviewUrl);
    }
    setAttachedFile(null);
    setAttachedPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendQuestion = async (questionText: string) => {
    if (isListening) {
      stopListening();
    }
    tts.stop();
    clearVoiceError();

    const trimmed = questionText.trim();
    if ((!trimmed && !attachedFile) || isSending) {
      if (!trimmed && !attachedFile) {
        setErrorMessage(
          tr("Please enter a question about your plant or attach a plant photo.")
        );
      }
      return;
    }

    setErrorMessage(null);
    const currentFile = attachedFile;
    const currentPreview = attachedPreviewUrl;

    const displayQuestion =
      trimmed ||
      (language === "ta"
        ? "இந்த தாவரப் படத்தைப் பரிசோதித்து எளிய பராமரிப்பு வழிகாட்டுதல் வழங்கவும்."
        : "Please check this attached plant photo and give simple care steps.");

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: displayQuestion,
      plantId: rawSelectedPlant?.id,
      plantName: selectedPlant?.plantName,
      imageUrl: currentPreview || undefined,
      createdAt: new Date().toISOString(),
    };

    const previousTurns: AssistantHistoryTurn[] = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    baseTextBeforeSpeechRef.current = "";
    setAttachedFile(null);
    setAttachedPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsSending(true);

    try {
      let optimizedFile: File | null = null;
      if (currentFile) {
        optimizedFile = await optimizeImageForAnalysis(currentFile);
      }

      const response = await plantService.askPlantAssistant({
        message: displayQuestion,
        plantId: rawSelectedPlant?.id,
        language,
        history: previousTurns,
        imageFile: optimizedFile,
      });

      const assistantMsg: ChatMessage = {
        id: response.id || `ai_${Date.now()}`,
        role: "assistant",
        content: response.reply,
        plantId: response.plantId || rawSelectedPlant?.id,
        plantName: selectedPlant?.plantName || response.plantName,
        createdAt: response.createdAt || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Unable to get a response from AI Plant Assistant. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(inputText);
  };

  const handleConfirmClear = () => {
    tts.stop();
    setMessages([]);
    try {
      safeSessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // ignore
    }
    setShowClearConfirm(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1280px] mx-auto font-sans antialiased text-[#163A2D] dark:text-[#F1F7F3] transition-colors duration-200">
      {/* 1. HEADER HERO SECTION */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-white via-[#F2F8F4] to-[#DFEFE6] dark:from-[#173126] dark:via-[#142C22] dark:to-[#0F241B] border border-[#C6DDD0] dark:border-[#2A5240] p-6 sm:p-8 shadow-[0_4px_16px_rgba(23,107,77,0.08)]">
        <svg
          viewBox="0 0 1200 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-90 dark:opacity-55 z-0"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="assistantCanopyGrad"
              x1="920"
              y1="10"
              x2="920"
              y2="210"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.28" />
              <stop offset="65%" stopColor="#2D8A62" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <circle cx="940" cy="105" r="76" fill="url(#assistantCanopyGrad)" />
          <circle cx="995" cy="130" r="48" fill="url(#assistantCanopyGrad)" />
          <circle cx="888" cy="135" r="44" fill="url(#assistantCanopyGrad)" />
          <path
            d="M940 215 V 108 M940 165 C920 148, 902 134, 890 116 M940 148 C960 132, 976 120, 990 104"
            stroke="#163A2D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.38"
          />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
              <Sprout className="w-4 h-4 shrink-0" />
              <span>{tr("Botanical Care Guidance")}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight leading-tight">
              {ui.headerTitle}
            </h1>
            <p className="text-sm sm:text-base text-[#5E7A6D] dark:text-[#B0C9BA] leading-relaxed">
              {ui.headerSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#B45346] dark:text-[#E5988E] bg-white/90 dark:bg-[#173126] border border-[#E4CFCB] dark:border-[#4A2C28] hover:bg-[#FDF3F1] dark:hover:bg-[#2A1A17] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>{ui.clearConversationButton}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* KISAN / FARMER VOICE ASSISTANT BANNER */}
      <div className="p-4 sm:p-4.5 rounded-2xl bg-gradient-to-r from-[#176B4D] via-[#1E6B4F] to-[#258561] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm border border-[#2F8B68]">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm font-bold flex items-center gap-2">
            <span>🌾 Are you a Farmer or Field Grower? (किसान भाई)</span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">New Voice Mode</span>
          </p>
          <p className="text-xs text-[#D1E7DD] leading-relaxed">
            Switch to the <strong>Kisan Voice Assistant</strong> to ask crop doubts by voice in Hindi, Tamil, Telugu, Marathi, Punjabi & 10+ languages with spoken audio playback and precise chemical & organic dosages.
          </p>
        </div>
        <Link
          to="/farmer-voice"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#176B4D] text-xs font-bold hover:bg-[#F0F6F1] transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
        >
          <span>🌾 Open Kisan Voice Assistant</span>
        </Link>
      </div>

      {/* 2. PLANT CONTEXT SELECTOR & ACTIVE PLANT SUMMARY */}
      <section className="rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-4 sm:p-5 shadow-[0_2px_10px_rgba(22,58,45,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
            <label
              htmlFor="assistant-plant-select"
              className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] whitespace-nowrap flex items-center gap-2"
            >
              <Leaf className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
              <span>{ui.selectPlantLabel}:</span>
            </label>

            <div className="relative flex-1 max-w-md">
              <select
                id="assistant-plant-select"
                value={selectedPlantId}
                onChange={(e) => {
                  tts.stop();
                  setSelectedPlantId(e.target.value);
                }}
                className="w-full appearance-none rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] px-3.5 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:border-[#176B4D] cursor-pointer"
              >
                <option value="">🌱 {ui.generalCareOption}</option>
                {plants.map((plant) => {
                  const locPlant = localizePlantProfile(plant);
                  return (
                    <option key={plant.id} value={plant.id}>
                      🌿 {locPlant.plantName} ({plant.scientificName})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#668074] dark:text-[#B0C9BA]" />
            </div>
          </div>

          {selectedPlant && rawSelectedPlant ? (
            <div className="flex flex-wrap items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#DCE7DF] dark:border-[#244737]">
              <div className="flex items-center gap-2.5">
                <img
                  src={resolveRealisticPlantImage(
                    rawSelectedPlant.imageUrl,
                    rawSelectedPlant.plantName,
                    rawSelectedPlant.scientificName
                  )}
                  alt={selectedPlant.plantName}
                  referrerPolicy="no-referrer"
                  onError={(e) =>
                    handlePlantImageError(
                      e,
                      rawSelectedPlant.plantName,
                      rawSelectedPlant.scientificName
                    )
                  }
                  className="w-9 h-9 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                />
                <div className="text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    <span>{selectedPlant.plantName}</span>
                    <span aria-hidden="true" className="text-[#8EAD9B]">
                      ·
                    </span>
                    <span className="tabular-nums text-[#176B4D] dark:text-[#8EAD9B]">
                      {selectedPlant.latestHealthScore ?? 90}% {tr("Health")}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#668074] dark:text-[#B0C9BA] flex flex-wrap items-center gap-1.5">
                    <span>
                      {latestSelectedAnalysis
                        ? latestSelectedAnalysis.disease_name
                        : selectedPlant.latestDisease || tr("Healthy")}
                    </span>
                    {rawSelectedPlant.waterRequirement && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[200px]">
                          {tr(rawSelectedPlant.waterRequirement)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#668074] dark:text-[#B0C9BA]">
              {plants.length > 0
                ? tr("Select a saved plant above to include its health score and diagnostic history.")
                : tr("Ask general botanical questions or upload a plant leaf image below.")}
            </div>
          )}
        </div>
      </section>

      {/* 3. CHAT INTERFACE CONTAINER */}
      <section className="rounded-[24px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] shadow-[0_2px_12px_rgba(22,58,45,0.04)] flex flex-col min-h-[520px] max-h-[75vh] overflow-hidden">
        {/* Scrollable Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            /* Empty State + Quick Questions */
            <div className="py-5 sm:py-7 max-w-3xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {selectedPlant
                    ? `${tr("Ask about")} ${selectedPlant.plantName}`
                    : ui.headerTitle}
                </h2>
                <p className="text-xs sm:text-sm text-[#668074] dark:text-[#B0C9BA] max-w-lg mx-auto">
                  {selectedPlant
                    ? `${tr("Using context from")} ${selectedPlant.plantName} (${rawSelectedPlant?.scientificName}) · ${selectedPlant.latestHealthScore ?? 90}% ${tr("Health")}`
                    : ui.headerSubtitle}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#5E7A6D] dark:text-[#9AB8A8] text-center">
                  {ui.suggestedHeading}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {exampleQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendQuestion(question)}
                      disabled={isSending}
                      className="group text-left px-4 py-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#176B4D]/40 transition-all cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span className="text-xs sm:text-[13px] font-semibold text-[#163A2D] dark:text-[#F1F7F3] leading-snug">
                        {question}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Conversation Bubbles */
            <div className="space-y-5">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 ${
                        isUser
                          ? "bg-[#176B4D] text-white rounded-br-md shadow-2xs"
                          : "bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] rounded-bl-md"
                      }`}
                    >
                      {/* Bubble Top Metadata */}
                      <div
                        className={`flex flex-wrap items-center gap-2 text-[11px] mb-2 ${
                          isUser
                            ? "text-white/80"
                            : "text-[#5E7A6D] dark:text-[#9AB8A8]"
                        }`}
                      >
                        <span className="font-bold">
                          {isUser ? tr("You") : ui.headerTitle}
                        </span>
                        {msg.plantName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{msg.plantName}</span>
                          </>
                        )}
                      </div>

                      {/* Optional Attached Image inside User Message */}
                      {msg.imageUrl && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-white/20 max-w-[240px]">
                          <img
                            src={msg.imageUrl}
                            alt={tr("Attached Plant Photo")}
                            referrerPolicy="no-referrer"
                            onError={(e) => handlePlantImageError(e, msg.plantName)}
                            className="w-full max-h-44 object-cover"
                          />
                        </div>
                      )}

                      {/* Message Text */}
                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>

                      {/* Assistant Footer: Listen TTS Control & Quick Link to Diagnostics */}
                      {!isUser && (
                        <div className="mt-3.5 pt-3 border-t border-[#DCE7DF] dark:border-[#244737] flex flex-wrap items-center justify-between gap-2">
                          <AudioSpeechButton
                            text={msg.content}
                            label="Listen"
                            size="sm"
                          />
                          <Link
                            to="/analyze"
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline"
                          >
                            <ScanLine className="w-3.5 h-3.5 shrink-0" />
                            <span>{tr("Analyze Photo in Full Diagnostics")}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-start">
                  <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] p-4 flex items-center gap-3 text-xs text-[#5E7A6D] dark:text-[#B0C9BA]">
                    <div className="w-4 h-4 rounded-full border-2 border-[#176B4D] border-t-transparent animate-spin shrink-0" />
                    <span>{ui.thinkingText}</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Voice Status / Error Banner */}
        {(isListening || isVoiceProcessing || localizedVoiceError || errorMessage) && (
          <div className="px-5 pb-2.5 space-y-2">
            {(isListening || isVoiceProcessing) && (
              <div className="px-3.5 py-2 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#176B4D]/30 flex items-center justify-between gap-3 text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C95B4E] animate-pulse shrink-0" />
                  <span>
                    {isVoiceProcessing
                      ? ui.processingVoiceLabel
                      : `${ui.listeningLabel} (${speechLocale})`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopListening}
                  className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] underline cursor-pointer shrink-0"
                >
                  {tr("Stop")}
                </button>
              </div>
            )}

            {(localizedVoiceError || errorMessage) && (
              <div className="p-3 rounded-xl bg-[#FBECE9] dark:bg-[#2A1612] border border-[#C96F62]/40 flex items-center justify-between gap-3 text-xs text-[#C96F62]">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="break-words">
                    {errorMessage || localizedVoiceError}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    clearVoiceError();
                  }}
                  className="text-xs font-semibold underline shrink-0 cursor-pointer"
                >
                  {tr("Dismiss")}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attached Image Preview Bar */}
        {attachedPreviewUrl && (
          <div className="px-5 py-2.5 bg-[#F6F9F5] dark:bg-[#12281E] border-t border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={attachedPreviewUrl}
                alt={tr("Attached Plant Photo")}
                className="w-11 h-11 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                  {attachedFile?.name || tr("Attached Plant Photo")}
                </p>
                <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Image will be analyzed with your question")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B45346] dark:text-[#E5988E] hover:bg-[#FBECE9] dark:hover:bg-[#2A1612] transition-colors cursor-pointer shrink-0"
              title={ui.removeImageButton}
            >
              <X className="w-3.5 h-3.5" />
              <span>{ui.removeImageButton}</span>
            </button>
          </div>
        )}

        {/* Chat Input Bar: [ 📷 ] [ 🎤 ] [ Ask something about your plant... ] [ Send ] */}
        <form
          onSubmit={handleFormSubmit}
          className="p-4 sm:p-5 bg-[#F9FBF9] dark:bg-[#142B21] border-t border-[#DCE7DF] dark:border-[#244737] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleSelectImage(file);
            }}
          />

          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Upload Image Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              title={ui.uploadImageButton}
            >
              <Camera className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
              <span className="hidden md:inline">{ui.uploadImageButton}</span>
            </button>

            {/* Microphone Voice Input Button: 🎤 Ask by Voice */}
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isSending}
              title={ui.askByVoiceTooltip}
              aria-label={ui.askByVoiceTooltip}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                isListening
                  ? "bg-[#FBECE9] dark:bg-[#3A1E1A] text-[#C95B4E] dark:text-[#F29B8E] border-[#C95B4E]/50 shadow-2xs"
                  : !isVoiceSupported
                    ? "bg-white/70 dark:bg-[#173126]/60 text-[#668074] dark:text-[#8EAD9B]/70 border-[#DCE7DF] dark:border-[#244737]"
                    : "bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] border-[#DCE7DF] dark:border-[#244737] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D]"
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="w-4 h-4 text-[#C95B4E] animate-pulse shrink-0" />
                  <span className="hidden sm:inline">{ui.listeningLabel}</span>
                </>
              ) : !isVoiceSupported ? (
                <>
                  <MicOff className="w-4 h-4 text-[#668074] shrink-0" />
                  <span className="hidden sm:inline">{ui.startListeningLabel}</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
                  <span className="hidden sm:inline">{ui.startListeningLabel}</span>
                </>
              )}
            </button>

            {/* Editable Question Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendQuestion(inputText);
                }
              }}
              placeholder={ui.inputPlaceholder}
              disabled={isSending}
              className="flex-1 min-w-0 rounded-xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] px-4 py-2.5 text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#668074] dark:placeholder:text-[#8EAD9B]/70 focus:outline-none focus:border-[#176B4D]"
            />
          </div>

          <button
            type="submit"
            disabled={isSending || (!inputText.trim() && !attachedFile)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#176B4D] hover:bg-[#12563D] disabled:opacity-50 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span>{ui.sendButton}</span>
          </button>
        </form>
      </section>

      {/* Confirmation Modal for Clear Conversation */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#163A2D]/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-chat-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FBECE9] dark:bg-[#2A1612] text-[#C96F62] flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3
                  id="clear-chat-title"
                  className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]"
                >
                  {ui.clearDialogTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="p-1 rounded-lg text-[#668074] hover:text-[#163A2D] dark:text-[#B0C9BA] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[#5E7A6D] dark:text-[#B0C9BA] leading-relaxed">
              {ui.clearDialogBody}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F0F6F1] dark:bg-[#1D3B2D] hover:bg-[#E4F0E7] transition-colors cursor-pointer"
              >
                {ui.cancelButton}
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#C96F62] hover:bg-[#B45B4E] transition-colors cursor-pointer"
              >
                {ui.confirmClearButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PlantAssistant;
