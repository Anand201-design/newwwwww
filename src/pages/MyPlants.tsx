import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sprout,
  Plus,
  Search,
  Droplets,
  Sun,
  Activity,
  MessageCircle,
  ExternalLink,
  Loader2,
  X,
  CheckCircle2,
  Leaf,
} from "lucide-react";
import {
  plantService,
  PlantProfileItem,
} from "../services/plantService";
import {
  resolveRealisticPlantImage,
  handlePlantImageError,
} from "../utils/plantImageResolver";
import { useLanguage } from "../context/LanguageContext";

export const MyPlants: React.FC = () => {
  const navigate = useNavigate();
  const { tr, localizePlantName } = useLanguage();

  const [plants, setPlants] = useState<PlantProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newName, setNewName] = useState("");
  const [newScientificName, setNewScientificName] = useState("");
  const [newCategory, setNewCategory] = useState("Houseplant");
  const [newLocation, setNewLocation] = useState("Indoor / Living Room");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wateringFeedback, setWateringFeedback] = useState<string | null>(null);

  useEffect(() => {
    plantService
      .getPlants()
      .then((data) => setPlants(data))
      .catch((err) => console.warn("Failed to fetch plants:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = (p.plantName || "").toLowerCase();
      const sci = (p.scientificName || "").toLowerCase();
      const loc = (p.location || "").toLowerCase();
      return name.includes(q) || sci.includes(q) || loc.includes(q);
    });
  }, [plants, searchQuery]);

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await plantService.createPlant({
        plantName: newName.trim(),
        scientificName: newScientificName.trim() || "Botanical Specimen",
        category: newCategory,
        location: newLocation,
        notes: newNotes,
        latestHealthScore: 92,
        latestStatus: "Healthy",
        latestDisease: "Healthy",
      });

      setPlants((prev) => [created, ...prev]);
      setShowAddModal(false);
      setNewName("");
      setNewScientificName("");
      setNewNotes("");
    } catch (err) {
      console.warn("Failed to create plant:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickWater = async (plant: PlantProfileItem) => {
    try {
      const updated = await plantService.updatePlant(plant.id || plant._id || "", {
        lastWateredAt: new Date().toISOString(),
        lastCareAction: "Watered",
        lastCareActionAt: new Date().toISOString(),
      });
      setPlants((prev) =>
        prev.map((p) =>
          p.id === updated.id || p._id === updated.id ? { ...p, ...updated } : p
        )
      );
      setWateringFeedback(`${plant.plantName} watered!`);
      setTimeout(() => setWateringFeedback(null), 2500);
    } catch (err) {
      console.warn("Watering check-in error:", err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold mb-2">
            <Leaf className="w-3.5 h-3.5" />
            <span>{tr("Garden & Greenhouse Collection")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3]">
            {tr("My Plants")}
          </h1>
          <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B] mt-1">
            {tr(
              "Manage individual crop varieties, track watering schedules, and monitor physiological health."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#176B4D] hover:bg-[#12563D] text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{tr("Add Plant")}</span>
        </button>
      </div>

      {wateringFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{wateringFeedback}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#668074] dark:text-[#8EAD9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Search by plant name or location...")}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
          />
        </div>

        <span className="text-xs text-[#668074] dark:text-[#8EAD9B] font-medium hidden sm:inline">
          {filteredPlants.length} {tr("plants monitored")}
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#176B4D] dark:text-[#8EAD9B] mx-auto" />
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {tr("Loading plant collection...")}
          </p>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B] mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <h3 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3]">
            {searchQuery
              ? tr("No plants match your search")
              : tr("Your plant collection is empty")}
          </h3>
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {searchQuery
              ? tr("Try searching with different terms.")
              : tr("Add your crops or houseplants to maintain watering logs and check up on them.")}
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{tr("Add Your First Plant")}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlants.map((plant) => {
            const id = plant.id || plant._id || "";
            const displayName = localizePlantName
              ? localizePlantName(plant.plantName)
              : plant.plantName;
            const healthScore = plant.latestHealthScore ?? 90;
            const isHealthy = healthScore >= 80;

            return (
              <div
                key={id}
                className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col group"
              >
                {/* Image & Health Tag */}
                <div className="relative h-48 bg-[#F6F9F5] dark:bg-[#12281E] overflow-hidden">
                  <img
                    src={resolveRealisticPlantImage(
                      plant.imageUrl,
                      plant.plantName
                    )}
                    alt={displayName}
                    onError={(e) => handlePlantImageError(e, plant.plantName)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white">
                      {plant.category || "Plant"}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 bg-white/90 dark:bg-[#173126]/90 backdrop-blur-xs text-xs font-bold px-2.5 py-1 rounded-xl shadow-xs flex items-center gap-1.5">
                    <Activity
                      className={`w-3.5 h-3.5 ${
                        isHealthy ? "text-emerald-500" : "text-amber-500"
                      }`}
                    />
                    <span>{healthScore}%</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3] truncate">
                      {displayName}
                    </h3>
                    <p className="text-xs text-[#668074] dark:text-[#8EAD9B] italic truncate">
                      {plant.scientificName}
                    </p>

                    {plant.location && (
                      <p className="text-[11px] text-[#668074] dark:text-[#8EAD9B] mt-1">
                        📍 {plant.location}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-[11px] text-[#668074] dark:text-[#8EAD9B]">
                      <span>{tr("Status")}:</span>
                      <span
                        className={`font-semibold ${
                          isHealthy
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {plant.latestStatus || (isHealthy ? "Healthy" : "Needs Care")}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#F0F6F1] dark:border-[#1D3B2D] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickWater(plant)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] hover:bg-[#E4F0E7] text-[11px] font-semibold text-[#176B4D] dark:text-[#8EAD9B] transition-colors cursor-pointer"
                      title={tr("Mark plant as watered")}
                    >
                      <Droplets className="w-3.5 h-3.5" />
                      <span>{tr("Water")}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/plant-talk?plantId=${id}`}
                        className="p-1.5 rounded-xl text-[#176B4D] dark:text-[#8EAD9B] hover:bg-[#E4F0E7] dark:hover:bg-[#1D3B2D] transition-colors"
                        title={tr("Talk with plant")}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/plants/${id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#176B4D] text-white hover:bg-[#12563D] text-[11px] font-bold transition-colors"
                      >
                        <span>{tr("Profile")}</span>
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

      {/* Add Plant Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 shadow-2xl space-y-5 text-[#163A2D] dark:text-[#F1F7F3]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#E4F0E7] dark:bg-[#1D3B2D] flex items-center justify-center text-[#176B4D] dark:text-[#8EAD9B]">
                  <Sprout className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-display font-bold text-base">
                  {tr("Add Plant to Collection")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#668074] hover:text-[#163A2D] rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlant} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  {tr("Common Name")} *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Fiddle Leaf Fig, Tomato"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {tr("Scientific / Botanical Name")}
                </label>
                <input
                  type="text"
                  value={newScientificName}
                  onChange={(e) => setNewScientificName(e.target.value)}
                  placeholder="e.g. Ficus lyrata, Solanum lycopersicum"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {tr("Category")}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                  >
                    <option value="Houseplant">Houseplant</option>
                    <option value="Vegetable Crop">Vegetable Crop</option>
                    <option value="Fruit Crop">Fruit Crop</option>
                    <option value="Herb">Herb</option>
                    <option value="Ornamental">Ornamental</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    {tr("Location")}
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Garden Bed B, Balcony"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  {tr("Notes & Soil Care")}
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Prefers moist loamy soil and bright indirect sunlight."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] text-xs font-semibold"
                >
                  {tr("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#176B4D] text-white text-xs font-bold hover:bg-[#12563D] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? tr("Saving...") : tr("Save Plant")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
