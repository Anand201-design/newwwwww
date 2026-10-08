import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Upload,
  Camera,
  Sprout,
  Stethoscope,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
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
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";

export const AnalyzePlant: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "identify" ? "identify" : "disease";

  const { language, tr } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"disease" | "identify">(initialMode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [plantHint, setPlantHint] = useState("");
  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>("");

  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    plantService
      .getPlants()
      .then((data) => setPlants(data))
      .catch(() => {});
  }, []);

  const samplePresets = [
    {
      id: "tomato",
      label: "Tomato (Early Blight)",
      crop: "Tomato",
      image: REAL_PLANT_IMAGES.tomato,
      badge: "Disease Specimen",
    },
    {
      id: "monsteraSpot",
      label: "Monstera (Leaf Spot)",
      crop: "Monstera",
      image: REAL_PLANT_IMAGES.monsteraSpot,
      badge: "Houseplant Specimen",
    },
    {
      id: "chilli",
      label: "Chilli (Chlorosis/Deficiency)",
      crop: "Chilli Pepper",
      image: REAL_PLANT_IMAGES.chilli,
      badge: "Nutrient Specimen",
    },
    {
      id: "rose",
      label: "Rose (Healthy Specimen)",
      crop: "Rose",
      image: REAL_PLANT_IMAGES.rose,
      badge: "Healthy Check",
    },
  ];

  const handleFileChange = (file: File) => {
    setError(null);
    setSelectedPreset(null);
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || tr("Invalid image format."));
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSelectPreset = (preset: (typeof samplePresets)[0]) => {
    setError(null);
    setSelectedFile(null);
    setSelectedPreset(preset.id);
    setPreviewUrl(preset.image);
    setPlantHint(preset.crop);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setSelectedPreset(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleRunAnalysis = async () => {
    if (!selectedFile && !selectedPreset) {
      setError(tr("Please upload a photo or select a sample specimen."));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep(tr("Preparing specimen image..."));

    try {
      const formData = new FormData();
      formData.append("language", language);
      if (plantHint.trim()) {
        formData.append("plant_hint", plantHint.trim());
      }
      if (selectedPlantId) {
        formData.append("plant_id", selectedPlantId);
      }

      if (selectedFile) {
        setAnalysisStep(tr("Optimizing photo resolution..."));
        const optimized = await optimizeImageForAnalysis(selectedFile);
        formData.append("image", optimized);
        formData.append("mime_type", optimized.type || "image/jpeg");
      } else if (selectedPreset) {
        formData.append("specimenPreset", selectedPreset);
      }

      setAnalysisStep(tr("Examining leaf lesions, pests & coloration..."));

      const result = await plantService.analyzePlantImage(formData);

      setAnalysisStep(tr("Analysis complete!"));
      navigate(`/results/${result.id || result._id}`);
    } catch (err: any) {
      console.error("Diagnosis error:", err);
      setError(
        err.message || tr("Failed to analyze the image. Please try again.")
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{tr("AI Diagnostic Engine")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            {mode === "disease"
              ? tr("Plant Disease & Pest Detection")
              : tr("Plant Identification & Health Scan")}
          </h1>
          <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B] mt-1">
            {tr(
              "Upload a clear photo of the leaves, stem, or whole plant for instant disease diagnosis and actionable organic treatments."
            )}
          </p>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-[#F0F6F1] dark:bg-[#152E24] border border-[#DCE7DF] dark:border-[#244737] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode("disease")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === "disease"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-xs"
                : "text-[#668074] dark:text-[#8EAD9B] hover:text-[#163A2D]"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>{tr("Disease Diagnosis")}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("identify")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              mode === "identify"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-xs"
                : "text-[#668074] dark:text-[#8EAD9B] hover:text-[#163A2D]"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>{tr("Identify Species")}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">{tr("Analysis Error")}</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Upload Area & Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Dropzone / Preview */}
        <div className="lg:col-span-7 space-y-4">
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
              if (file) handleFileChange(file);
            }}
            className={`relative border-2 border-dashed rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all min-h-[340px] sm:min-h-[400px] ${
              previewUrl
                ? "border-[#176B4D] dark:border-[#8EAD9B] bg-[#F6F9F5] dark:bg-[#12281E]"
                : isDragging
                ? "border-[#176B4D] bg-[#E4F0E7]/40 dark:bg-[#1D3B2D]/40"
                : "border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126] hover:border-[#176B4D]/50"
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Specimen preview"
                  className="max-h-[300px] sm:max-h-[340px] w-auto object-contain rounded-2xl shadow-md border border-[#DCE7DF] dark:border-[#244737]"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  disabled={isAnalyzing}
                  className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer shadow-md"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-3 flex items-center gap-2 text-xs text-[#176B4D] dark:text-[#8EAD9B] font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedFile
                      ? selectedFile.name
                      : tr("Sample specimen selected")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-sm">
                <div className="w-16 h-16 rounded-3xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B] mx-auto">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
                    {tr("Drop your plant photo here")}
                  </h3>
                  <p className="text-xs text-[#668074] dark:text-[#8EAD9B] mt-1">
                    {tr(
                      "Take a photo of diseased leaves, discolored stems, or unknown seedlings"
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B4D] text-white hover:bg-[#12563D] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{tr("Browse Files")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#D4E8DA] text-xs font-semibold border border-[#DCE7DF] dark:border-[#244737] transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{tr("Take Photo")}</span>
                  </button>
                </div>

                <p className="text-[11px] text-[#668074]/80 dark:text-[#8EAD9B]/80 pt-1">
                  {tr("Supports JPG, PNG, WebP & HEIC up to 15 MB")}
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileChange(f);
              }}
            />
          </div>

          {/* Preset Specimens */}
          <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#176B4D] dark:text-[#8EAD9B]" />
                {tr("Or try with a pre-loaded botanical specimen:")}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {samplePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedPreset === preset.id
                      ? "border-[#176B4D] dark:border-[#8EAD9B] bg-[#E4F0E7]/60 dark:bg-[#1D3B2D]/60 ring-2 ring-[#176B4D]/30"
                      : "border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] hover:border-[#176B4D]/50"
                  }`}
                >
                  <img
                    src={preset.image}
                    alt={preset.label}
                    className="w-full h-16 object-cover rounded-xl border border-[#DCE7DF]/60"
                  />
                  <div>
                    <span className="block text-[11px] font-bold text-[#163A2D] dark:text-[#F1F7F3] truncate">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-[#668074] dark:text-[#8EAD9B]">
                      {preset.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 space-y-5 shadow-xs">
            <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Analysis Context (Optional)")}
            </h2>

            {/* Link to existing saved plant */}
            {plants.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                  {tr("Associate with a plant in your garden:")}
                </label>
                <select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                >
                  <option value="">{tr("-- None (Analyze as standalone) --")}</option>
                  {plants.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.plantName} ({p.scientificName || "Specimen"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Plant Hint or Question */}
            <div>
              <label className="block text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mb-1.5">
                {tr("Crop or Plant Hint (Optional):")}
              </label>
              <input
                type="text"
                value={plantHint}
                onChange={(e) => setPlantHint(e.target.value)}
                placeholder="e.g. Tomato, Chilli, Monstera, Paddy, Cotton"
                className="w-full px-3 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] placeholder:text-[#668074]/60 focus:outline-hidden focus:border-[#176B4D]"
              />
            </div>

            {/* Botanical Tips */}
            <div className="p-4 rounded-2xl bg-[#F0F6F1] dark:bg-[#152E24] border border-[#DCE7DF] dark:border-[#244737] space-y-2 text-xs">
              <span className="font-bold text-[#176B4D] dark:text-[#8EAD9B] block">
                🌿 {tr("For Most Accurate Diagnosis:")}
              </span>
              <ul className="space-y-1.5 text-[#668074] dark:text-[#B0C9BA] text-[11px] list-disc list-inside">
                <li>{tr("Capture affected leaves with visible lesions or discoloration")}</li>
                <li>{tr("Ensure good natural lighting without extreme glare or shadows")}</li>
                <li>{tr("Include both upper and underside of the leaf if possible")}</li>
              </ul>
            </div>

            {/* Execute Button */}
            <button
              type="button"
              disabled={isAnalyzing || (!selectedFile && !selectedPreset)}
              onClick={handleRunAnalysis}
              className="w-full py-3 px-5 rounded-2xl bg-[#176B4D] hover:bg-[#12563D] text-white font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{analysisStep || tr("Analyzing with Botanical AI...")}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === "disease"
                      ? tr("Diagnose Plant Disease")
                      : tr("Identify & Health Scan")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
