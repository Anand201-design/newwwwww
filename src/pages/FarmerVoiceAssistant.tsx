import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Camera,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sprout,
  Send,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Leaf,
  Globe,
  Check,
  Maximize2,
  Minimize2,
  MessageSquare,
  Bot,
  User,
  Radio,
} from "lucide-react";
import {
  FARMER_LANGUAGES,
  COMMON_FARMER_DOUBTS,
  POPULAR_CROPS,
  FarmerVoiceLanguage,
  FarmerVoiceAdvice,
  askFarmerVoiceAssistant,
  fetchFarmerStudioTts,
  loadSavedFarmerDoubts,
  saveFarmerDoubt,
  clearSavedFarmerDoubts,
  getRandomWelcomeGreeting,
} from "../services/farmerVoiceService";
import { useLanguage } from "../context/LanguageContext";
import { tts } from "../services/speechService";
import { validateImageFile } from "../utils/imageOptimizer";
import { safeLocalStorage } from "../utils/safeStorage";

interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  advice?: FarmerVoiceAdvice;
  timestamp: string;
}

export const FarmerVoiceAssistant: React.FC = () => {
  const { language: globalAppLang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlLangCode = searchParams.get("lang");

  // Selected language for PlantCare AI voice assistant
  const [selectedLang, setSelectedLang] = useState<FarmerVoiceLanguage>(() => {
    if (urlLangCode) {
      const match = FARMER_LANGUAGES.find((l) => l.code === urlLangCode);
      if (match) return match;
    }
    try {
      const stored = safeLocalStorage.getItem("farmer_voice_lang");
      if (stored) {
        const match = FARMER_LANGUAGES.find((l) => l.code === stored);
        if (match) return match;
      }
    } catch {
      // fallback
    }
    const defaultEn = FARMER_LANGUAGES.find((l) => l.code === "en");
    return defaultEn || FARMER_LANGUAGES[0];
  });

  // Assistant expansion mode (Apple Siri style smooth expansion)
  const [isExpandedMode, setIsExpandedMode] = useState(false);

  // Conversation history for multi-turn dialogue context
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);

  // Form & inputs
  const [questionText, setQuestionText] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);

  // Voice recording & Audio states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micVolume, setMicVolume] = useState(0); // 0 to 1 for live audio reactivity

  // Processing & result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState<FarmerVoiceAdvice | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedAdvice, setCopiedAdvice] = useState(false);

  // Audio Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.85 | 1.0>(1.0);
  const [audioSource, setAudioSource] = useState<"gemini" | "browser">("gemini");

  // History & Doubts
  const [savedDoubts, setSavedDoubts] = useState<FarmerVoiceAdvice[]>([]);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const conversationEndRef = useRef<HTMLDivElement | null>(null);

  // Initial load
  useEffect(() => {
    setSavedDoubts(loadSavedFarmerDoubts());
  }, []);

  // Sync URL lang param if it changes
  useEffect(() => {
    if (urlLangCode) {
      const match = FARMER_LANGUAGES.find((l) => l.code === urlLangCode);
      if (match && match.code !== selectedLang.code) {
        setSelectedLang(match);
      }
    }
  }, [urlLangCode, selectedLang.code]);

  // Check speech recognition support
  useEffect(() => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Auto-scroll conversation feed
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, isAnalyzing]);

  const activeLocale = selectedLang.bcp47;

  // Stop active TTS audio
  const stopActiveSpeech = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    tts.stop();
    setIsPlayingAudio(false);
  }, []);

  // Cleanup microphone audio meter
  const stopAudioMeter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    setMicVolume(0);
  }, []);

  // Start real-time microphone volume meter for Siri-like responsive orb
  const startAudioMeter = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1, avg / 90);
        setMicVolume(normalized);
        animationFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch {
      // Audio meter optional fallback
      setMicVolume(0.35);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopActiveSpeech();
      stopAudioMeter();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [stopActiveSpeech, stopAudioMeter]);

  // Language switcher handler
  const handleSelectLanguage = (lang: FarmerVoiceLanguage) => {
    stopActiveSpeech();
    setSelectedLang(lang);
    try {
      safeLocalStorage.setItem("farmer_voice_lang", lang.code);
    } catch {
      // ignore
    }
    setSearchParams({ lang: lang.code }, { replace: true });
    setStatusMessage(`Language set to ${lang.name} (${lang.nativeName})`);
  };

  // Play spoken answer aloud (Gemini Studio TTS first, browser TTS fallback)
  const playAdviceAudio = useCallback(
    async (advice: FarmerVoiceAdvice, forceSpeed?: number) => {
      stopActiveSpeech();
      setIsPlayingAudio(true);

      const speed = forceSpeed ?? playbackSpeed;
      const textToSpeak = advice.spokenSummary || advice.diagnosis;

      try {
        let wavBase64 = advice.audioUrl;
        if (!wavBase64) {
          const ttsResult = await fetchFarmerStudioTts(textToSpeak, advice.language);
          if (ttsResult?.audio) {
            wavBase64 = ttsResult.audio;
            advice.audioUrl = ttsResult.audio; // cache
          }
        }

        if (wavBase64) {
          setAudioSource("gemini");
          const audio = new Audio(`data:audio/wav;base64,${wavBase64}`);
          audio.playbackRate = speed;
          audioPlayerRef.current = audio;

          audio.onended = () => {
            setIsPlayingAudio(false);
          };

          audio.onerror = () => {
            speakWithBrowser(textToSpeak, advice.language, speed);
          };

          try {
            await audio.play();
            return;
          } catch (playErr) {
            console.warn("Audio autoplay prevented or failed:", playErr);
            speakWithBrowser(textToSpeak, advice.language, speed);
            return;
          }
        }
      } catch (err) {
        console.warn("Studio TTS playback failed, falling back to browser voice:", err);
      }

      speakWithBrowser(textToSpeak, advice.language, speed);
    },
    [playbackSpeed, stopActiveSpeech]
  );

  const speakWithBrowser = (text: string, langCode: string, rate: number) => {
    setAudioSource("browser");
    tts.speak(text, {
      lang: langCode,
      rate,
      pitch: 1.0,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // Submit doubt to PlantCare AI
  const handleSubmitDoubt = async (queryText?: string) => {
    const textToSubmit = (queryText || questionText).trim();
    if (!textToSubmit && !attachedImage) {
      setErrorMsg("Please speak your plant question or attach a leaf photo.");
      return;
    }

    stopActiveSpeech();
    stopAudioMeter();
    setIsListening(false);
    setIsAnalyzing(true);
    setErrorMsg(null);
    setStatusMessage("PlantCare AI is analyzing your question...");

    // Add user turn to conversation history
    const userTurn: ConversationTurn = {
      id: `usr_${Date.now()}`,
      role: "user",
      text: textToSubmit || "Uploaded crop/leaf photo for disease diagnosis",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setConversation((prev) => [...prev, userTurn]);
    setQuestionText("");
    setInterimTranscript("");

    // Build short-term history for Gemini
    const recentHistory = [...conversation, userTurn].slice(-6).map((c) => ({
      role: c.role,
      text: c.text,
    }));

    try {
      const result = await askFarmerVoiceAssistant({
        question: textToSubmit,
        language: selectedLang.code,
        cropName: selectedCrop || undefined,
        imageFile: attachedImage,
        history: recentHistory,
      });

      // Automated Language Detection & Dynamic Switching
      if (result.detectedLanguage) {
        const matched = FARMER_LANGUAGES.find((l) => l.code === result.detectedLanguage);
        if (matched && matched.code !== selectedLang.code) {
          setSelectedLang(matched);
        }
      }

      setCurrentAdvice(result);
      saveFarmerDoubt(result);
      setSavedDoubts(loadSavedFarmerDoubts());

      // Add assistant turn to conversation
      const assistantTurn: ConversationTurn = {
        id: `ai_${Date.now()}`,
        role: "assistant",
        text: result.spokenSummary,
        advice: result,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setConversation((prev) => [...prev, assistantTurn]);
      setStatusMessage(`Diagnosis: ${result.crop} • ${result.diagnosis}`);

      // Auto-speak answer if enabled
      if (autoSpeakEnabled) {
        setTimeout(() => {
          playAdviceAudio(result);
        }, 350);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to resolve doubt. Please try again.";
      setErrorMsg(msg);
      setStatusMessage("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start listening with Speech Recognition
  const startListeningSession = useCallback(() => {
    setErrorMsg(null);
    stopActiveSpeech();

    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Voice input is not supported in this browser. Please type your doubt below.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = activeLocale;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage(`Listening in ${selectedLang.name}... Speak now`);
        startAudioMeter();
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) isFinal = true;
        }

        if (transcript) {
          setInterimTranscript(transcript);
          setQuestionText(transcript);
        }

        // Automatic language detection heuristic (e.g. Tamil characters)
        if (/[\u0B80-\u0BFF]/.test(transcript) && selectedLang.code !== "ta") {
          const taLang = FARMER_LANGUAGES.find((l) => l.code === "ta");
          if (taLang) setSelectedLang(taLang);
        } else if (/[\u0900-\u097F]/.test(transcript) && selectedLang.code !== "hi") {
          const hiLang = FARMER_LANGUAGES.find((l) => l.code === "hi");
          if (hiLang) setSelectedLang(hiLang);
        }

        if (isFinal && transcript.trim().length > 2) {
          setTimeout(() => {
            handleSubmitDoubt(transcript);
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        stopAudioMeter();
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setErrorMsg("Microphone access was denied. Please allow microphone access to talk to PlantCare AI.");
        } else if (event.error !== "no-speech") {
          setErrorMsg(`Voice input status: ${event.error}. You can also type your doubt.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioMeter();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      stopAudioMeter();
      setErrorMsg("Could not start microphone voice recognition. Please try typing your question.");
    }
  }, [activeLocale, selectedLang, startAudioMeter, stopActiveSpeech, stopAudioMeter]);

  // Stop listening
  const stopListeningSession = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    stopAudioMeter();
  }, [stopAudioMeter]);

  // Interruption logic (user interrupts AI speaking)
  const handleInterruptSpeaking = useCallback(() => {
    stopActiveSpeech();
    startListeningSession();
  }, [stopActiveSpeech, startListeningSession]);

  // Activation flow: When user taps the AI Assistant button
  const handleActivateAssistant = useCallback(() => {
    setIsExpandedMode(true);
    stopActiveSpeech();

    // 1. Greet user naturally in selected language
    const welcomeText = getRandomWelcomeGreeting(selectedLang.code);
    setStatusMessage(welcomeText);

    // Speak welcome message
    speakWithBrowser(welcomeText, selectedLang.code, 1.0);

    // 2. Automatically enter listening after greeting or immediately
    setTimeout(() => {
      startListeningSession();
    }, 1200);
  }, [selectedLang.code, stopActiveSpeech, startListeningSession]);

  // Toggle listening button
  const handleToggleListening = () => {
    if (isPlayingAudio) {
      handleInterruptSpeaking();
      return;
    }
    if (isListening) {
      stopListeningSession();
    } else {
      startListeningSession();
    }
  };

  const handleSelectQuickPrompt = (doubt: any) => {
    const promptText = doubt.queryByLang[selectedLang.code] || doubt.queryByLang.en;
    setQuestionText(promptText);
    handleSubmitDoubt(promptText);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || "Invalid file format");
      return;
    }

    setAttachedImage(file);
    const objectUrl = URL.createObjectURL(file);
    setAttachedPreview(objectUrl);
  };

  const handleRemoveImage = () => {
    setAttachedImage(null);
    if (attachedPreview) {
      URL.revokeObjectURL(attachedPreview);
      setAttachedPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopyAdvice = (adv?: FarmerVoiceAdvice) => {
    const target = adv || currentAdvice;
    if (!target) return;
    const text = [
      `🌱 ${target.crop || "Plant"} — ${target.diagnosis}`,
      `🎙️ ${target.spokenSummary}`,
      "",
      "⚡ Immediate Steps & Dosage:",
      ...target.immediateSteps.map((s, i) => `${i + 1}. ${s}`),
      "",
      `🍃 Organic Remedy: ${target.organicRemedy}`,
      `🛡️ Spray Precautions & Weather: ${target.precautions}`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopiedAdvice(true);
    setTimeout(() => setCopiedAdvice(false), 2500);
  };

  // Dynamic Orb Size & Scale calculation based on mic volume and states
  const orbScale = isListening
    ? 1 + micVolume * 0.35
    : isPlayingAudio
      ? 1.08
      : isAnalyzing
        ? 1.04
        : 1.0;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-20 font-sans">
      {/* 1. TOP HERO: Aira AI Agricultural Voice Advisor */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12382A] via-[#174D39] to-[#0A241A] text-white p-6 sm:p-8 md:p-10 shadow-2xl border border-[#2B7A58]/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold tracking-wide text-[#A3E0C1]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] animate-ping" />
              <span>Aira • AI Agricultural Voice Advisor</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Natural Voice Advice for <span className="text-[#86EFAC]">Every Plant & Crop</span>
            </h1>

            <p className="text-sm sm:text-base text-[#D1E7DD] leading-relaxed">
              I am Aira, your empathetic botanical and crop care advisor. Speak naturally in any language or dialect (English, Hindi, Tamil, Telugu, Kannada, Marathi, Hinglish, etc.)—I automatically detect your dialect and give voice-optimized treatment steps.
            </p>
          </div>

          {/* Quick Activation Trigger on Hero */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              type="button"
              onClick={handleActivateAssistant}
              className="inline-flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#22C55E] to-[#10B981] hover:from-[#16A34A] hover:to-[#059669] text-white font-bold text-sm shadow-lg shadow-[#22C55E]/30 transition-all transform hover:scale-102 active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-yellow-200 animate-spin-slow" />
              <span>Talk with Aira</span>
            </button>

            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-medium border border-white/10 text-[#CDE6D8]">
              <Globe className="w-4 h-4 text-[#86EFAC]" />
              <span>Auto-Detecting: <strong>{selectedLang.name}</strong> ({selectedLang.nativeName})</span>
            </div>
          </div>
        </div>

        {/* Ambient Organic Glow Layers */}
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#22C55E]/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[#10B981]/15 blur-2xl" />
      </section>

      {/* 2. DYNAMIC VOICE AI LANGUAGE DETECTION & SWITCHING */}
      <section className="bg-white dark:bg-[#173126] rounded-2xl p-4 sm:p-5 border-2 border-[#176B4D]/25 dark:border-[#244737] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-[#176B4D] dark:text-[#8EAD9B]" />
            <span className="text-xs sm:text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              Dynamic Dialect Detection:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-bold">
              Active • {selectedLang.name} ({selectedLang.nativeName})
            </span>
          </div>
          <span className="text-xs text-[#668074] dark:text-[#9AB8A8] font-medium">
            No toggle needed — speak freely, or tap to pre-select:
          </span>
        </div>

        {/* Language Selection Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FARMER_LANGUAGES.map((lang) => {
            const isSelected = selectedLang.code === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-[#176B4D] text-white border-[#176B4D] shadow-sm scale-102 ring-2 ring-[#176B4D]/30"
                    : "bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#E2EBE5] border-[#DCE7DF] dark:border-[#244737] hover:bg-[#EAF2ED] dark:hover:bg-[#1B382B]"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                <span>{lang.name}</span>
                {lang.name !== lang.nativeName && (
                  <span className="opacity-80 text-[11px] font-normal">({lang.nativeName})</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. NEXT-GEN CONVERSATIONAL VOICE ASSISTANT INTERFACE */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-white to-[#F7FAF8] dark:from-[#173126] dark:to-[#12261E] border border-[#DCE7DF] dark:border-[#244737] shadow-xl p-6 sm:p-8 space-y-6">
        {/* Header Controls & Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E6EFE9] dark:border-[#224434]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#163A2D] dark:text-[#F1F7F3]">
                Aira • Interactive Voice Assistant
              </h2>
              <p className="text-xs text-[#668074] dark:text-[#9AB8A8]">
                {isListening
                  ? "Listening to your voice in any dialect... Speak naturally"
                  : isPlayingAudio
                    ? "Aira is speaking advice aloud (Tap orb to interrupt)"
                    : isAnalyzing
                      ? "Aira is analyzing symptoms & botanical remedies..."
                      : "Ready to answer any farming, crop, pest, or botanical doubt"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsExpandedMode(!isExpandedMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold text-[#163A2D] dark:text-[#E2EBE5] hover:bg-[#E4F0E7] transition-colors cursor-pointer"
            >
              {isExpandedMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Compact View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Expand Siri Experience</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Target Crop Selector (Kept visible but secondary as requested in POML) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#668074] dark:text-[#9AB8A8] flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
              Context Crop (Optional - AI automatically answers about ANY plant you ask about):
            </span>
            {selectedCrop && (
              <button
                type="button"
                onClick={() => setSelectedCrop("")}
                className="text-[11px] text-[#176B4D] dark:text-[#8EAD9B] underline hover:opacity-80 cursor-pointer"
              >
                Clear Context (General)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCrop("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer shrink-0 transition-colors ${
                !selectedCrop
                  ? "bg-[#176B4D] text-white font-bold"
                  : "bg-[#F0F6F1] dark:bg-[#12281E] text-[#163A2D] dark:text-[#E2EBE5] hover:bg-[#E4F0E7]"
              }`}
            >
              All Plants & Crops (General)
            </button>
            {POPULAR_CROPS.map((crop) => (
              <button
                key={crop.key}
                type="button"
                onClick={() => setSelectedCrop(crop.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer shrink-0 transition-colors ${
                  selectedCrop === crop.name
                    ? "bg-[#176B4D] text-white font-bold ring-2 ring-[#176B4D]/30"
                    : "bg-[#F0F6F1] dark:bg-[#12281E] text-[#163A2D] dark:text-[#E2EBE5] hover:bg-[#E4F0E7]"
                }`}
              >
                {crop.name}
              </button>
            ))}
          </div>
        </div>

        {/* 4. DYNAMIC PLANTCARE AI ORB & WAVEFORM SECTION */}
        <div className="relative flex flex-col items-center justify-center py-6 sm:py-10 bg-gradient-to-b from-[#F2F7F4] to-[#E9F3EC] dark:from-[#132A20] dark:to-[#0F221A] rounded-3xl border border-[#D5E3DA] dark:border-[#224434] overflow-hidden">
          {/* Concentric Ambient Waves and Ripples */}
          {isListening && (
            <>
              <div className="absolute w-52 h-52 rounded-full border-2 border-[#22C55E]/40 animate-orb-ripple pointer-events-none" />
              <div
                className="absolute w-72 h-72 rounded-full border border-[#10B981]/30 animate-orb-ripple pointer-events-none"
                style={{ animationDelay: "0.8s" }}
              />
              <div
                className="absolute w-96 h-96 rounded-full border border-[#4ADE80]/20 animate-orb-ripple pointer-events-none"
                style={{ animationDelay: "1.6s" }}
              />
            </>
          )}

          {isPlayingAudio && (
            <>
              <div className="absolute w-60 h-60 rounded-full bg-[#10B981]/15 animate-ping pointer-events-none" />
              <div className="absolute w-80 h-80 rounded-full bg-[#22C55E]/10 animate-pulse pointer-events-none" />
            </>
          )}

          {/* Central AI Orb */}
          <div className="relative z-10 flex flex-col items-center">
            <button
              type="button"
              onClick={handleToggleListening}
              disabled={isAnalyzing}
              aria-label={
                isListening
                  ? "Listening to microphone"
                  : isPlayingAudio
                    ? "Tap to interrupt speech and talk"
                    : "Tap to speak with PlantCare AI"
              }
              style={{ transform: `scale(${orbScale})` }}
              className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer active:scale-95 group select-none ${
                isListening
                  ? "bg-gradient-to-tr from-[#059669] via-[#10B981] to-[#34D399] text-white shadow-[#10B981]/50 ring-4 ring-[#34D399]/40 animate-orb-glow"
                  : isPlayingAudio
                    ? "bg-gradient-to-tr from-[#0D9488] via-[#14B8A6] to-[#2DD4BF] text-white shadow-[#14B8A6]/50 ring-4 ring-[#2DD4BF]/40"
                    : isAnalyzing
                      ? "bg-gradient-to-tr from-[#D97706] via-[#F59E0B] to-[#FBBF24] text-white shadow-[#F59E0B]/50 animate-pulse"
                      : "bg-gradient-to-tr from-[#164E3A] via-[#1A634A] to-[#2E8B67] hover:from-[#176B4D] hover:to-[#34A87C] text-white shadow-[#176B4D]/40"
              }`}
            >
              {/* Internal Organic Orb Glow & Shimmer */}
              <div className="absolute inset-1 rounded-full bg-white/15 backdrop-blur-sm pointer-events-none" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-t from-emerald-500/20 to-transparent blur-md pointer-events-none" />

              {/* Orb Center Icon & State */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                {isListening ? (
                  <>
                    <Mic className="w-9 h-9 sm:w-11 sm:h-11 animate-pulse" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1">
                      Listening...
                    </span>
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <Volume2 className="w-9 h-9 sm:w-11 sm:h-11 animate-bounce" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1">
                      Speaking...
                    </span>
                  </>
                ) : isAnalyzing ? (
                  <>
                    <Sparkles className="w-9 h-9 sm:w-11 sm:h-11 animate-spin-slow" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider mt-1">
                      Thinking...
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-9 h-9 sm:w-11 sm:h-11 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 opacity-90">
                      Tap to Speak
                    </span>
                  </>
                )}
              </div>
            </button>

            {/* Siri-Inspired Dynamic Audio Waveform Bars */}
            <div className="flex items-center gap-1.5 mt-5 h-8">
              {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6].map((mult, idx) => {
                const height = isListening
                  ? Math.max(6, Math.min(32, micVolume * 40 * mult + (idx % 2 ? 8 : 4)))
                  : isPlayingAudio
                    ? 8 + ((idx * 5) % 18)
                    : 6;

                return (
                  <div
                    key={idx}
                    style={{ height: `${height}px` }}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isListening
                        ? "bg-[#10B981]"
                        : isPlayingAudio
                          ? "bg-[#14B8A6] animate-pulse"
                          : "bg-[#8EAD9B]/50"
                    }`}
                  />
                );
              })}
            </div>

            {/* Interruption pill when speaking */}
            {isPlayingAudio && (
              <button
                type="button"
                onClick={handleInterruptSpeaking}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#1A382A] text-xs font-bold text-[#0D9488] dark:text-[#2DD4BF] shadow-md hover:bg-teal-50 cursor-pointer animate-fade-in"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Tap or Speak to Interrupt</span>
              </button>
            )}

            {/* Voice Status & Interim Transcript */}
            <div className="text-center mt-3 max-w-lg px-4 space-y-1">
              <p className="text-sm sm:text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {interimTranscript ? (
                  <span className="text-[#10B981]">"{interimTranscript}"</span>
                ) : statusMessage ? (
                  statusMessage
                ) : (
                  selectedLang.greetingPrompt
                )}
              </p>
              <p className="text-xs text-[#668074] dark:text-[#9AB8A8]">
                {isListening
                  ? "Mention pest symptoms, yellow leaves, fertilizer needs, or any plant."
                  : "Tap the AI Orb to speak in your language or attach an infected leaf image."}
              </p>
            </div>
          </div>
        </div>

        {/* 5. MULTI-TURN CONVERSATION FEED (Maintains dialogue context) */}
        {conversation.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#668074] dark:text-[#9AB8A8]">
                  Live Dialogue Session ({conversation.length} turns)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setConversation([])}
                className="text-xs text-[#668074] hover:text-red-500 cursor-pointer"
              >
                Clear Dialogue
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] scrollbar-thin">
              {conversation.map((turn) => (
                <div
                  key={turn.id}
                  className={`flex items-start gap-3 ${
                    turn.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {turn.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#176B4D] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                      turn.role === "user"
                        ? "bg-[#176B4D] text-white rounded-tr-none shadow-sm"
                        : "bg-white dark:bg-[#173126] text-[#163A2D] dark:text-[#F1F7F3] rounded-tl-none border border-[#DCE7DF] dark:border-[#244737] shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold opacity-75">
                        {turn.role === "user" ? "You" : "PlantCare AI Doctor"}
                      </span>
                      <span className="text-[10px] opacity-60">{turn.timestamp}</span>
                    </div>

                    <p className="leading-relaxed whitespace-pre-line">{turn.text}</p>

                    {turn.advice && (
                      <div className="mt-2.5 pt-2 border-t border-[#DCE7DF]/60 dark:border-[#244737] flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => playAdviceAudio(turn.advice!)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold hover:opacity-85 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen Again</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyAdvice(turn.advice)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F0F6F1] dark:bg-[#12281E] text-[#163A2D] dark:text-[#E2EBE5] text-xs font-medium hover:opacity-85 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy Dosage</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {turn.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={conversationEndRef} />
            </div>
          </div>
        )}

        {/* 6. SECONDARY TEXT MODE & PHOTO UPLOAD (Kept intact as required in POML) */}
        <div className="space-y-3 pt-2">
          {attachedPreview && (
            <div className="p-3 rounded-2xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={attachedPreview}
                  alt="Attached Crop"
                  className="w-12 h-12 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737]"
                />
                <div>
                  <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {attachedImage?.name || "Crop Leaf Photo Attached"}
                  </p>
                  <p className="text-[11px] text-[#668074] dark:text-[#9AB8A8]">
                    Image will be inspected for disease and pest diagnosis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs sm:text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer shrink-0"
            >
              <Camera className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
              <span>{attachedImage ? "Change Leaf Photo" : "Attach Leaf Photo"}</span>
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitDoubt();
                  }
                }}
                placeholder={
                  selectedLang.code === "ta"
                    ? "அல்லது கேள்வியை இங்கே தட்டச்சு செய்யவும்... (எ.கா. தக்காளி இலை சுருட்டை)"
                    : "Or type your plant doubt here... (e.g., Rose leaf black spots, Tomato fertilizer)"
                }
                disabled={isAnalyzing}
                className="w-full px-4 py-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#8EAD9B] focus:outline-none focus:ring-2 focus:ring-[#176B4D] focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSubmitDoubt()}
              disabled={isAnalyzing || (!questionText.trim() && !attachedImage)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#176B4D] hover:bg-[#12563D] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ask Solution</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audio Output Settings & Speed Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6EFE9] dark:border-[#224434] text-xs text-[#668074] dark:text-[#9AB8A8]">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSpeakEnabled}
                onChange={(e) => setAutoSpeakEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#176B4D] focus:ring-[#176B4D]"
              />
              <span className="font-medium">Automatically speak solution aloud</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span>Voice Speed:</span>
            <button
              type="button"
              onClick={() => setPlaybackSpeed(0.85)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                playbackSpeed === 0.85
                  ? "bg-[#176B4D] text-white"
                  : "bg-[#F0F6F1] dark:bg-[#12281E] text-[#163A2D] dark:text-[#E2EBE5]"
              }`}
            >
              0.85x (Clear)
            </button>
            <button
              type="button"
              onClick={() => setPlaybackSpeed(1.0)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                playbackSpeed === 1.0
                  ? "bg-[#176B4D] text-white"
                  : "bg-[#F0F6F1] dark:bg-[#12281E] text-[#163A2D] dark:text-[#E2EBE5]"
              }`}
            >
              1.0x (Normal)
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>

      {/* 7. ONE-TAP COMMON DOUBTS */}
      <section className="bg-white dark:bg-[#173126] rounded-2xl p-5 border border-[#DCE7DF] dark:border-[#244737] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
            <h3 className="text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              ⚡ Quick Common Doubts (One-Tap Voice Query):
            </h3>
          </div>
          <span className="text-xs text-[#668074] dark:text-[#9AB8A8]">
            Tap to ask in {selectedLang.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {COMMON_FARMER_DOUBTS.map((doubt) => (
            <button
              key={doubt.id}
              type="button"
              onClick={() => handleSelectQuickPrompt(doubt)}
              disabled={isAnalyzing}
              className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#176B4D] hover:bg-[#EAF2ED] dark:hover:bg-[#1B382B] transition-all text-left flex items-start gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <span className="text-lg">{doubt.icon}</span>
              <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] leading-snug line-clamp-2">
                {doubt.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 8. ACTIVE ADVICE CARD (When available) */}
      {currentAdvice && (
        <section className="rounded-3xl bg-white dark:bg-[#173126] border-2 border-[#176B4D]/40 dark:border-[#2B7A58] p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                <Sprout className="w-3.5 h-3.5" />
                <span>{currentAdvice.crop || "Plant / Crop"}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3]">
                {currentAdvice.diagnosis}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => playAdviceAudio(currentAdvice)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[#12563D] transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingAudio ? "Replay Audio" : "Play Voice"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyAdvice()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs sm:text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3] hover:bg-[#E4F0E7] cursor-pointer"
              >
                <Copy className="w-4 h-4 text-[#176B4D]" />
                <span>{copiedAdvice ? "Copied!" : "Copy Advice"}</span>
              </button>
            </div>
          </div>

          {/* Voice Summary Audio Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EAF4EE] to-[#E2EFE7] dark:from-[#1A382A] dark:to-[#142E22] border border-[#C5DED0] dark:border-[#234A37] flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176B4D] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] uppercase tracking-wider">
                Spoken Agronomist Summary:
              </span>
              <p className="text-sm sm:text-base font-semibold text-[#163A2D] dark:text-[#F1F7F3] mt-0.5 leading-relaxed">
                "{currentAdvice.spokenSummary}"
              </p>
            </div>
          </div>

          {/* Immediate Steps with exact dosages */}
          <div className="space-y-3">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
              <span>Immediate Treatment Steps & Precise Dosage:</span>
            </h4>

            <div className="space-y-2">
              {currentAdvice.immediateSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]"
                >
                  <span className="w-6 h-6 rounded-full bg-[#176B4D] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Organic Alternative & Spray Precautions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B] uppercase tracking-wider">
                <Leaf className="w-4 h-4 text-[#16A34A]" />
                <span>Organic / Natural Alternative:</span>
              </div>
              <p className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                {currentAdvice.organicRemedy}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D97706] dark:text-[#FBBF24] uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-[#D97706]" />
                <span>Spray Timing & Safety Precautions:</span>
              </div>
              <p className="text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed">
                {currentAdvice.precautions}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 9. PREVIOUS DOUBTS HISTORY */}
      {savedDoubts.length > 0 && (
        <section className="bg-white dark:bg-[#173126] rounded-2xl p-5 border border-[#DCE7DF] dark:border-[#244737] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#DCE7DF] dark:border-[#244737]">
            <h3 className="text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              📜 Previous Doubts History
            </h3>
            <button
              type="button"
              onClick={() => {
                clearSavedFarmerDoubts();
                setSavedDoubts([]);
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Clear History
            </button>
          </div>

          <div className="space-y-2.5">
            {savedDoubts.slice(0, 5).map((doubt) => (
              <div
                key={doubt.id}
                className="p-3 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                      {doubt.crop}
                    </span>
                    <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                      — {doubt.diagnosis}
                    </span>
                  </div>
                  <p className="text-xs text-[#668074] dark:text-[#9AB8A8] line-clamp-1">
                    "{doubt.question}"
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentAdvice(doubt);
                      playAdviceAudio(doubt);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:opacity-85 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Listen Again</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
