import type React from "react";

export const REAL_PLANT_IMAGES = {
  monstera: "/src/assets/images/hero_monstera_plant_1791123269478.jpg",
  monsteraSpot: "/src/assets/images/specimen_monstera_spot_1791123333163.jpg",
  rose: "/src/assets/images/specimen_rose_healthy_1791123284883.jpg",
  tomato: "/src/assets/images/specimen_tomato_blight_1791123302093.jpg",
  chilli: "/src/assets/images/specimen_chilli_chlorosis_1791123315102.jpg",
  fiddleLeafFig: "/src/assets/images/plant_fiddle_leaf_fig_1791124639713.jpg",
  peaceLily: "/src/assets/images/plant_peace_lily_1791124652513.jpg",
} as const;

/**
 * Resolves the best realistic plant image URL for a given plant or analysis record.
 * Preserves user-uploaded images (/uploads/*, blob:*, data:*) while mapping sample
 * or missing URLs to high-resolution realistic botanical photographs.
 */
export function resolveRealisticPlantImage(
  imageUrl?: string | null,
  plantName?: string | null,
  scientificName?: string | null,
  diseaseName?: string | null
): string {
  const trimmedUrl = (imageUrl || "").trim();

  // Always preserve user-uploaded images (blob URLs, data URLs, or server /uploads/ files)
  if (
    trimmedUrl.startsWith("blob:") ||
    trimmedUrl.startsWith("data:image/") ||
    trimmedUrl.startsWith("/uploads/")
  ) {
    return trimmedUrl;
  }
  if (
    trimmedUrl.startsWith("/__/upload/") ||
    trimmedUrl.startsWith("/_/upload/") ||
    trimmedUrl.startsWith("/upload/") ||
    trimmedUrl.includes("/_/upload/")
  ) {
    const filename = trimmedUrl.split("/").pop();
    if (filename) return `/uploads/${filename}`;
    return trimmedUrl;
  }

  // Map legacy or current asset filenames to the latest verified realistic photos
  const lowerUrl = trimmedUrl.toLowerCase();
  if (lowerUrl.includes("specimen_tomato_blight")) {
    return REAL_PLANT_IMAGES.tomato;
  }
  if (lowerUrl.includes("specimen_rose_healthy")) {
    return REAL_PLANT_IMAGES.rose;
  }
  if (lowerUrl.includes("specimen_chilli_chlorosis")) {
    return REAL_PLANT_IMAGES.chilli;
  }
  if (lowerUrl.includes("specimen_monstera_spot")) {
    return REAL_PLANT_IMAGES.monsteraSpot;
  }
  if (lowerUrl.includes("hero_monstera_plant")) {
    return REAL_PLANT_IMAGES.monstera;
  }
  if (lowerUrl.includes("plant_fiddle_leaf_fig")) {
    return REAL_PLANT_IMAGES.fiddleLeafFig;
  }
  if (lowerUrl.includes("plant_peace_lily")) {
    return REAL_PLANT_IMAGES.peaceLily;
  }

  // Match by plant name, scientific name, or condition (including Tamil common names)
  const searchKey = `${plantName || ""} ${scientificName || ""} ${diseaseName || ""}`.toLowerCase();

  if (
    searchKey.includes("tomato") ||
    searchKey.includes("தக்காளி") ||
    searchKey.includes("solanum") ||
    searchKey.includes("blight")
  ) {
    return REAL_PLANT_IMAGES.tomato;
  }
  if (searchKey.includes("rose") || searchKey.includes("ரோஜா") || searchKey.includes("rosa")) {
    return REAL_PLANT_IMAGES.rose;
  }
  if (
    searchKey.includes("chilli") ||
    searchKey.includes("chili") ||
    searchKey.includes("pepper") ||
    searchKey.includes("மிளகாய்") ||
    searchKey.includes("capsicum") ||
    searchKey.includes("chlorosis")
  ) {
    return REAL_PLANT_IMAGES.chilli;
  }
  if (
    searchKey.includes("fiddle") ||
    searchKey.includes("ficus") ||
    searchKey.includes("fig") ||
    searchKey.includes("அத்தி")
  ) {
    return REAL_PLANT_IMAGES.fiddleLeafFig;
  }
  if (
    searchKey.includes("lily") ||
    searchKey.includes("லில்லி") ||
    searchKey.includes("spathiphyllum") ||
    searchKey.includes("orchid") ||
    searchKey.includes("jasmine")
  ) {
    return REAL_PLANT_IMAGES.peaceLily;
  }
  if (
    (searchKey.includes("monstera") || searchKey.includes("மான்ஸ்டெரா")) &&
    (searchKey.includes("spot") || searchKey.includes("stress") || searchKey.includes("புள்ளி"))
  ) {
    return REAL_PLANT_IMAGES.monsteraSpot;
  }
  if (
    searchKey.includes("monstera") ||
    searchKey.includes("மான்ஸ்டெரா") ||
    searchKey.includes("deliciosa")
  ) {
    return REAL_PLANT_IMAGES.monstera;
  }

  // If a valid local asset URL was provided, use it; otherwise fallback to realistic Monstera photo
  if (trimmedUrl.startsWith("/src/assets/images/")) {
    return trimmedUrl;
  }

  return REAL_PLANT_IMAGES.monstera;
}

/**
 * Fallback handler for <img> onError events so no broken image icon ever renders.
 */
export function handlePlantImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  plantName?: string | null,
  scientificName?: string | null
) {
  const target = e.currentTarget;
  const fallback = resolveRealisticPlantImage(null, plantName, scientificName);
  if (target.src && !target.src.endsWith(fallback)) {
    target.src = fallback;
  } else if (!target.src.endsWith(REAL_PLANT_IMAGES.monstera)) {
    target.src = REAL_PLANT_IMAGES.monstera;
  }
}
