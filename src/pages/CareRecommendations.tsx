import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Droplets,
  Sun,
  ShieldCheck,
  Sprout,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Loader2,
  Search,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface RecommendationItem {
  id: string;
  plantName?: string;
  title: string;
  category: "watering" | "sunlight" | "nutrition" | "pest" | "general";
  description: string;
  urgency: "high" | "medium" | "low";
  completed?: boolean;
}

export const CareRecommendations: React.FC = () => {
  const { tr } = useLanguage();

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/recommendations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((data: RecommendationItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setRecommendations(data);
        } else {
          // Default botanical best-practice recommendations
          setRecommendations([
            {
              id: "rec-1",
              plantName: "Monstera Deliciosa",
              title: "Soil Moisture Calibration",
              category: "watering",
              description:
                "Water deeply until water drains freely, then allow top 2-3 inches of soil to dry before the next hydration.",
              urgency: "high",
              completed: false,
            },
            {
              id: "rec-2",
              plantName: "Tomato Plants",
              title: "Early Blight Bio-Fungicide Treatment",
              category: "pest",
              description:
                "Prune lower infected foliage touching the mulch and apply cold-pressed neem oil or copper soap bio-fungicide in early morning.",
              urgency: "high",
              completed: false,
            },
            {
              id: "rec-3",
              plantName: "Chilli Pepper",
              title: "Nitrogen & Micronutrient Foliar Spray",
              category: "nutrition",
              description:
                "Apply diluted organic seaweed extract and chelated magnesium to reverse interveinal chlorosis.",
              urgency: "medium",
              completed: false,
            },
            {
              id: "rec-4",
              plantName: "Rose Bush",
              title: "Morning Sun & Air Circulation",
              category: "sunlight",
              description:
                "Ensure at least 6 hours of direct sun and thin central canes to minimize powdery mildew risk.",
              urgency: "low",
              completed: false,
            },
            {
              id: "rec-5",
              plantName: "General Garden",
              title: "Organic Mulching Barrier",
              category: "general",
              description:
                "Spread a 2-inch layer of organic compost mulch around crop root zones to maintain soil moisture and cool root temps.",
              urgency: "medium",
              completed: false,
            },
          ]);
        }
      })
      .catch(() => {
        setRecommendations([
          {
            id: "rec-1",
            plantName: "Monstera Deliciosa",
            title: "Soil Moisture Calibration",
            category: "watering",
            description:
              "Water deeply until water drains freely, then allow top 2-3 inches of soil to dry before next hydration.",
            urgency: "high",
            completed: false,
          },
          {
            id: "rec-2",
            plantName: "Tomato Plants",
            title: "Early Blight Bio-Fungicide Treatment",
            category: "pest",
            description:
              "Prune lower infected foliage touching mulch and apply organic bio-fungicide spray.",
            urgency: "high",
            completed: false,
          },
          {
            id: "rec-3",
            plantName: "Chilli Pepper",
            title: "Nutrient Foliar Spray",
            category: "nutrition",
            description:
              "Apply balanced micronutrient liquid feed to reverse interveinal yellowing.",
            urgency: "medium",
            completed: false,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleComplete = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, completed: !rec.completed } : rec
      )
    );
  };

  const filtered = recommendations.filter((r) => {
    const matchesCat =
      activeCategory === "all" || r.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.plantName &&
        r.plantName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{tr("Personalized Agronomic Guidance")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#163A2D] dark:text-[#F1F7F3]">
          {tr("Care & Treatment Recommendations")}
        </h1>
        <p className="text-xs sm:text-sm text-[#668074] dark:text-[#8EAD9B] mt-1">
          {tr(
            "Actionable crop nutrition, biological pest prevention, and seasonal watering protocols generated for your garden."
          )}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Guidance" },
            { id: "watering", label: "Watering" },
            { id: "pest", label: "Pest & Disease" },
            { id: "nutrition", label: "Nutrition & Fertilizer" },
            { id: "sunlight", label: "Sunlight & Pruning" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#176B4D] text-white shadow-xs"
                  : "bg-[#F6F9F5] dark:bg-[#12281E] border border-[#DCE7DF] dark:border-[#244737] text-[#668074] dark:text-[#8EAD9B] hover:text-[#163A2D]"
              }`}
            >
              {tr(cat.label)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#668074] dark:text-[#8EAD9B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr("Filter recommendations...")}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#DCE7DF] dark:border-[#244737] bg-[#F6F9F5] dark:bg-[#12281E] text-xs text-[#163A2D] dark:text-[#F1F7F3] focus:outline-hidden focus:border-[#176B4D]"
          />
        </div>
      </div>

      {/* Recommendations List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#176B4D] dark:text-[#8EAD9B] mx-auto" />
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {tr("Loading recommendations...")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-10 text-center space-y-3 max-w-md mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="font-display font-bold text-base">
            {tr("All Caught Up!")}
          </h3>
          <p className="text-xs text-[#668074] dark:text-[#8EAD9B]">
            {tr("No pending recommendations matching your filter.")}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white dark:bg-[#173126] border rounded-3xl p-5 sm:p-6 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                item.completed
                  ? "opacity-60 border-[#DCE7DF] dark:border-[#244737] bg-gray-50/50"
                  : "border-[#DCE7DF] dark:border-[#244737] hover:border-[#176B4D]/40"
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {item.plantName && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E4F0E7] dark:bg-[#1D3B2D] text-[#176B4D] dark:text-[#8EAD9B]">
                      {item.plantName}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.urgency === "high"
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300"
                        : item.urgency === "medium"
                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                    }`}
                  >
                    {item.urgency.toUpperCase()}
                  </span>
                </div>

                <h3
                  className={`font-display font-bold text-base text-[#163A2D] dark:text-[#F1F7F3] ${
                    item.completed ? "line-through" : ""
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-xs text-[#668074] dark:text-[#B0C9BA] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => toggleComplete(item.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    item.completed
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-[#176B4D] text-white hover:bg-[#12563D] shadow-xs"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{item.completed ? tr("Completed") : tr("Mark Done")}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
