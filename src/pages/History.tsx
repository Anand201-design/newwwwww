import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Sprout,
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Loader2,
  ScanLine,
} from "lucide-react";
import {
  plantService,
  DiagnosticResult,
} from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { DeleteAnalysisModal } from "../components/DeleteAnalysisModal";
import { useLanguage } from "../context/LanguageContext";

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { tr, localizePlantName, localizeDiseaseName } = useLanguage();

  const [analyses, setAnalyses] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "healthy" | "attention">("all");

  const [analysisToDelete, setAnalysisToDelete] =
    useState<DiagnosticResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    plantService
      .getAnalysisHistory()
      .then((data) => setAnalyses(data))
      .catch((err) => console.warn("Failed to fetch history:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      const pName = (item.plant_name || "").toLowerCase();
      const dName = (item.disease_name || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesQuery = !q || pName.includes(q) || dName.includes(q);
      if (!matchesQuery) return false;

      const isHealthy =
        dName.includes("healthy") || item.health_score >= 85;

      if (filterType === "healthy") return isHealthy;
      if (filterType === "attention") return !isHealthy;
      return true;
    });
  }, [analyses, searchQuery, filterType]);

  const handleConfirmDelete = async () => {
    if (!analysisToDelete) return;
    setIsDeleting(true);
    try {
      await plantService.deleteAnalysis(analysisToDelete.id);
      setAnalyses((prev) =>
        prev.filter((item) => item.id !== analysisToDelete.id)
      );
      setAnalysisToDelete(null);
    } catch (err) {
      console.warn("Delete analysis error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold mb-2">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>{tr("Diagnostic Records")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            {tr("Analysis History")}
          </h1>
          <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B] mt-1">
            {tr(
              "Review past diagnoses, track disease progression, and reference previous treatment plans."
            )}
          </p>
        </div>

        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B4D] hover:bg-[#12563D] text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <ScanLine className="w-4 h-4" />
          <span>{tr("New Analysis")}</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#668074] dark:text-[#8EAD9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Search by plant or disease...")}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F0F6F1] dark:bg-[#152E24] border border-[#DCE7DF] dark:border-[#244737] self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === "all"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-xs"
                : "text-[#668074] dark:text-[#8EAD9B]"
            }`}
          >
            {tr("All")} ({analyses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("healthy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === "healthy"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-xs"
                : "text-[#668074] dark:text-[#8EAD9B]"
            }`}
          >
            {tr("Healthy")}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("attention")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              filterType === "attention"
                ? "bg-white dark:bg-[#173126] text-[#176B4D] dark:text-[#8EAD9B] shadow-xs"
                : "text-[#668074] dark:text-[#8EAD9B]"
            }`}
          >
            {tr("Needs Attention")}
          </button>
        </div>
      </div>

      {/* Analysis Grid or Empty State */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#176B4D] dark:text-[#8EAD9B] mx-auto" />
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {tr("Loading past diagnostics...")}
          </p>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B] mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
            {searchQuery
              ? tr("No matching analyses found")
              : tr("No diagnostic records yet")}
          </h3>
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {searchQuery
              ? tr("Try searching with another keyword or reset the filter.")
              : tr("Start by taking or uploading a photo of a plant to receive AI diagnosis.")}
          </p>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs font-bold transition-all shadow-xs"
          >
            <ScanLine className="w-4 h-4" />
            <span>{tr("Scan a Plant Now")}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnalyses.map((item) => {
            const isHealthy =
              (item.disease_name || "").toLowerCase().includes("healthy") ||
              item.health_score >= 85;
            const pName = localizePlantName
              ? localizePlantName(item.plant_name)
              : item.plant_name;
            const dName = localizeDiseaseName
              ? localizeDiseaseName(item.disease_name)
              : item.disease_name;

            return (
              <div
                key={item.id || item._id}
                className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative h-44 bg-[#F6F9F5] dark:bg-[#12281E] overflow-hidden">
                  <img
                    src={resolveRealisticPlantImage(
                      item.image_path,
                      item.plant_name
                    )}
                    alt={pName}
                    onError={(e) => handlePlantImageError(e, item.plant_name)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isHealthy
                          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                          : "bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200"
                      }`}
                    >
                      {item.severity || (isHealthy ? "Healthy" : "Attention")}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-xl">
                    {item.health_score}% {tr("Health")}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3] truncate">
                      {pName}
                    </h3>
                    <p className="text-xs text-[#668074] dark:text-[#8EAD9B] line-clamp-1 mt-0.5">
                      {item.scientific_name || "Botanical specimen"}
                    </p>

                    <div className="mt-3 p-2.5 rounded-xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-xs">
                      <span className="text-[#668074] dark:text-[#8EAD9B] text-[11px] block">
                        {tr("Diagnosis")}:
                      </span>
                      <span className="font-semibold text-[#163A2D] dark:text-[#F1F7F3] truncate block">
                        {dName}
                      </span>
                    </div>
                  </div>

                  {/* Footer date & buttons */}
                  <div className="pt-3 border-t border-[#F0F6F1] dark:border-[#1D3B2D] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#668074]/80 dark:text-[#8EAD9B]/80 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString()
                        : "Recent"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAnalysisToDelete(item)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title={tr("Delete record")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <Link
                        to={`/results/${item.id || item._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#D4E8DA] font-semibold text-xs transition-colors"
                      >
                        <span>{tr("View")}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteAnalysisModal
        analysis={analysisToDelete}
        isDeleting={isDeleting}
        onCancel={() => setAnalysisToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
