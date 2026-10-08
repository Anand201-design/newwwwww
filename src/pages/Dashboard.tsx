import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sprout,
  Stethoscope,
  Sparkles,
  Activity,
  ScanLine,
  Upload,
  Camera,
  ArrowRight,
  ChevronRight,
  Leaf,
  Sun,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
  Layers,
  Thermometer,
  Droplets,
  Loader2,
  Clock,
  Check,
  Calendar,
  Bookmark,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { DeleteAnalysisModal } from "../components/DeleteAnalysisModal";
import { DashboardStatCard } from "../components/DashboardStatCard";
import {
  plantService,
  PlantProfileItem,
  DiagnosticResult,
} from "../services/plantService";
import {
  validateImageFile,
  optimizeImageForAnalysis,
} from "../utils/imageOptimizer";
import {
  REAL_PLANT_IMAGES,
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";
import { tts } from "../services/speechService";

interface CareReminder {
  id: string;
  plantName: string;
  task: string;
  type: "water" | "light" | "fertilize" | "prune";
  dueDate: string;
  isUrgent?: boolean;
  completed: boolean;
}

interface ActivityEvent {
  id: string;
  type: "identify" | "disease" | "care" | "plant_added" | "sensor";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language, tr, localizePlantName, localizeDiseaseName } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [analyses, setAnalyses] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCareModal, setShowCareModal] = useState(false);
  const [showPlantsModal, setShowPlantsModal] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [newLocation, setNewLocation] = useState("Living Room Shelf");
  const [analysisToDelete, setAnalysisToDelete] =
    useState<DiagnosticResult | null>(null);
  const [isDeletingAnalysis, setIsDeletingAnalysis] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showDeleteFeedback = (type: "success" | "error", message: string) => {
    setDeleteFeedback({ type, message });
    setTimeout(() => {
      setDeleteFeedback((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const handleConfirmDeleteAnalysis = async () => {
    if (!analysisToDelete) return;
    setIsDeletingAnalysis(true);
    try {
      await plantService.deleteAnalysis(analysisToDelete.id);
      setAnalyses((prev) =>
        prev.filter((item) => item.id !== analysisToDelete.id)
      );
      setAnalysisToDelete(null);
      showDeleteFeedback("success", tr("Analysis deleted successfully."));
    } catch {
      setAnalysisToDelete(null);
      showDeleteFeedback(
        "error",
        tr("Unable to delete this analysis. Please try again.")
      );
    } finally {
      setIsDeletingAnalysis(false);
    }
  };

  const [reminders, setReminders] = useState<CareReminder[]>([
    {
      id: "rem-1",
      plantName: "Monstera Deliciosa",
      task: "Check soil moisture & mist fenestrated leaves",
      type: "water",
      dueDate: "Today",
      isUrgent: true,
      completed: false,
    },
    {
      id: "rem-2",
      plantName: "Tomato (Bed A4)",
      task: "Apply organic bio-fungicide for early blight prevention",
      type: "prune",
      dueDate: "Today",
      isUrgent: true,
      completed: false,
    },
    {
      id: "rem-3",
      plantName: "Chilli Pepper",
      task: "Fertigate with balanced organic nitrogen amendment",
      type: "fertilize",
      dueDate: "Tomorrow",
      isUrgent: false,
      completed: false,
    },
    {
      id: "rem-4",
      plantName: "Garden Rose",
      task: "Rotate pot 90° for uniform sun exposure",
      type: "light",
      dueDate: "In 2 days",
      isUrgent: false,
      completed: false,
    },
  ]);

  useEffect(() => {
    Promise.all([plantService.getPlants(), plantService.getAnalysisHistory()])
      .then(([pList, aList]) => {
        setPlants(pList);
        setAnalyses(aList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r))
    );
  };

  const attentionPlants = useMemo(() => {
    return plants.filter(
      (p) =>
        (p.latestStatus && p.latestStatus !== "Healthy") ||
        (typeof p.latestHealthScore === "number" && p.latestHealthScore < 85) ||
        (p.latestDisease && p.latestDisease !== "Healthy")
    );
  }, [plants]);

  const healthStats = useMemo(() => {
    const totalPlants = plants.length;
    const healthyCount = plants.filter(
      (p) =>
        p.latestStatus === "Healthy" ||
        (!p.latestStatus && (p.latestHealthScore ?? 90) >= 85)
    ).length;
    const attentionCount = plants.filter(
      (p) =>
        p.latestStatus === "Mild Stress" ||
        p.latestStatus === "Moderate Stress"
    ).length;
    const criticalCount = plants.filter(
      (p) =>
        p.latestStatus === "Severe Stress" ||
        p.latestStatus === "Disease Suspected"
    ).length;
    const needingAttentionTotal = attentionPlants.length;
    const avgScore =
      totalPlants > 0
        ? Math.round(
            plants.reduce((acc, p) => acc + (p.latestHealthScore ?? 90), 0) /
              totalPlants
          )
        : 0;

    return {
      totalPlants,
      healthyCount,
      attentionCount,
      criticalCount,
      needingAttentionTotal,
      avgScore,
    };
  }, [plants, attentionPlants]);

  const lastAnalysisBadge = useMemo(() => {
    if (analyses.length === 0) {
      return tr("Ready to scan");
    }
    const latestDateStr = analyses[0]?.created_at;
    if (!latestDateStr) {
      return tr("Last analysis: Today");
    }
    const latestDate = new Date(latestDateStr);
    const now = new Date();
    const isSameDay =
      latestDate.getFullYear() === now.getFullYear() &&
      latestDate.getMonth() === now.getMonth() &&
      latestDate.getDate() === now.getDate();
    const diffHours = (now.getTime() - latestDate.getTime()) / (1000 * 3600);

    if (isSameDay || diffHours < 24) {
      return tr("Last analysis: Today");
    }
    if (diffHours < 48) {
      return tr("Last analysis: Yesterday");
    }
    const formatted = latestDate.toLocaleDateString(
      language === "ta" ? "ta-IN" : "en-US",
      { month: "short", day: "numeric" }
    );
    return `${tr("Last analysis:")} ${formatted}`;
  }, [analyses, language, tr]);

  const recentActivities: ActivityEvent[] = useMemo(() => {
    const list: ActivityEvent[] = [];
    if (analyses.length > 0) {
      analyses.slice(0, 3).forEach((a) => {
        const isDisease = a.disease_name && a.disease_name !== "Healthy";
        list.push({
          id: `act-${a.id}`,
          type: isDisease ? "disease" : "identify",
          title: isDisease
            ? `Disease Scan: ${a.disease_name}`
            : `Species Identified: ${a.plant_name}`,
          description: `${a.plant_name} (${a.scientific_name || "Botanical specimen"}) · Confidence ${Math.round((a.confidence_score || 0.95) * 100)}%`,
          timestamp: "Recently",
          link: `/results/${a.id}`,
        });
      });
    } else {
      list.push(
        {
          id: "act-default-1",
          type: "disease",
          title: "Disease Detection: Early Blight",
          description: "Tomato leaf checked · Moderate severity symptoms identified",
          timestamp: "2 hours ago",
          link: "/results/671f9b20c4d8a912e4560201",
        },
        {
          id: "act-default-2",
          type: "identify",
          title: "Plant Identified: Garden Rose",
          description: "Rosa × hybrida · Healthy foliage (96% health score)",
          timestamp: "5 hours ago",
          link: "/results/671f9b20c4d8a912e4560202",
        },
        {
          id: "act-default-3",
          type: "care",
          title: "Care Update: Soil Moisture",
          description: "Monstera Deliciosa watered to 68% optimal moisture",
          timestamp: "Yesterday",
          link: "/care",
        }
      );
    }
    return list;
  }, [analyses]);

  const dailyInsightText = tr(
    "“Your Monstera is thriving. Rotate it a quarter turn this week to encourage balanced foliar growth toward the light.”"
  );

  const handleListenInsight = () => {
    if (isPlayingAudio) {
      tts.stop();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    tts.speak(
      dailyInsightText.replace(/[“”"]/g, ""),
      () => setIsPlayingAudio(false),
      () => setIsPlayingAudio(false),
      language
    );
  };

  const handleFileProcess = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(tr(validation.error || "Invalid image file."));
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const optimizedFile = await optimizeImageForAnalysis(file);
      const formData = new FormData();
      formData.append("image", optimizedFile);
      formData.append("mime_type", optimizedFile.type || "image/jpeg");
      formData.append("language", language);
      const result = await plantService.analyzePlantImage(formData);
      if (result && result.id) {
        navigate(`/results/${result.id}`, { state: { result } });
      } else {
        throw new Error(tr("Analysis failed. Please try again."));
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? tr(err.message) : tr("Analysis failed."));
      setIsUploading(false);
    }
  };

  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setVideoStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setShowCameraModal(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          stopCamera();
          handleFileProcess(file);
        }
      }, "image/jpeg");
    }
  };

  const handleRegisterPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlantName.trim()) return;
    try {
      const created = await plantService.createPlant({
        plantName: newPlantName.trim(),
        scientificName: newScientificName.trim() || "Monstera deliciosa",
        location: newLocation.trim(),
        category: "Indoor Tropical",
        latestHealthScore: 94,
        latestStatus: "Healthy",
        latestDisease: "Healthy",
      });
      setPlants((prev) => [created, ...prev]);
      setNewPlantName("");
      setNewScientificName("");
      setShowPlantsModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-7 pb-16 font-sans select-none max-w-[1320px] mx-auto relative">
      {deleteFeedback && (
        <div
          role="status"
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 border ${
            deleteFeedback.type === "success"
              ? "bg-[#176B4D] text-white border-[#12563D]"
              : "bg-white dark:bg-[#173126] text-[#C96F62] border-[#C96F62]/40"
          }`}
        >
          {deleteFeedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{deleteFeedback.message}</span>
        </div>
      )}
      {/* 1. TOP HERO CARD */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-white via-[#F2F8F4] to-[#DFEFE6] dark:from-[#173126] dark:via-[#142C22] dark:to-[#0F241B] border border-[#C6DDD0] dark:border-[#2A5240] p-6 sm:p-8 lg:p-9 shadow-[0_4px_16px_rgba(23,107,77,0.08)]">
        {/* Minimalist Tree-Theme Background Artwork with Forest Green Shade */}
        <svg
          viewBox="0 0 1200 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-95 dark:opacity-60 z-0"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="heroTreeCanopy1" x1="680" y1="20" x2="680" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.06" />
            </linearGradient>
            <linearGradient id="heroTreeCanopy2" x1="1180" y1="-10" x2="940" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#163A2D" stopOpacity="0.38" />
              <stop offset="55%" stopColor="#176B4D" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="heroForestGroundShade" x1="600" y1="270" x2="600" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#176B4D" stopOpacity="0" />
              <stop offset="100%" stopColor="#176B4D" stopOpacity="0.14" />
            </linearGradient>
          </defs>

          {/* Soft forest green lower horizon shade */}
          <path
            d="M0 315 Q 360 295, 720 312 T 1200 300 L 1200 360 L 0 360 Z"
            fill="url(#heroForestGroundShade)"
          />
          <path
            d="M0 335 Q 360 322, 720 332 T 1200 326"
            stroke="#176B4D"
            strokeWidth="1.4"
            strokeOpacity="0.32"
          />

          {/* Center-right minimalist architectural tree (slender trunk, forked limbs, forest green canopy) */}
          <circle cx="690" cy="135" r="90" fill="url(#heroTreeCanopy1)" />
          <circle cx="748" cy="165" r="58" fill="url(#heroTreeCanopy1)" />
          <circle cx="636" cy="172" r="54" fill="url(#heroTreeCanopy1)" />
          {/* Tree trunk and minimalist Y-branches */}
          <path
            d="M690 332 V 145 M690 235 C668 212, 648 192, 635 168 M690 205 C715 184, 734 168, 748 146 M690 175 C676 155, 665 138, 658 118 M662 204 C650 200, 638 198, 626 200 M720 178 C732 176, 744 178, 756 184"
            stroke="#163A2D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.45"
          />
          {/* Minimalist forest green leaf nodes on center-right tree */}
          <path
            d="M658 118 C652 104, 660 92, 670 98 C668 110, 662 115, 658 118 Z"
            fill="#176B4D"
            fillOpacity="0.42"
          />
          <path
            d="M748 146 C754 134, 766 132, 768 142 C760 148, 752 148, 748 146 Z"
            fill="#176B4D"
            fillOpacity="0.38"
          />
          <path
            d="M635 168 C624 160, 624 148, 634 146 C638 154, 638 162, 635 168 Z"
            fill="#2D8A62"
            fillOpacity="0.38"
          />

          {/* Far-right overhanging minimalist tree bough in deep forest green */}
          <path
            d="M1210 28 C1130 42, 1065 78, 1005 132 C978 156, 952 172, 922 184"
            stroke="#163A2D"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeOpacity="0.48"
          />
          <path
            d="M1095 62 C1072 92, 1058 122, 1035 148 M1005 132 C982 124, 962 112, 944 96"
            stroke="#176B4D"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.42"
          />
          <path
            d="M1205 -10 C1125 12, 1075 68, 1098 145 C1152 120, 1190 62, 1205 -10 Z"
            fill="url(#heroTreeCanopy2)"
          />
          <path
            d="M944 96 C930 88, 932 74, 946 74 C950 84, 948 92, 944 96 Z"
            fill="#176B4D"
            fillOpacity="0.42"
          />
          <path
            d="M922 184 C906 180, 902 190, 912 198 C920 196, 922 190, 922 184 Z"
            fill="#2D8A62"
            fillOpacity="0.4"
          />

          {/* Left-side minimalist sapling silhouette */}
          <circle cx="48" cy="272" r="46" fill="url(#heroTreeCanopy1)" />
          <path
            d="M48 335 V 242 M48 295 L 28 272 M48 278 L 68 256"
            stroke="#176B4D"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeOpacity="0.38"
          />
        </svg>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center relative z-10">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              <span>{tr("Botanical Health & Diagnostics")}</span>
            </div>

            <div className="space-y-2.5">
              <h1 className="font-display text-[32px] sm:text-[42px] lg:text-[50px] font-extrabold text-[#163A2D] dark:text-[#F1F7F3] tracking-[-0.035em] leading-[1.08] text-balance">
                {tr("Know Your Plant.")}{" "}
                <span className="block sm:inline text-[#176B4D] dark:text-[#8EAD9B] font-semibold">
                  {tr("Keep It Healthy.")}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#668074] dark:text-[#B0C9BA] max-w-xl leading-relaxed">
                {tr("AI-powered plant identification, disease detection and personalized care insights.")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate("/analyze?mode=identify")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] transition-all cursor-pointer shadow-2xs active:scale-95"
              >
                <Sprout className="w-4 h-4" />
                <span>{tr("Identify Plant")}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/analyze?mode=disease")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] hover:bg-[#DCE7DF] border border-[#DCE7DF] dark:border-[#244737] transition-all cursor-pointer active:scale-95"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{tr("Detect Disease")}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/plants")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#F0F6F1] border border-[#DCE7DF] dark:border-[#244737] transition-all cursor-pointer active:scale-95"
              >
                <Bookmark className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
                <span>{tr("View My Plants")}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[360px] bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] rounded-[20px] p-4 space-y-3.5">
              <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737]">
                <img
                  src="/src/assets/images/hero_monstera_plant_1791123269478.jpg"
                  alt="Monstera Deliciosa"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 dark:bg-[#173126]/95 border border-[#DCE7DF] dark:border-[#244737] text-[11px] font-semibold text-[#176B4D] dark:text-[#8EAD9B]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A62]" />
                  <span>{tr("Healthy Specimen")}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {localizePlantName("Monstera Deliciosa")}
                  </p>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">{tr("Swiss Cheese Plant")}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-bold">
                  {healthStats.avgScore}% {tr("Health")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1.5 FARMER VOICE ASSISTANT HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#176B4D] via-[#1E5C45] to-[#124231] text-white p-5 sm:p-7 shadow-lg border border-[#2B7759]/60">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse" />
              <span>🌾 Farmer Voice Assistant • AI Crop Advisor</span>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
              Ask Any Crop Doubts by Voice in English
            </h2>
            <p className="text-xs sm:text-sm text-[#D1E7DD] leading-relaxed">
              Get immediate spoken diagnosis, exact chemical dosages, spray timing, and organic remedies. You can speak in English or switch to 10+ regional languages anytime.
            </p>

            {/* Quick Language Switcher & Prompt Chips */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-[#A7F3D0] uppercase tracking-wider">
                  Speak in:
                </span>
                <Link
                  to="/farmer-voice?lang=en"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-[#176B4D] font-bold text-xs shadow-xs hover:bg-[#E4F0E7] transition-colors"
                >
                  <span>English (Default)</span>
                </Link>
                <Link
                  to="/farmer-voice?lang=hi"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-xs transition-colors"
                >
                  <span>हिन्दी (Hindi)</span>
                </Link>
                <Link
                  to="/farmer-voice?lang=ta"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-xs transition-colors"
                >
                  <span>தமிழ் (Tamil)</span>
                </Link>
                <Link
                  to="/farmer-voice?lang=te"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-xs transition-colors"
                >
                  <span>తెలుగు (Telugu)</span>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/farmer-voice?lang=en"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors"
                >
                  <span>🐛 Pests & Worms</span>
                </Link>
                <Link
                  to="/farmer-voice?lang=en"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors"
                >
                  <span>🍃 Leaf Yellowing</span>
                </Link>
                <Link
                  to="/farmer-voice?lang=en"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors"
                >
                  <span>🧪 Fertilizer Dosage</span>
                </Link>
                <Link
                  to="/farmer-voice?lang=en"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors"
                >
                  <span>🌿 Organic Sprays</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            <Link
              to="/farmer-voice"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-white to-[#E4F0E7] text-[#176B4D] hover:to-white font-bold text-xs sm:text-sm transition-all shadow-md hover:scale-102 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-5 h-5 text-[#10B981] animate-spin-slow" />
              <span>Activate PlantCare AI Voice</span>
            </Link>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-[#34D399]/20 blur-2xl" />
      </section>

      {/* 2. SUMMARY METRIC CARDS */}
      <section
        aria-label={tr("Plant Health Summary")}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        <DashboardStatCard
          loading={loading}
          title={tr("Plant Health")}
          value={healthStats.totalPlants > 0 ? `${healthStats.avgScore}%` : "0%"}
          description={
            healthStats.totalPlants > 0
              ? tr("Average health across your monitored plants")
              : tr("Add your first plant to start monitoring")
          }
          badgeText={
            healthStats.totalPlants > 0
              ? `↑ 4.2% ${tr("this week")}`
              : tr("No plants yet")
          }
          badgeVariant={healthStats.totalPlants > 0 ? "positive" : "neutral"}
          icon={<Activity className="w-4.5 h-4.5" />}
          onClick={() => {
            const overviewEl = document.getElementById("plant-health-overview");
            if (overviewEl) {
              overviewEl.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
              navigate("/plants");
            }
          }}
        />

        <DashboardStatCard
          loading={loading}
          title={tr("Plants Monitored")}
          value={healthStats.totalPlants}
          description={
            healthStats.totalPlants > 0
              ? tr("Plants currently in your collection")
              : tr("Add your first plant to start monitoring")
          }
          badgeText={
            healthStats.totalPlants > 0
              ? `${healthStats.healthyCount} ${tr("healthy")}`
              : tr("No plants yet")
          }
          badgeVariant={healthStats.totalPlants > 0 ? "positive" : "neutral"}
          icon={<Leaf className="w-4.5 h-4.5" />}
          onClick={() => navigate("/plants")}
        />

        <DashboardStatCard
          loading={loading}
          title={tr("Recent Analyses")}
          value={analyses.length}
          description={
            analyses.length > 0
              ? tr("AI plant analyses completed")
              : tr("No analyses yet")
          }
          badgeText={lastAnalysisBadge}
          badgeVariant={analyses.length > 0 ? "positive" : "neutral"}
          icon={<ScanLine className="w-4.5 h-4.5" />}
          onClick={() => navigate("/history")}
        />

        <DashboardStatCard
          loading={loading}
          title={tr("Plants Needing Attention")}
          value={healthStats.needingAttentionTotal}
          description={
            healthStats.needingAttentionTotal > 0
              ? tr("Plants showing symptoms or care needs")
              : healthStats.totalPlants > 0
                ? tr("All plants look healthy")
                : tr("Add your first plant to start monitoring")
          }
          badgeText={
            healthStats.needingAttentionTotal > 0
              ? tr("Treatment required")
              : tr("Optimal status")
          }
          badgeVariant={
            healthStats.needingAttentionTotal > 0 ? "attention" : "positive"
          }
          accentVariant={
            healthStats.needingAttentionTotal > 0 ? "attention" : "botanical"
          }
          icon={<AlertTriangle className="w-4.5 h-4.5" />}
          onClick={() => {
            if (healthStats.needingAttentionTotal > 0) {
              navigate("/plants?filter=attention");
            } else {
              navigate("/plants");
            }
          }}
        />
      </section>

      {/* 3. PLANT HEALTH SUMMARY + AI INSIGHT */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div
          id="plant-health-overview"
          className="lg:col-span-7 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Plant Health Summary")}
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Overall collection wellness overview")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/plants")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
            >
              <span>{tr("View All")} ({healthStats.totalPlants})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center py-5">
            <div className="sm:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-[#E4F0E7] dark:text-[#1D3B2D]"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="#176B4D"
                    strokeWidth="6.5"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - healthStats.avgScore / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-display text-2xl font-extrabold text-[#163A2D] dark:text-[#F1F7F3]">
                    {healthStats.avgScore}%
                  </span>
                  <span className="text-[10px] text-[#668074] dark:text-[#B0C9BA] mt-1 uppercase font-semibold">
                    {tr("Health Score")}
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:col-span-7 space-y-2.5">
              <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2D8A62] shrink-0" />
                  <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    {tr("Healthy & Thriving")}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#176B4D] dark:text-[#8EAD9B]">
                  {healthStats.healthyCount} / {healthStats.totalPlants}
                </span>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C98A4A] shrink-0" />
                  <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    {tr("Needs Care")}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#C98A4A]">
                  {healthStats.attentionCount} / {healthStats.totalPlants}
                </span>
              </div>

              <div className="px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C96F62] shrink-0" />
                  <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3]">
                    {tr("Disease Detected")}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#C96F62]">
                  {healthStats.criticalCount} / {healthStats.totalPlants}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-3">
              <img
                src={REAL_PLANT_IMAGES.monstera}
                alt="Monstera Deliciosa care insight"
                referrerPolicy="no-referrer"
                onError={(e) => handlePlantImageError(e, "Monstera Deliciosa")}
                className="w-11 h-11 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
              />
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Daily Care Insight")}
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Monstera Deliciosa · Seasonal Tip")}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F0F6F1] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] border-l-4 border-l-[#176B4D]">
            <blockquote className="font-sans text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] leading-relaxed italic">
              {dailyInsightText}
            </blockquote>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#DCE7DF] dark:border-[#244737] text-xs">
            <span className="flex items-center gap-1.5 text-[#668074] dark:text-[#B0C9BA] font-medium">
              <Sun className="w-4 h-4 text-[#C98A4A]" />
              {tr("Bright indirect morning light")}
            </span>
            <button
              type="button"
              onClick={handleListenInsight}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F6F9F5] dark:bg-[#12281E] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>{tr("Stop")}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                  <span>{tr("Listen")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* TODAY'S PLANT TALK PREVIEW CARD */}
      <section className="bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-5 sm:p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B]">
              <span>🌿 {tr("Plant Talk")}</span>
              <span className="text-[#668074] dark:text-[#9AB8A8] font-normal">
                · {tr("AI Interpretation")}
              </span>
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#163A2D] dark:text-[#F1F7F3]">
              {plants[0]?.nickname
                ? `${plants[0].nickname} (${localizePlantName(plants[0].plantName)})`
                : localizePlantName(plants[0]?.plantName || "Monstera Deliciosa")}{" "}
              {tr("Says:")}
            </h3>
            <p className="text-sm text-[#163A2D] dark:text-[#D5E5DC] leading-relaxed italic">
              "{tr("Hi! Please check my soil moisture today and keep me in bright indirect light.")}"
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                navigate(plants[0]?.id ? `/plant-talk?plantId=${plants[0].id}` : "/plant-talk")
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B4D] hover:bg-[#13583F] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>{tr("Open Plant Talk")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                tts.speak(
                  tr("Hi! Please check my soil moisture today and keep me in bright indirect light."),
                  { lang: language }
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] text-[#163A2D] dark:text-[#F1F7F3] border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
              <span>{tr("Listen")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. PLANTS NEEDING ATTENTION */}
      <section className="bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F8E9E5] dark:bg-[#2A1612] border border-[#C96F62]/30 text-[#C96F62] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#C96F62]" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Plants Needing Attention")}
              </h3>
              <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                {tr("Plants showing visible leaf symptoms or needing care adjustments")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/analyze?mode=disease")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
          >
            <span>{tr("Check Plant Disease")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {attentionPlants.map((plant) => (
            <div
              key={plant.id}
              className="p-4 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={resolveRealisticPlantImage(
                    plant.imageUrl,
                    plant.plantName,
                    plant.scientificName,
                    plant.latestDisease
                  )}
                  alt={`${plant.plantName} (${plant.scientificName})`}
                  referrerPolicy="no-referrer"
                  onError={(e) =>
                    handlePlantImageError(e, plant.plantName, plant.scientificName)
                  }
                  className="w-14 h-14 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                      {localizePlantName(plant.plantName)}
                    </h4>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F8E9E5] text-[#C96F62]">
                      {localizeDiseaseName(plant.latestDisease || "Early Blight")}
                    </span>
                  </div>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA] italic mt-0.5">
                    {plant.scientificName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(`/analyze?mode=disease&plantId=${plant.id}`)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
                >
                  {tr("Diagnose")}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/plants/${plant.id}`)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
                >
                  {tr("View")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. MONITORED PLANTS & RECENT ANALYSES */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Monitored Plants Cards */}
        <div className="lg:col-span-7 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Monitored Plants")}
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Active specimens in your botanical collection")}
                </p>
              </div>
            </div>
            <Link
              to="/plants"
              className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
            >
              <span>{tr("All plants")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(plants.length > 0
              ? plants.slice(0, 4)
              : [
                  {
                    id: "671f9b20c4d8a912e4560104",
                    plantName: "Monstera Deliciosa",
                    scientificName: "Monstera deliciosa",
                    location: "Living Room East Window",
                    imageUrl: REAL_PLANT_IMAGES.monstera,
                    latestHealthScore: 94,
                  },
                  {
                    id: "671f9b20c4d8a912e4560102",
                    plantName: "Garden Rose",
                    scientificName: "Rosa × hybrida",
                    location: "South Courtyard",
                    imageUrl: REAL_PLANT_IMAGES.rose,
                    latestHealthScore: 96,
                  },
                  {
                    id: "671f9b20c4d8a912e4560105",
                    plantName: "Fiddle Leaf Fig",
                    scientificName: "Ficus lyrata",
                    location: "Sunroom Corner",
                    imageUrl: REAL_PLANT_IMAGES.fiddleLeafFig,
                    latestHealthScore: 93,
                  },
                  {
                    id: "671f9b20c4d8a912e4560106",
                    plantName: "Peace Lily",
                    scientificName: "Spathiphyllum wallisii",
                    location: "Study Desk North Window",
                    imageUrl: REAL_PLANT_IMAGES.peaceLily,
                    latestHealthScore: 95,
                  },
                ]
            ).map((plant) => {
              const score = plant.latestHealthScore ?? 92;
              return (
                <div
                  key={plant.id}
                  onClick={() => navigate(`/plants/${plant.id}`)}
                  className="group p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] flex items-center gap-3.5 cursor-pointer transition-all"
                >
                  <img
                    src={resolveRealisticPlantImage(
                      plant.imageUrl,
                      plant.plantName,
                      plant.scientificName
                    )}
                    alt={`${plant.plantName} (${plant.scientificName})`}
                    referrerPolicy="no-referrer"
                    onError={(e) =>
                      handlePlantImageError(e, plant.plantName, plant.scientificName)
                    }
                    className="w-14 h-14 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-xs sm:text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                        {localizePlantName(plant.plantName)}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          score >= 85
                            ? "bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B]"
                            : "bg-[#F8E9E5] text-[#C96F62]"
                        }`}
                      >
                        {score}%
                      </span>
                    </div>
                    <p className="text-[11px] italic text-[#668074] dark:text-[#B0C9BA] truncate">
                      {plant.scientificName}
                    </p>
                    <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate mt-0.5">
                      {tr(plant.location || "Home Garden")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Analyses Cards */}
        <div className="lg:col-span-5 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DCE7DF] dark:border-[#244737]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {tr("Recent Analyses")}
                  </h3>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                    {tr("Latest diagnostic scans & species checks")}
                  </p>
                </div>
              </div>
              <Link
                to="/history"
                className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
              >
                <span>{tr("History")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {analyses.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mx-auto">
                    <ScanLine className="w-4.5 h-4.5" />
                  </div>
                  <p className="font-display text-sm font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                    {tr("No analysis history yet")}
                  </p>
                  <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                    {tr("Upload a plant image to start your first analysis.")}
                  </p>
                </div>
              ) : (
                analyses.slice(0, 3).map((scan) => {
                  const isHealthyScan =
                    scan.disease_name === "Healthy" ||
                    scan.overall_status?.toLowerCase() === "healthy";
                  const scanTypeLabel = isHealthyScan
                    ? tr("Plant Identification")
                    : tr("Disease Detection");
                  const scanDate = scan.created_at
                    ? new Date(scan.created_at).toLocaleDateString(
                        language === "ta" ? "ta-IN" : "en-US",
                        { month: "short", day: "numeric" }
                      )
                    : tr("Recent scan");

                  return (
                    <div
                      key={scan.id}
                      onClick={() =>
                        navigate(`/results/${scan.id}`, {
                          state: { result: scan },
                        })
                      }
                      className="p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] hover:border-[#8EAD9B] flex items-center justify-between gap-2.5 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={resolveRealisticPlantImage(
                            scan.image_path,
                            scan.plant_name,
                            scan.scientific_name,
                            scan.disease_name
                          )}
                          alt={`${scan.plant_name} — ${scan.disease_name}`}
                          referrerPolicy="no-referrer"
                          onError={(e) =>
                            handlePlantImageError(
                              e,
                              scan.plant_name,
                              scan.scientific_name
                            )
                          }
                          className="w-12 h-12 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                            {localizePlantName(scan.plant_name)}
                          </p>
                          <p className="text-[11px] text-[#668074] dark:text-[#B0C9BA] truncate">
                            {localizeDiseaseName(scan.disease_name)} ·{" "}
                            <span
                              className={
                                isHealthyScan
                                  ? "text-[#176B4D] dark:text-[#8EAD9B] font-semibold"
                                  : "text-[#C96F62] font-semibold"
                              }
                            >
                              {scan.health_score}%
                            </span>
                          </p>
                          <p className="text-[10px] text-[#668074]/85 dark:text-[#B0C9BA]/80 truncate">
                            {scanTypeLabel} · {scanDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results/${scan.id}`, {
                              state: { result: scan },
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#176B4D] dark:text-[#8EAD9B] bg-white dark:bg-[#173126] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] transition-colors cursor-pointer"
                        >
                          {tr("View Details")}
                        </button>

                        <button
                          type="button"
                          title={tr("Delete analysis")}
                          aria-label={tr("Delete analysis")}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnalysisToDelete(scan);
                          }}
                          className="p-1.5 rounded-lg text-[#668074] dark:text-[#B0C9BA] hover:text-[#C96F62] dark:hover:text-[#E08A7E] hover:bg-[#F8E9E5]/60 dark:hover:bg-[#2A1612]/60 border border-transparent hover:border-[#C96F62]/25 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. QUICK PLANT PHOTO UPLOAD + CARE REMINDERS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7 bg-white dark:bg-[#173126] rounded-[22px] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Care Recommendations & Tasks")}
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Personalized care schedule for your plants")}
                </p>
              </div>
            </div>
            <Link
              to="/care"
              className="text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] hover:underline flex items-center gap-1"
            >
              {tr("View all care plans")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-2.5">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                onClick={() => handleToggleReminder(rem.id)}
                className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      rem.completed
                        ? "bg-[#176B4D] text-white"
                        : "border-2 border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126]"
                    }`}
                  >
                    {rem.completed && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <img
                    src={resolveRealisticPlantImage(null, rem.plantName)}
                    alt={`${rem.plantName} care reminder`}
                    referrerPolicy="no-referrer"
                    onError={(e) => handlePlantImageError(e, rem.plantName)}
                    className="w-10 h-10 rounded-xl object-cover border border-[#DCE7DF] dark:border-[#244737] shrink-0"
                  />
                  <div className="min-w-0">
                    <span
                      className={`text-xs font-bold block truncate ${
                        rem.completed
                          ? "line-through text-[#668074]"
                          : "text-[#163A2D] dark:text-[#F1F7F3]"
                      }`}
                    >
                      {localizePlantName(rem.plantName)}
                    </span>
                    <span className="text-xs text-[#668074] dark:text-[#B0C9BA] block truncate">
                      {tr(rem.task)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-[#668074] dark:text-[#B0C9BA] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] px-2.5 py-1 rounded-lg shrink-0">
                  {tr(rem.dueDate)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden lg:col-span-5 rounded-[22px] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] p-6 shadow-[0_2px_8px_rgba(22,58,45,0.03)] flex flex-col justify-between">
          {/* Decorative Forest Green Botanical Leaf Background */}
          <svg
            viewBox="0 0 360 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none select-none absolute inset-0 w-full h-full opacity-90 dark:opacity-55 z-0"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="quickLeafForestGrad1" x1="365" y1="-10" x2="255" y2="135" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#176B4D" stopOpacity="0.38" />
                <stop offset="60%" stopColor="#2D8A62" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#176B4D" stopOpacity="0.12" />
              </linearGradient>
              <linearGradient id="quickLeafForestGrad2" x1="365" y1="55" x2="295" y2="160" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#163A2D" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#176B4D" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="quickLeafForestGrad3" x1="-10" y1="325" x2="115" y2="245" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#176B4D" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2D8A62" stopOpacity="0.14" />
              </linearGradient>
            </defs>

            {/* Top-right primary forest green leaf & veins */}
            <path
              d="M365 -10 C295 8, 245 55, 265 130 C315 110, 350 55, 365 -10 Z"
              fill="url(#quickLeafForestGrad1)"
            />
            <path
              d="M355 -5 C315 35, 290 75, 265 130"
              stroke="#176B4D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeOpacity="0.55"
            />
            <path
              d="M312 42 L338 35 M294 68 L325 60 M280 94 L306 88 M312 42 L298 22 M294 68 L280 46"
              stroke="#176B4D"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeOpacity="0.45"
            />
            {/* Secondary overlapping forest green leaf */}
            <path
              d="M365 55 C320 72, 295 105, 310 155 C340 135, 356 98, 365 55 Z"
              fill="url(#quickLeafForestGrad2)"
            />
            <path
              d="M362 60 C338 92, 322 122, 310 155"
              stroke="#163A2D"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />

            {/* Bottom-left forest green leaf silhouette & stem */}
            <path
              d="M-10 325 C25 265, 80 240, 115 280 C70 308, 30 320, -10 325 Z"
              fill="url(#quickLeafForestGrad3)"
            />
            <path
              d="M-5 320 C35 295, 72 286, 115 280"
              stroke="#176B4D"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
            <path
              d="M35 301 L52 288 M62 292 L80 278 M35 301 L26 286"
              stroke="#176B4D"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
            <path
              d="M-12 275 C18 240, 58 228, 78 256 C48 272, 16 278, -12 275 Z"
              fill="#176B4D"
              fillOpacity="0.2"
            />
          </svg>

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#DCE7DF] dark:border-[#244737]">
              <div className="w-8 h-8 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center">
                <Leaf className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                  {tr("Quick Plant Analysis")}
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA]">
                  {tr("Upload a photo to identify or check health")}
                </p>
              </div>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileProcess(file);
              }}
              className={`mt-4 rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? "border-[#176B4D] bg-[#E4F0E7] dark:bg-[#1D3B2D]"
                  : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileProcess(f);
                }}
                className="hidden"
              />
              {isUploading ? (
                <div className="py-5 flex flex-col items-center gap-2 text-xs">
                  <Loader2 className="w-8 h-8 animate-spin text-[#176B4D]" />
                  <span className="font-semibold text-sm">{tr("Analyzing your plant...")}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-3">
                    {tr("Drag and drop a plant photo or browse")}
                  </p>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white bg-[#176B4D] hover:bg-[#12563D] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{tr("Upload Photo")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-[#163A2D] dark:text-[#F1F7F3] bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
                      <span>{tr("Camera")}</span>
                    </button>
                  </div>
                </div>
              )}
              {uploadError && (
                <p className="mt-3 text-xs text-[#C96F62] font-medium">{uploadError}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-[#163A2D]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#173126] rounded-[24px] max-w-lg w-full p-6 space-y-4 shadow-xl border border-[#DCE7DF] dark:border-[#244737]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE7DF] dark:border-[#244737]">
              <h3 className="font-display text-base font-bold text-[#163A2D] dark:text-[#F1F7F3]">
                {tr("Camera Capture")}
              </h3>
              <button type="button" onClick={stopCamera} className="p-1 text-[#668074]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-4/3 bg-black rounded-2xl overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#668074]"
              >
                {tr("Cancel")}
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#176B4D] cursor-pointer"
              >
                {tr("Capture & Analyze")}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteAnalysisModal
        analysis={analysisToDelete}
        isDeleting={isDeletingAnalysis}
        onCancel={() => setAnalysisToDelete(null)}
        onConfirm={handleConfirmDeleteAnalysis}
      />
    </div>
  );
};
