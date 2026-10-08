import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Leaf,
  Volume2,
  Pause,
  Play,
  Square,
  RefreshCw,
  Send,
  Mic,
  MicOff,
  Camera,
  X,
  Droplets,
  Sun,
  Sprout,
  Scissors,
  Sparkles,
  Edit3,
  Check,
  MessageCircle,
  Calendar,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Info,
  TrendingUp,
  Clock,
  ChevronRight,
  Stethoscope,
  Compass,
} from "lucide-react";
import {
  plantService,
  type PlantProfileItem,
  type PlantPersonalityMode,
  type PlantMoodKey,
  type PlantTalkDailyMessage,
  type CareCheckInRecord,
  type DiagnosticResult,
} from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";
import { tts, getSpeechLocale } from "../services/speechService";
import { safeLocalStorage } from "../utils/safeStorage";

interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  timestamp: string;
}

const PERSONALITY_OPTIONS: Array<{
  id: PlantPersonalityMode;
  label: string;
  desc: string;
  icon: string;
}> = [
  {
    id: "friendly",
    label: "Friendly Companion",
    desc: "Warm, simple, everyday language",
    icon: "🌿",
  },
  {
    id: "calm",
    label: "Calm & Wise",
    desc: "Gentle, reassuring, mindful tone",
    icon: "🍵",
  },
  {
    id: "playful",
    label: "Playful Sprout",
    desc: "Light, cheerful, beginner-friendly",
    icon: "🌱",
  },
  {
    id: "expert",
    label: "Expert Botanical Guide",
    desc: "Informative while easy to understand",
    icon: "🔬",
  },
];

const QUICK_PROMPTS = [
  "How are you feeling today?",
  "Do you need water today?",
  "Are you getting enough sunlight?",
  "Why are your leaves changing color?",
  "What can I do to help you grow better?",
  "Do you need fertilizer right now?",
  "Are you recovering from your last issue?",
];

const CARE_CHECKIN_BUTTONS: Array<{
  type: CareCheckInRecord["actionType"];
  label: string;
  emoji: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { type: "watered", label: "I watered this plant", emoji: "💧", icon: Droplets },
  { type: "moved_light", label: "Moved to sunlight", emoji: "☀️", icon: Sun },
  { type: "fertilized", label: "Added fertilizer", emoji: "🪴", icon: Sprout },
  { type: "trimmed", label: "Trimmed damaged leaves", emoji: "✂️", icon: Scissors },
];

const MOOD_METADATA: Record<
  PlantMoodKey,
  { emoji: string; label: string; badgeClass: string }
> = {
  happy: {
    emoji: "😊",
    label: "Happy & Healthy",
    badgeClass:
      "bg-[#E4F0E7] text-[#176B4D] border-[#DCE7DF] dark:bg-[#1D3B2D] dark:text-[#8EAD9B] dark:border-[#244737]",
  },
  thirsty: {
    emoji: "💧",
    label: "Thirsty",
    badgeClass:
      "bg-[#E6F2F8] text-[#1E6091] border-[#C9E2F0] dark:bg-[#152E3F] dark:text-[#7CC2F5] dark:border-[#224760]",
  },
  needs_light: {
    emoji: "☀️",
    label: "Needs Sunlight",
    badgeClass:
      "bg-[#FDF3E3] text-[#B26E23] border-[#F4DFBC] dark:bg-[#332614] dark:text-[#E5A95C] dark:border-[#4D391E]",
  },
  recovering: {
    emoji: "🌱",
    label: "Recovering",
    badgeClass:
      "bg-[#EEF4F0] text-[#3B6251] border-[#DCE7DF] dark:bg-[#1B3328] dark:text-[#9AB8A8] dark:border-[#244737]",
  },
  needs_attention: {
    emoji: "🩺",
    label: "Needs Attention",
    badgeClass:
      "bg-[#FBECE9] text-[#B84A39] border-[#F3D0C9] dark:bg-[#381E1A] dark:text-[#E48677] dark:border-[#522C26]",
  },
  wants_checkup: {
    emoji: "📷",
    label: "Wants a Quick Check-up",
    badgeClass:
      "bg-[#FDF3E3] text-[#B26E23] border-[#F4DFBC] dark:bg-[#332614] dark:text-[#E5A95C] dark:border-[#4D391E]",
  },
};

export const PlantTalk: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, t, tr, localizePlantName, localizeDiseaseName } = useLanguage();

  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");

  const [personality, setPersonality] = useState<PlantPersonalityMode>(() => {
    try {
      const saved = safeLocalStorage.getItem("plantcare_plant_talk_personality");
      if (saved === "friendly" || saved === "calm" || saved === "playful" || saved === "expert") {
        return saved;
      }
    } catch {
      // fallback
    }
    return "friendly";
  });

  // Nickname editing state
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  // Daily Plant Intelligence state
  const [dailyData, setDailyData] = useState<PlantTalkDailyMessage | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Care Events & Check-in state
  const [careEvents, setCareEvents] = useState<CareCheckInRecord[]>([]);
  const [checkInLoadingType, setCheckInLoadingType] =
    useState<CareCheckInRecord["actionType"] | null>(null);
  const [latestCheckInReply, setLatestCheckInReply] = useState<{
    actionLabel: string;
    plantReply: string;
  } | null>(null);

  // Diagnostic history for the selected plant
  const [plantAnalyses, setPlantAnalyses] = useState<DiagnosticResult[]>([]);

  // Interactive Conversation state
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [questionInput, setQuestionInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // TTS state
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const selectedPlant = plants.find((p) => p.id === selectedPlantId) || null;

  // Load saved plants
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingPlants(true);
      try {
        const list = await plantService.getPlants();
        if (!active) return;
        setPlants(list);
        const queryPlantId = searchParams.get("plantId");
        if (queryPlantId && list.some((p) => p.id === queryPlantId)) {
          setSelectedPlantId(queryPlantId);
        } else if (list.length > 0) {
          setSelectedPlantId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load plants for Plant Talk:", err);
      } finally {
        if (active) setLoadingPlants(false);
      }
    };
    load();
    return () => {
      active = false;
      tts.stop();
    };
  }, []);

  // Sync nickname input and load care events when selected plant changes
  useEffect(() => {
    if (selectedPlant) {
      setNicknameInput(selectedPlant.nickname || "");
      setEditingNickname(false);
      setLatestCheckInReply(null);
      setChatHistory([]);
      tts.stop();
      setSpeakingId(null);
      setIsPaused(false);

      plantService
        .getCareEvents(selectedPlant.id)
        .then((events) => setCareEvents(events))
        .catch(() => setCareEvents([]));

      plantService
        .getAnalysisHistory()
        .then((allHistory) => {
          const matching = allHistory.filter(
            (h) =>
              h.plant_name.toLowerCase().includes(selectedPlant.plantName.toLowerCase()) ||
              selectedPlant.plantName.toLowerCase().includes(h.plant_name.toLowerCase()) ||
              (h.scientific_name &&
                selectedPlant.scientificName &&
                h.scientific_name.toLowerCase() === selectedPlant.scientificName.toLowerCase())
          );
          setPlantAnalyses(matching);
        })
        .catch(() => setPlantAnalyses([]));
    }
  }, [selectedPlantId]);

  const fetchDailyMessage = useCallback(
    async (plantId: string, mode: PlantPersonalityMode) => {
      if (!plantId) return;
      setLoadingDaily(true);
      try {
        const res = await plantService.getPlantTalkDailyMessage({
          plantId,
          personality: mode,
          language,
        });
        setDailyData(res);
        if (res.matchingAnalyses && res.matchingAnalyses.length > 0) {
          setPlantAnalyses(res.matchingAnalyses);
        }
        if (res.careEvents && res.careEvents.length > 0) {
          setCareEvents(res.careEvents);
        }
      } catch (err) {
        console.error("Failed to fetch daily Plant Talk message:", err);
      } finally {
        setLoadingDaily(false);
      }
    },
    [language]
  );

  useEffect(() => {
    if (selectedPlantId) {
      fetchDailyMessage(selectedPlantId, personality);
    }
  }, [selectedPlantId, personality, language, fetchDailyMessage]);

  const handlePersonalityChange = (mode: PlantPersonalityMode) => {
    setPersonality(mode);
    try {
      safeLocalStorage.setItem("plantcare_plant_talk_personality", mode);
    } catch {
      // ignore
    }
  };

  const handleSelectPlant = (id: string) => {
    setSelectedPlantId(id);
    setSearchParams({ plantId: id });
  };

  const handleSaveNickname = async () => {
    if (!selectedPlant) return;
    setSavingNickname(true);
    try {
      const trimmed = nicknameInput.trim();
      const updated = await plantService.updatePlant(selectedPlant.id, {
        nickname: trimmed,
      });
      setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingNickname(false);
      fetchDailyMessage(selectedPlant.id, personality);
    } catch (err) {
      console.error("Failed to save nickname:", err);
    } finally {
      setSavingNickname(false);
    }
  };

  const getDisplayName = (plant: PlantProfileItem) => {
    const translatedSpecies = localizePlantName(plant.plantName);
    if (plant.nickname && plant.nickname.trim()) {
      return `${plant.nickname.trim()} (${translatedSpecies})`;
    }
    return translatedSpecies;
  };

  const getShortCallName = (plant: PlantProfileItem) => {
    if (plant.nickname && plant.nickname.trim()) {
      return plant.nickname.trim();
    }
    return localizePlantName(plant.plantName);
  };

  // Speech Synthesis handler
  const handleSpeak = (id: string, textToSpeak: string) => {
    if (speakingId === id) {
      if (isPaused) {
        tts.resume();
        setIsPaused(false);
      } else {
        tts.pause();
        setIsPaused(true);
      }
      return;
    }
    tts.stop();
    setSpeakingId(id);
    setIsPaused(false);
    tts.speak(textToSpeak, {
      lang: getSpeechLocale(language),
      onEnd: () => {
        setSpeakingId(null);
        setIsPaused(false);
      },
      onError: () => {
        setSpeakingId(null);
        setIsPaused(false);
      },
    });
  };

  const handleStopSpeak = () => {
    tts.stop();
    setSpeakingId(null);
    setIsPaused(false);
  };

  // Care Check-in Action handler
  const handleCareCheckIn = async (
    actionType: CareCheckInRecord["actionType"],
    label: string
  ) => {
    if (!selectedPlant || checkInLoadingType) return;
    setCheckInLoadingType(actionType);
    try {
      const res = await plantService.logCareCheckIn({
        plantId: selectedPlant.id,
        actionType,
        note: tr(label),
        language,
      });

      setPlants((prev) => prev.map((p) => (p.id === res.plant.id ? res.plant : p)));
      setCareEvents((prev) => [res.event, ...prev]);
      setLatestCheckInReply({
        actionLabel: tr(label),
        plantReply: res.plantReply,
      });

      fetchDailyMessage(selectedPlant.id, personality);
    } catch (err) {
      console.error("Failed to log care check-in:", err);
    } finally {
      setCheckInLoadingType(null);
    }
  };

  // Image attachment handler for interactive chat
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Voice input handler
  const toggleVoiceInput = () => {
    setVoiceError(null);
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(
        tr(
          "Voice input is not supported in this browser. Please use Chrome or Edge, or type your question."
        )
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = getSpeechLocale(language);
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setQuestionInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceError(
            tr(
              "Microphone access is blocked. Allow microphone access in your browser settings, then try again."
            )
          );
        } else if (event.error !== "no-speech") {
          setVoiceError(tr("Voice input could not hear you. Please try speaking again."));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
      setVoiceError(tr("Could not start voice recognition. Please type your question."));
    }
  };

  // Interactive chat message submission
  const handleSendQuestion = async (customText?: string) => {
    const q = (customText || questionInput).trim();
    if (!q || !selectedPlant || sendingChat) return;

    const userTurn: ChatTurn = {
      id: `user-${Date.now()}`,
      role: "user",
      text: q,
      imagePreview: attachedPreview || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userTurn]);
    setQuestionInput("");
    const fileToSend = attachedFile;
    setAttachedFile(null);
    setAttachedPreview(null);
    setSendingChat(true);

    try {
      const historyPayload = chatHistory.slice(-6).map((turn) => ({
        role: turn.role,
        content: turn.text,
      }));

      const response = await plantService.askPlantTalk({
        plantId: selectedPlant.id,
        message: q,
        personality,
        language,
        imageFile: fileToSend,
        history: historyPayload,
      });

      const plantTurn: ChatTurn = {
        id: response.id || `plant-${Date.now()}`,
        role: "assistant",
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatHistory((prev) => [...prev, plantTurn]);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    } catch (err) {
      console.error("Failed to get Plant Talk response:", err);
    } finally {
      setSendingChat(false);
    }
  };

  const formatDateShort = (iso?: string | null) => {
    if (!iso) return tr("Not logged yet");
    const d = new Date(iso);
    if (isNaN(d.getTime())) return tr("Not logged yet");
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const careActionsThisWeekCount = careEvents.filter((ev) => {
    const tMs = new Date(ev.timestamp).getTime();
    return !isNaN(tMs) && Date.now() - tMs <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const activeMoodKey: PlantMoodKey = dailyData?.mood || "happy";
  const moodInfo = MOOD_METADATA[activeMoodKey] || MOOD_METADATA.happy;

  const latestScan = plantAnalyses[0] || dailyData?.latestAnalysis;

  if (loadingPlants) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-[#E4F0E7] dark:bg-[#1D3B2D] rounded-xl" />
        <div className="h-64 bg-white dark:bg-[#173126] rounded-2xl border border-[#DCE7DF] dark:border-[#244737]" />
      </div>
    );
  }

  // Empty State when no plants exist
  if (plants.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-10 space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {tr("Plant Talk")}
          </h1>
          <p className="text-sm sm:text-base text-[#527062] dark:text-[#B0C9BA] mt-1">
            {tr("See what your plant may be telling you.")}
          </p>
        </div>

        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center mx-auto text-[#176B4D] dark:text-[#8EAD9B]">
            <Leaf className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="font-display text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("No Plants Saved Yet")}
            </h2>
            <p className="text-sm text-[#527062] dark:text-[#B0C9BA] leading-relaxed">
              {tr("Add a plant or identify one first to start hearing from your plants.")}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/plants")}
              className="px-5 py-2.5 rounded-xl bg-[#176B4D] hover:bg-[#13583F] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {tr("Go to My Plants")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/analyze?mode=identify")}
              className="px-5 py-2.5 rounded-xl bg-[#F0F6F1] dark:bg-[#1D3B2D] hover:bg-[#E4F0E7] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] text-sm font-semibold transition-colors cursor-pointer"
            >
              {tr("Identify a Plant")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-10">
      {/* Page Header & Top Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#DCE7DF] dark:border-[#244737] pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tr("Plant Intelligence & Vitals")}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#163A2D] dark:text-[#F1F7F3] tracking-tight">
            {tr("Plant Talk")}
          </h1>
          <p className="text-sm sm:text-base text-[#527062] dark:text-[#B0C9BA]">
            {tr("See what your plant may be telling you.")}
          </p>
        </div>

        {/* Plant Selector Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="plant-talk-selector"
              className="text-xs font-semibold text-[#527062] dark:text-[#B0C9BA]"
            >
              {tr("Select a Plant")}
            </label>
            <select
              id="plant-talk-selector"
              value={selectedPlantId}
              onChange={(e) => handleSelectPlant(e.target.value)}
              className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/30 cursor-pointer min-w-[240px]"
            >
              {plants.map((plant) => (
                <option key={plant.id} value={plant.id}>
                  🌿 {getDisplayName(plant)} — {plant.latestHealthScore ?? 90}%
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Personality Selector Bar */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#527062] dark:text-[#B0C9BA]">
            {tr("Plant Personality")}
          </span>
          <span className="text-xs text-[#668074] dark:text-[#9AB8A8] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
            {tr(
              "Plant Talk is an AI interpretation based on your plant's saved information and analysis history."
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PERSONALITY_OPTIONS.map((opt) => {
            const active = personality === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePersonalityChange(opt.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "bg-[#E4F0E7]/80 dark:bg-[#1D3B2D] border-[#176B4D] dark:border-[#8EAD9B] shadow-2xs"
                    : "bg-[#F6F9F5] dark:bg-[#12281E]/60 border-[#DCE7DF] dark:border-[#244737] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D]/50"
                }`}
              >
                <span className="text-lg leading-none mt-0.5">{opt.icon}</span>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      active
                        ? "text-[#176B4D] dark:text-[#F1F7F3]"
                        : "text-[#163A2D] dark:text-[#D5E5DC]"
                    }`}
                  >
                    {tr(opt.label)}
                  </p>
                  <p className="text-[11px] text-[#668074] dark:text-[#9AB8A8] line-clamp-1 mt-0.5">
                    {tr(opt.desc)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left = 7 Core Intelligence Answers + Care Check-In; Right = Interactive Voice & Chat */}
      {selectedPlant && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Data-Driven Intelligence Suite */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Current Plant Condition & Vitals Card */}
            <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              {/* Plant Identity, Photo & Vitals Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] shrink-0 flex items-center justify-center">
                    <img
                      src={resolveRealisticPlantImage(
                        selectedPlant.imageUrl,
                        selectedPlant.plantName,
                        selectedPlant.scientificName,
                        selectedPlant.latestDisease
                      )}
                      alt={selectedPlant.plantName}
                      onError={(e) =>
                        handlePlantImageError(
                          e,
                          selectedPlant.plantName,
                          selectedPlant.scientificName
                        )
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-lg sm:text-xl font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                        {getDisplayName(selectedPlant)}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setEditingNickname((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#176B4D] dark:text-[#8EAD9B] hover:underline cursor-pointer"
                        title={tr("Edit Nickname")}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{tr("Edit Nickname")}</span>
                      </button>
                    </div>
                    <p className="text-xs italic text-[#668074] dark:text-[#9AB8A8]">
                      {selectedPlant.scientificName}
                    </p>
                  </div>
                </div>

                {/* Mood & Health Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${moodInfo.badgeClass}`}
                  >
                    <span>{moodInfo.emoji}</span>
                    <span>{tr(moodInfo.label)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F0F6F1] dark:bg-[#1D3B2D] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737]">
                    <Activity className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{selectedPlant.latestHealthScore ?? 90}/100</span>
                  </span>
                </div>
              </div>

              {/* Optional Nickname Editor */}
              {editingNickname && (
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder={tr("Enter a friendly nickname (e.g. Milo)")}
                    maxLength={32}
                    className="flex-1 bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-lg px-3 py-1.5 text-sm text-[#163A2D] dark:text-[#F1F7F3] focus:outline-none focus:ring-2 focus:ring-[#176B4D]/30"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveNickname}
                      disabled={savingNickname}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#176B4D] hover:bg-[#13583F] text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{tr("Save Nickname")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNickname(false)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#668074] hover:text-[#163A2D] dark:text-[#B0C9BA] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Botanical Profile Attributes Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] p-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737]">
                  <span className="text-[11px] text-[#668074] dark:text-[#9AB8A8] block">
                    {tr("Water")}
                  </span>
                  <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate block">
                    {selectedPlant.waterRequirement || "Regular"}
                  </span>
                </div>
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] p-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737]">
                  <span className="text-[11px] text-[#668074] dark:text-[#9AB8A8] block">
                    {tr("Sunlight")}
                  </span>
                  <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate block">
                    {selectedPlant.sunlightRequirement || "Bright Indirect"}
                  </span>
                </div>
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] p-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737]">
                  <span className="text-[11px] text-[#668074] dark:text-[#9AB8A8] block">
                    {tr("Soil")}
                  </span>
                  <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate block">
                    {selectedPlant.soilType || "Well-draining mix"}
                  </span>
                </div>
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] p-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737]">
                  <span className="text-[11px] text-[#668074] dark:text-[#9AB8A8] block">
                    {tr("Location")}
                  </span>
                  <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate block">
                    {selectedPlant.location || "Indoor Room"}
                  </span>
                </div>
              </div>

              {/* First-Person Conversational Speech Bubble */}
              {dailyData && (
                <div className="space-y-4 pt-2">
                  <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-4 sm:p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B] flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5" />
                        <span>
                          {getShortCallName(selectedPlant)} {tr("Says:")}
                        </span>
                      </span>
                      <span className="text-[11px] text-[#668074] dark:text-[#9AB8A8]">
                        {tr("Today's Plant Message")}
                      </span>
                    </div>
                    <p className="text-base sm:text-[17px] font-medium text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                      "{dailyData.message}"
                    </p>
                  </div>

                  {/* Speech Controls & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleSpeak(
                            "daily-msg",
                            `${dailyData.message}. ${dailyData.why}. ${(dailyData.needs || []).join(". ")}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#176B4D] hover:bg-[#13583F] text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {speakingId === "daily-msg" ? (
                          isPaused ? (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>{t.resume}</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-3.5 h-3.5" />
                              <span>{t.pause}</span>
                            </>
                          )
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{tr("Listen to Message")}</span>
                          </>
                        )}
                      </button>

                      {speakingId === "daily-msg" && (
                        <button
                          type="button"
                          onClick={handleStopSpeak}
                          className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-[#FBECE9] text-[#B84A39] text-xs font-semibold cursor-pointer"
                        >
                          <Square className="w-3 h-3" />
                          <span>{t.stop}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fetchDailyMessage(selectedPlant.id, personality)}
                        disabled={loadingDaily}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F6F1] dark:bg-[#1D3B2D] hover:bg-[#E4F0E7] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${loadingDaily ? "animate-spin" : ""}`}
                        />
                        <span>{tr("Refresh Message")}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/analyze?mode=disease&plantId=${selectedPlant.id}`)
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F6F1] dark:bg-[#1D3B2D] hover:bg-[#E4F0E7] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                        <span>{tr("Inspect Leaf Now")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2 & 3: Why PlantCare AI Thinks This & What My Plant Needs Now */}
            {dailyData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 2. Why PlantCare AI Thinks This */}
                <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-[#163A2D] dark:text-[#F1F7F3]">
                    <Compass className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {tr("Why PlantCare AI Thinks This")}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#527062] dark:text-[#B0C9BA] leading-relaxed">
                    {dailyData.why}
                  </p>
                </div>

                {/* 3. What My Plant Needs Now */}
                <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 shadow-2xs space-y-2">
                  <div className="flex items-center gap-2 text-[#176B4D] dark:text-[#8EAD9B]">
                    <Sparkles className="w-4 h-4" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      {tr("What My Plant Needs Now")}
                    </h3>
                  </div>
                  <ul className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] space-y-1.5 pl-4 list-disc">
                    {(dailyData.needs || []).map((item, idx) => (
                      <li key={idx} className="leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 4. What To Do Today (Action Plan & Care Check-In) */}
            <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE7DF] dark:border-[#244737] pb-3">
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-2">
                    <Check className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{tr("What To Do Today")}</span>
                  </h3>
                  <p className="text-xs text-[#668074] dark:text-[#9AB8A8]">
                    {tr("Recommended action plan based on current condition")}
                  </p>
                </div>
              </div>

              {dailyData?.todayActions && dailyData.todayActions.length > 0 && (
                <div className="space-y-2">
                  {dailyData.todayActions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3]"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Care Check-in Logging Buttons */}
              <div className="pt-2 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#668074] dark:text-[#9AB8A8] block">
                  {tr("Quick Actions Today")}
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {CARE_CHECKIN_BUTTONS.map((btn) => {
                    const isBusy = checkInLoadingType === btn.type;
                    return (
                      <button
                        key={btn.type}
                        type="button"
                        disabled={Boolean(checkInLoadingType)}
                        onClick={() => handleCareCheckIn(btn.type, btn.label)}
                        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] transition-all cursor-pointer disabled:opacity-60"
                      >
                        <span>{btn.emoji}</span>
                        <span>{tr(btn.label)}</span>
                        {isBusy && (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#176B4D] dark:text-[#8EAD9B]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Immediate Plant Check-In Reply */}
              {latestCheckInReply && (
                <div className="bg-[#E4F0E7]/60 dark:bg-[#1D3B2D] border border-[#176B4D]/30 dark:border-[#8EAD9B]/30 rounded-xl p-4 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                      🌿 {getShortCallName(selectedPlant)} — {latestCheckInReply.actionLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleSpeak("checkin-reply", latestCheckInReply.plantReply)
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{t.listen}</span>
                    </button>
                  </div>
                  <p className="text-sm font-medium text-[#163A2D] dark:text-[#F1F7F3]">
                    "{latestCheckInReply.plantReply}"
                  </p>
                </div>
              )}
            </div>

            {/* 5 & 7: What To Watch For Next + Prognosis Outlook */}
            {dailyData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 5. What To Watch For Next */}
                {dailyData.watchFor && (
                  <div className="bg-[#FDF3E3]/60 dark:bg-[#332614]/50 border border-[#F4DFBC] dark:border-[#4D391E] rounded-2xl p-4 sm:p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[#B26E23] dark:text-[#E5A95C]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        {tr("What To Watch For Next")}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#B26E23] dark:text-[#E5A95C] leading-relaxed">
                      {dailyData.watchFor}
                    </p>
                  </div>
                )}

                {/* 7. Prognosis & Outlook (What Could Happen Next) */}
                {dailyData.forecast && (
                  <div className="bg-[#E4F0E7]/40 dark:bg-[#1D3B2D]/40 border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-4 sm:p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[#176B4D] dark:text-[#8EAD9B]">
                      <TrendingUp className="w-4 h-4 shrink-0" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">
                        {tr("Prognosis & Care Outlook")}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                      {dailyData.forecast}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 6. Growth, Disease & Care Timeline (How Has My Plant Changed Over Time) */}
            <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-[#DCE7DF] dark:border-[#244737] pb-3">
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{tr("How My Plant Has Changed Over Time")}</span>
                  </h3>
                  <p className="text-xs text-[#668074] dark:text-[#9AB8A8]">
                    {tr("Chronological record of leaf diagnostic scans and care events")}
                  </p>
                </div>
              </div>

              {/* Latest Diagnostic Card if available */}
              {latestScan ? (
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Stethoscope className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B] shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                          {tr("Latest Leaf Scan Findings")}:{" "}
                          <span className="text-[#176B4D] dark:text-[#8EAD9B]">
                            {localizeDiseaseName(latestScan.disease_name)}
                          </span>
                        </p>
                        <p className="text-[11px] text-[#668074] dark:text-[#9AB8A8]">
                          {formatDateShort(latestScan.created_at)} • {tr("Confidence:")}{" "}
                          {Math.round((latestScan.confidence_score || 0.9) * 100)}%
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#E4F0E7] text-[#176B4D] dark:bg-[#1D3B2D] dark:text-[#8EAD9B]">
                      {latestScan.health_score ?? 90}% {tr("Health")}
                    </span>
                  </div>

                  {latestScan.symptoms && latestScan.symptoms.length > 0 && (
                    <div className="text-xs text-[#527062] dark:text-[#B0C9BA]">
                      <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                        {tr("Symptoms Identified:")}{" "}
                      </span>
                      {latestScan.symptoms.join(", ")}
                    </div>
                  )}

                  {latestScan.treatment_recommendations &&
                    latestScan.treatment_recommendations.length > 0 && (
                      <div className="text-xs text-[#527062] dark:text-[#B0C9BA]">
                        <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                          {tr("Recommended Treatments:")}{" "}
                        </span>
                        {latestScan.treatment_recommendations.slice(0, 2).join("; ")}
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-4 bg-[#F6F9F5] dark:bg-[#12281E] rounded-xl border border-[#DCE7DF] dark:border-[#244737] p-4">
                  <p className="text-xs text-[#668074] dark:text-[#9AB8A8]">
                    {tr("No historical scans for this plant yet")}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(`/analyze?mode=disease&plantId=${selectedPlant.id}`)}
                    className="mt-2 text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline cursor-pointer"
                  >
                    + {tr("Take Leaf Photo Scan")}
                  </button>
                </div>
              )}

              {/* Recent Care Events List */}
              {careEvents.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#668074] dark:text-[#9AB8A8] block">
                    {tr("Care History & Actions")}
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {careEvents.slice(0, 5).map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs"
                      >
                        <span className="text-[#163A2D] dark:text-[#F1F7F3] font-medium truncate">
                          {ev.note || ev.actionType}
                        </span>
                        <span className="text-[11px] text-[#668074] dark:text-[#9AB8A8] shrink-0">
                          {formatDateShort(ev.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Plant Care Progress Summary Cards */}
            <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Plant Care Progress")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#9AB8A8]">
                    <Droplets className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{tr("Last Watered")}</span>
                  </div>
                  <p className="text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {formatDateShort(selectedPlant.lastWateredAt)}
                  </p>
                </div>

                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#9AB8A8]">
                    <Calendar className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{tr("Last Health Scan")}</span>
                  </div>
                  <p className="text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {formatDateShort(selectedPlant.updatedAt || selectedPlant.createdAt)}
                  </p>
                </div>

                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#9AB8A8]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{tr("Current Health Score")}</span>
                  </div>
                  <p className="text-sm font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                    {selectedPlant.latestHealthScore ?? 90}/100
                  </p>
                </div>

                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#668074] dark:text-[#9AB8A8]">
                    <Sparkles className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                    <span>{tr("Care Actions This Week")}</span>
                  </div>
                  <p className="text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {careActionsThisWeekCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Interactive "Talk to Your Plant" Voice & Chat Assistant */}
          <div className="lg:col-span-5 bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col min-h-[580px] sticky top-6">
            <div className="pb-4 border-b border-[#DCE7DF] dark:border-[#244737] space-y-1">
              <h3 className="font-display text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#176B4D] dark:text-[#8EAD9B]" />
                <span>{tr("Talk to Your Plant")}</span>
              </h3>
              <p className="text-xs text-[#668074] dark:text-[#9AB8A8]">
                {getDisplayName(selectedPlant)}
              </p>
            </div>

            {/* Quick Suggested Prompt Chips */}
            <div className="py-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#668074] dark:text-[#9AB8A8] mb-2">
                {tr("Suggested Questions")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={sendingChat}
                    onClick={() => handleSendQuestion(tr(q))}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-xs font-medium text-[#163A2D] dark:text-[#F1F7F3] transition-colors text-left cursor-pointer disabled:opacity-50"
                  >
                    {tr(q)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 max-h-[440px] pr-1">
              {chatHistory.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mx-auto">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    🌿 {getShortCallName(selectedPlant)}
                  </p>
                  <p className="text-xs text-[#668074] dark:text-[#9AB8A8] max-w-xs mx-auto">
                    {tr("Ask your plant how it's doing...")}
                  </p>
                </div>
              ) : (
                chatHistory.map((turn) =>
                  turn.role === "user" ? (
                    <div key={turn.id} className="flex flex-col items-end space-y-1">
                      <div className="bg-[#176B4D] text-white rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%] text-sm space-y-2">
                        {turn.imagePreview && (
                          <img
                            src={turn.imagePreview}
                            alt="Uploaded leaf"
                            className="w-32 h-24 object-cover rounded-lg border border-white/20"
                          />
                        )}
                        <p>{turn.text}</p>
                      </div>
                      <span className="text-[10px] text-[#668074] dark:text-[#9AB8A8]">
                        {turn.timestamp}
                      </span>
                    </div>
                  ) : (
                    <div key={turn.id} className="flex flex-col items-start space-y-1.5">
                      <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl rounded-tl-xs p-4 max-w-[92%] space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                            🌿 {getShortCallName(selectedPlant)} {tr("Says:")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSpeak(turn.id, turn.text)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-[11px] font-semibold cursor-pointer"
                          >
                            {speakingId === turn.id && !isPaused ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>{t.pause}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3 h-3" />
                                <span>{t.listen}</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] whitespace-pre-line leading-relaxed">
                          {turn.text}
                        </div>
                      </div>
                      <span className="text-[10px] text-[#668074] dark:text-[#9AB8A8]">
                        {turn.timestamp}
                      </span>
                    </div>
                  )
                )
              )}

              {sendingChat && (
                <div className="bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-2xl p-3.5 max-w-[80%] flex items-center gap-2 text-xs text-[#527062] dark:text-[#B0C9BA]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#176B4D] dark:text-[#8EAD9B]" />
                  <span>🌿 {getShortCallName(selectedPlant)}...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Voice Error Notice */}
            {voiceError && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-[#FBECE9] dark:bg-[#381E1A] border border-[#F3D0C9] dark:border-[#522C26] text-xs text-[#B84A39] dark:text-[#E48677] flex items-center justify-between gap-2">
                <span>{voiceError}</span>
                <button
                  type="button"
                  onClick={() => setVoiceError(null)}
                  className="p-1 hover:opacity-75 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Attached Image Preview */}
            {attachedPreview && (
              <div className="mb-2.5 flex items-center gap-2 bg-[#F6F9F5] dark:bg-[#12281E] p-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737]">
                <img
                  src={attachedPreview}
                  alt="Attached leaf"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <span className="text-xs text-[#527062] dark:text-[#B0C9BA] flex-1 truncate">
                  {attachedFile?.name || tr("Upload Image")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(null);
                    setAttachedPreview(null);
                  }}
                  className="p-1 text-[#668074] hover:text-[#B84A39] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="pt-3 border-t border-[#DCE7DF] dark:border-[#244737] flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title={tr("Upload Image")}
                className="p-2.5 rounded-xl bg-[#F0F6F1] dark:bg-[#1D3B2D] hover:bg-[#E4F0E7] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] transition-colors cursor-pointer shrink-0"
              >
                <Camera className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
              </button>

              <button
                type="button"
                onClick={toggleVoiceInput}
                title={tr("Ask by Voice")}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                  isListening
                    ? "bg-[#FBECE9] border-[#B84A39] text-[#B84A39] animate-pulse"
                    : "bg-[#F0F6F1] dark:bg-[#1D3B2D] hover:bg-[#E4F0E7] text-[#163A2D] dark:text-[#F1F7F3] border-[#DCE7DF] dark:border-[#244737]"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={chatInputRef}
                type="text"
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendQuestion();
                  }
                }}
                placeholder={tr("Ask your plant how it's doing...")}
                className="flex-1 min-w-0 bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-xl px-3.5 py-2.5 text-sm text-[#163A2D] dark:text-[#F1F7F3] placeholder-[#668074] dark:placeholder-[#8EAD9B]/60 focus:outline-none focus:ring-2 focus:ring-[#176B4D]/30"
              />

              <button
                type="button"
                disabled={!questionInput.trim() || sendingChat}
                onClick={() => handleSendQuestion()}
                className="px-4 py-2.5 rounded-xl bg-[#176B4D] hover:bg-[#13583F] disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{tr("Send")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
