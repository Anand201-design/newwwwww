import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Sprout,
  Droplets,
  Sun,
  Activity,
  MessageCircle,
  Stethoscope,
  ScanLine,
  Calendar,
  CheckCircle2,
  Scissors,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import {
  plantService,
  PlantProfileItem,
  CareCheckInRecord,
  DiagnosticResult,
} from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";

export const PlantProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tr, localizePlantName } = useLanguage();

  const [plant, setPlant] = useState<PlantProfileItem | null>(null);
  const [careEvents, setCareEvents] = useState<CareCheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [careSuccess, setCareSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      plantService.getPlantById(id),
      plantService.getCareEvents(id),
    ])
      .then(([plantData, eventsData]) => {
        setPlant(plantData);
        setCareEvents(eventsData);
      })
      .catch((err) => {
        console.warn("Failed to load plant details:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLogCare = async (
    actionType: "watered" | "moved_light" | "fertilized" | "trimmed"
  ) => {
    if (!id) return;
    try {
      const res = await plantService.logCareCheckIn({
        plantId: id,
        actionType,
      });

      setCareEvents((prev) => [res.event, ...prev]);
      if (res.plant) {
        setPlant(res.plant);
      }
      setCareSuccess(
        `${tr("Logged")} ${actionType.replace("_", " ")}! ${res.plantReply || ""}`
      );
      setTimeout(() => setCareSuccess(null), 3500);
    } catch (err) {
      console.warn("Failed to log care event:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#176B4D] dark:text-[#8EAD9B] mx-auto" />
        <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
          {tr("Loading plant profile...")}
        </p>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="font-display font-bold text-lg text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("Plant Not Found")}
        </h2>
        <button
          type="button"
          onClick={() => navigate("/plants")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tr("Return to My Plants")}</span>
        </button>
      </div>
    );
  }

  const displayName = localizePlantName
    ? localizePlantName(plant.plantName)
    : plant.plantName;
  const healthScore = plant.latestHealthScore ?? 90;
  const isHealthy = healthScore >= 80;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/plants")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126] text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] hover:bg-[#F0F6F1] cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{tr("All Plants")}</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/plant-talk?plantId=${plant.id || plant._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176B4D] text-white hover:bg-[#12563D] text-xs font-bold transition-all shadow-xs"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{tr("Chat with Plant")}</span>
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-white dark:bg-[#173126] text-xs font-semibold hover:bg-[#F0F6F1]"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>{tr("Diagnose")}</span>
          </Link>
        </div>
      </div>

      {careSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{careSuccess}</span>
        </div>
      )}

      {/* Main Profile Header */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-8 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-4 flex justify-center">
          <div className="w-full max-w-[260px] aspect-square rounded-2xl overflow-hidden border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E]">
            <img
              src={resolveRealisticPlantImage(
                plant.imageUrl,
                plant.plantName
              )}
              alt={displayName}
              onError={(e) => handlePlantImageError(e, plant.plantName)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-8 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#668074] dark:text-[#8EAD9B] font-mono">
              <Sprout className="w-3.5 h-3.5 text-[#176B4D]" />
              <span>{plant.category || "Houseplant"}</span>
              {plant.location && <span>• 📍 {plant.location}</span>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3] mt-1">
              {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B] italic mt-0.5">
              {plant.scientificName}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center">
              <span className="block text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {tr("Health Score")}
              </span>
              <span className="font-display font-bold text-xl text-[#163A2D] dark:text-[#F1F7F3]">
                {healthScore}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center">
              <span className="block text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {tr("Condition")}
              </span>
              <span className="font-display font-bold text-xs sm:text-sm text-[#163A2D] dark:text-[#F1F7F3] truncate mt-1 block">
                {plant.latestStatus || (isHealthy ? "Optimal" : "Checkup")}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-center">
              <span className="block text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                {tr("Last Watered")}
              </span>
              <span className="font-display font-bold text-xs text-[#163A2D] dark:text-[#F1F7F3] mt-1 block">
                {plant.lastWateredAt
                  ? new Date(plant.lastWateredAt).toLocaleDateString()
                  : "Recently"}
              </span>
            </div>
          </div>

          {/* Quick Care Log Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#163A2D] dark:text-[#F1F7F3] mr-1">
              {tr("Log Care:")}
            </span>
            <button
              type="button"
              onClick={() => handleLogCare("watered")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] cursor-pointer"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{tr("Watered")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleLogCare("fertilized")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] cursor-pointer"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{tr("Fertilized")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleLogCare("trimmed")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] text-xs font-semibold text-[#176B4D] dark:text-[#8EAD9B] cursor-pointer"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>{tr("Trimmed")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Care History Log */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("Care History & Logged Events")}
        </h2>

        {careEvents.length === 0 ? (
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {tr("No care events recorded yet. Log watering or trimming above to track progress.")}
          </p>
        ) : (
          <div className="space-y-2">
            {careEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-2xl bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <div>
                    <span className="font-semibold block capitalize">
                      {evt.actionType.replace("_", " ")}
                    </span>
                    {evt.note && (
                      <span className="text-[#668074] dark:text-[#8EAD9B] text-[11px]">
                        {evt.note}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                  {new Date(evt.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
