import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Bookmark,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
  Sprout,
  ShieldAlert,
  ShieldCheck,
  Droplets,
  MessageCircle,
  Volume2,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  plantService,
  DiagnosticResult,
  PlantProfileItem,
} from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { AudioSpeechButton } from "../components/AudioSpeechButton";
import { useLanguage } from "../context/LanguageContext";

export const PlantResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language, tr, localizePlantName, localizeDiseaseName } = useLanguage();

  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    plantService
      .getAnalysisById(id)
      .then((data) => {
        setResult(data);
      })
      .catch((err) => {
        console.error("Failed to load result:", err);
        setError(
          err.message || tr("Unable to locate this diagnostic report.")
        );
      })
      .finally(() => setLoading(false));
  }, [id, tr]);

  const handleSaveToGarden = async () => {
    if (!result) return;
    try {
      await plantService.createPlant({
        plantName: result.plant_name,
        scientificName: result.scientific_name || "Specimen",
        imageUrl: result.image_path,
        latestHealthScore: result.health_score,
        latestStatus: result.overall_status,
        latestDisease: result.disease_name,
        notes: `Diagnosed on ${new Date().toLocaleDateString()}. Condition: ${
          result.disease_name
        }`,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.warn("Failed to save plant to garden:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#176B4D] dark:text-[#8EAD9B]" />
        <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B]">
          {tr("Loading botanical analysis report...")}
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("Diagnostic Report Not Found")}
        </h2>
        <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
          {error || tr("The requested analysis could not be retrieved.")}
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tr("Return to Dashboard")}</span>
        </button>
      </div>
    );
  }

  const plantTitle = localizePlantName
    ? localizePlantName(result.plant_name)
    : result.plant_name;
  const diseaseTitle = localizeDiseaseName
    ? localizeDiseaseName(result.disease_name)
    : result.disease_name;

  const isHealthy =
    result.disease_name.toLowerCase().includes("healthy") ||
    result.health_score >= 85;

  const severityColor = {
    none: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    mild: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    moderate:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    severe:
      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  }[result.severity.toLowerCase()] ||
    "bg-emerald-50 text-emerald-700 border-emerald-200";

  const spokenSummary = `${plantTitle}. Diagnosis: ${diseaseTitle}. Health score: ${
    result.health_score
  }%. Severity: ${result.severity}. ${
    result.treatment_recommendations?.[0]
      ? `Primary treatment: ${result.treatment_recommendations[0]}`
      : ""
  }`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top action bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126] text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] hover:bg-[#F0F6F1] dark:hover:bg-[#1D3B2D] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{tr("Back")}</span>
        </button>

        <div className="flex items-center gap-2">
          <AudioSpeechButton text={spokenSummary} label={tr("Listen Report")} />

          <button
            type="button"
            onClick={handleSaveToGarden}
            disabled={savedSuccess}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              savedSuccess
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-white dark:bg-[#173126] border-[#DCE7DF] dark:border-[#244737] text-[#163A2D] dark:text-[#F1F7F3] hover:bg-[#F0F6F1]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{savedSuccess ? tr("Added to Garden!") : tr("Save to My Plants")}</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Specimen Visual */}
        <div className="md:col-span-4 flex justify-center">
          <div className="relative w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]">
            <img
              src={resolveRealisticPlantImage(
                result.image_path,
                result.plant_name
              )}
              alt={plantTitle}
              onError={(e) => handlePlantImageError(e, result.plant_name)}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5">
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${severityColor}`}
              >
                {result.severity}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata & Scores */}
        <div className="md:col-span-8 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#668074] dark:text-[#8EAD9B] font-mono">
              <Sprout className="w-3.5 h-3.5 text-[#176B4D] dark:text-[#8EAD9B]" />
              <span>{result.scientific_name || "Botanical Specimen"}</span>
              {result.family && <span>• {result.family}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
              {plantTitle}
            </h1>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("Primary Diagnosis")}:
              </span>
              <span
                className={`text-sm font-bold ${
                  isHealthy
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {diseaseTitle}
              </span>
            </div>
          </div>

          {/* Quick Stats Metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center">
              <span className="block text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {tr("Health Score")}
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-[#163A2D] dark:text-[#F1F7F3]">
                {result.health_score}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center">
              <span className="block text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {tr("AI Confidence")}
              </span>
              <span className="font-display font-bold text-xl sm:text-2xl text-[#163A2D] dark:text-[#F1F7F3]">
                {Math.round(result.confidence_score * 100)}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center">
              <span className="block text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {tr("Status")}
              </span>
              <span className="font-display font-bold text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] line-clamp-1 mt-1">
                {result.overall_status || (isHealthy ? "Optimal" : "Attention")}
              </span>
            </div>
          </div>

          {/* Quick Connect Actions */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <Link
              to={`/plant-talk`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#176B4D] text-white hover:bg-[#12563D] text-xs font-bold transition-all shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{tr("Talk with this Plant")}</span>
            </Link>

            <Link
              to={`/assistant`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#D4E8DA] text-xs font-bold border border-[#DCE7DF] dark:border-[#244737] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tr("Ask AI Assistant")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Symptoms & Nutrition Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Observed Symptoms */}
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Observed Symptoms & Pathology")}
            </h2>
          </div>

          {result.symptoms && result.symptoms.length > 0 ? (
            <ul className="space-y-2.5 text-xs text-[#163A2D] dark:text-[#F1F7F3]">
              {result.symptoms.map((symptom, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737]"
                >
                  <span className="w-5 h-5 rounded-lg bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[10px] font-bold text-[#668074] shrink-0">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{symptom}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
              {tr("No pathological lesions or physical deformities detected on this leaf.")}
            </p>
          )}
        </div>

        {/* Nutritional & Soil Status */}
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Nutritional & Mineral Assessment")}
            </h2>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] space-y-2 text-xs">
            <span className="font-bold text-[#163A2D] dark:text-[#F1F7F3] block">
              {result.possible_nutrient_deficiency
                ? `${tr("Possible Deficiency")}: ${result.possible_nutrient_deficiency}`
                : tr("Nutrient Balance: Normal")}
            </span>
            <p className="text-[#668074] dark:text-[#B0C9BA] leading-relaxed">
              {result.nutrient_deficiency_details ||
                tr(
                  "Chlorophyll distribution and leaf vein coloration indicate adequate nitrogen, phosphorus, and potassium availability."
                )}
            </p>
          </div>
        </div>
      </div>

      {/* Treatment & Prevention Action Plan */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B]">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]">
              {tr("Recommended Treatment & Care Action Plan")}
            </h2>
            <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
              {tr("Immediate organic actions and long-term garden prevention")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Treatment Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#176B4D] dark:text-[#8EAD9B] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{tr("Immediate Action (Next 24-48 Hours)")}</span>
            </h3>

            {result.treatment_recommendations &&
            result.treatment_recommendations.length > 0 ? (
              <ul className="space-y-2 text-xs text-[#163A2D] dark:text-[#F1F7F3]">
                {result.treatment_recommendations.map((step, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] leading-relaxed"
                  >
                    • {step}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("Maintain current watering and lighting schedule.")}
              </p>
            )}
          </div>

          {/* Long Term Prevention */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{tr("Long-Term Crop Health & Prevention")}</span>
            </h3>

            {result.prevention_recommendations &&
            result.prevention_recommendations.length > 0 ? (
              <ul className="space-y-2 text-xs text-[#163A2D] dark:text-[#F1F7F3]">
                {result.prevention_recommendations.map((step, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] leading-relaxed"
                  >
                    • {step}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
                {tr("Ensure proper air circulation and clean gardening shears between cuts.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
