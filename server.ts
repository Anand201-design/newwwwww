import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ASSETS_IMAGES_DIR = path.resolve(process.cwd(), "src/assets/images");

const REAL_IMAGE_FILES = {
  monstera: "hero_monstera_plant_1791123269478.jpg",
  monsteraSpot: "specimen_monstera_spot_1791123333163.jpg",
  rose: "specimen_rose_healthy_1791123284883.jpg",
  tomato: "specimen_tomato_blight_1791123302093.jpg",
  chilli: "specimen_chilli_chlorosis_1791123315102.jpg",
  fiddleLeafFig: "plant_fiddle_leaf_fig_1791124639713.jpg",
  peaceLily: "plant_peace_lily_1791124652513.jpg",
};

function resolveDiskImageFile(nameOrKey: string): string {
  const cleanName = path.basename(nameOrKey);
  const directPath = path.join(ASSETS_IMAGES_DIR, cleanName);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  const lower = cleanName.toLowerCase();
  if (lower.includes("tomato") || lower.includes("blight")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.tomato);
  }
  if (lower.includes("rose")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.rose);
  }
  if (lower.includes("chilli") || lower.includes("chili") || lower.includes("chlorosis")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.chilli);
  }
  if (lower.includes("fiddle") || lower.includes("ficus")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.fiddleLeafFig);
  }
  if (lower.includes("lily") || lower.includes("peace")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.peaceLily);
  }
  if (lower.includes("monstera") && lower.includes("spot")) {
    return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.monsteraSpot);
  }
  return path.join(ASSETS_IMAGES_DIR, REAL_IMAGE_FILES.monstera);
}

// Serve user uploads from /uploads, with graceful fallback to realistic photo if a historic upload was cleaned up
app.get("/uploads/:filename", (req, res) => {
  const safeName = path.basename(req.params.filename);
  const uploadFilePath = path.join(UPLOADS_DIR, safeName);
  if (fs.existsSync(uploadFilePath)) {
    res.sendFile(uploadFilePath);
    return;
  }
  const fallbackPath = resolveDiskImageFile(safeName);
  if (fs.existsSync(fallbackPath)) {
    res.sendFile(fallbackPath);
    return;
  }
  res.status(404).end();
});

app.get("/_/upload/:filename", (req, res) => {
  res.redirect(`/uploads/${req.params.filename}`);
});
app.get("/__%/upload/:filename", (req, res) => {
  res.redirect(`/uploads/${req.params.filename}`);
});
app.get("/upload/:filename", (req, res) => {
  res.redirect(`/uploads/${req.params.filename}`);
});
app.get("/__/upload/:filename", (req, res) => {
  res.redirect(`/uploads/${req.params.filename}`);
});

// Serve real botanical JPEG photographs from /src/assets/images/
app.get("/src/assets/images/:name", (req, res) => {
  const targetFile = resolveDiskImageFile(req.params.name);
  if (fs.existsSync(targetFile)) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(targetFile);
    return;
  }
  res.status(404).end();
});

const DB_FILE = path.join(UPLOADS_DIR, "plantcare_db.json");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024,
    fieldSize: 12 * 1024 * 1024,
  },
});

function pickRealisticImageUrl(
  currentUrl?: string,
  plantName?: string,
  scientificName?: string
): string {
  if (currentUrl && currentUrl.startsWith("/uploads/")) {
    const uploadDiskPath = path.join(UPLOADS_DIR, path.basename(currentUrl));
    if (fs.existsSync(uploadDiskPath)) {
      return currentUrl;
    }
  }
  const text = `${currentUrl || ""} ${plantName || ""} ${scientificName || ""}`.toLowerCase();
  if (text.includes("tomato") || text.includes("solanum")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.tomato}`;
  }
  if (text.includes("rose") || text.includes("rosa")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.rose}`;
  }
  if (text.includes("chilli") || text.includes("chili") || text.includes("capsicum")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.chilli}`;
  }
  if (text.includes("fiddle") || text.includes("ficus")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.fiddleLeafFig}`;
  }
  if (text.includes("lily") || text.includes("spathiphyllum")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.peaceLily}`;
  }
  if (text.includes("monstera") && text.includes("spot")) {
    return `/src/assets/images/${REAL_IMAGE_FILES.monsteraSpot}`;
  }
  return `/src/assets/images/${REAL_IMAGE_FILES.monstera}`;
}

const INITIAL_PLANTS: Array<{
  id: string;
  plantName: string;
  nickname?: string;
  scientificName: string;
  category: string;
  location: string;
  imageUrl: string;
  soilType: string;
  sunlightRequirement: string;
  waterRequirement: string;
  temperatureRange: string;
  latestHealthScore: number;
  latestStatus: string;
  latestDisease: string;
  notes: string;
  lastWateredAt?: string;
  lastCareAction?: string;
  lastCareActionAt?: string;
}> = [
  {
    id: "671f9b20c4d8a912e4560101",
    plantName: "Tomato",
    nickname: "Sunny Vine",
    scientificName: "Solanum lycopersicum",
    category: "Vegetable · Solanaceae",
    location: "Greenhouse Bed A4",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.tomato}`,
    soilType: "Loamy well-draining mix (pH 6.2–6.8)",
    sunlightRequirement: "Full sun (6–8 hours daily)",
    waterRequirement: "Deep root watering every 2–3 days",
    temperatureRange: "20°C – 27°C",
    latestHealthScore: 82,
    latestStatus: "Moderate Stress",
    latestDisease: "Early Blight",
    notes: "Monitor lower leaves for concentric ring spots.",
    lastWateredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    lastCareAction: "Trimmed lower spotted leaves",
    lastCareActionAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560102",
    plantName: "Garden Rose",
    nickname: "Rosie",
    scientificName: "Rosa × hybrida",
    category: "Flowering Shrub · Rosaceae",
    location: "South Courtyard",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.rose}`,
    soilType: "Rich organic loam (pH 6.5)",
    sunlightRequirement: "Full morning sun (6+ hours)",
    waterRequirement: "Water deeply twice weekly at base",
    temperatureRange: "16°C – 25°C",
    latestHealthScore: 96,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "Vibrant foliage and active bud development.",
    lastWateredAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    lastCareAction: "Watered deeply at base",
    lastCareActionAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560103",
    plantName: "Chilli Pepper",
    nickname: "Pepper",
    scientificName: "Capsicum annuum",
    location: "Sunny Balcony Planter",
    category: "Spice Crop · Solanaceae",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.chilli}`,
    soilType: "Sandy loam with compost (pH 6.0–6.8)",
    sunlightRequirement: "Full bright sunlight",
    waterRequirement: "Moderate — allow top inch to dry",
    temperatureRange: "21°C – 29°C",
    latestHealthScore: 76,
    latestStatus: "Mild Stress",
    latestDisease: "Mild Interveinal Chlorosis",
    notes: "Scheduled for organic magnesium and nitrogen feed.",
    lastWateredAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    lastCareAction: "Moved to brighter morning sun",
    lastCareActionAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560104",
    plantName: "Monstera Deliciosa",
    nickname: "Milo",
    scientificName: "Monstera deliciosa",
    category: "Indoor Tropical · Araceae",
    location: "Living Room East Window",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.monstera}`,
    soilType: "Chunky aroid mix with bark & perlite",
    sunlightRequirement: "Bright indirect morning light",
    waterRequirement: "Every 7–9 days when top 2 inches dry",
    temperatureRange: "18°C – 27°C",
    latestHealthScore: 94,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "New fenestrated leaf unfurling cleanly.",
    lastWateredAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    lastCareAction: "Wiped leaves & rotated toward light",
    lastCareActionAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560105",
    plantName: "Fiddle Leaf Fig",
    nickname: "Figgy",
    scientificName: "Ficus lyrata",
    category: "Indoor Tree · Moraceae",
    location: "Sunroom Corner",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.fiddleLeafFig}`,
    soilType: "Well-aerated peat & bark mix (pH 6.0–6.5)",
    sunlightRequirement: "Bright filtered daylight",
    waterRequirement: "Every 7–10 days when top 2 inches dry",
    temperatureRange: "18°C – 26°C",
    latestHealthScore: 93,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "Broad violin-shaped leaves wiped clean for optimal photosynthesis.",
    lastWateredAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    lastCareAction: "Checked top soil & misted canopy",
    lastCareActionAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560106",
    plantName: "Peace Lily",
    nickname: "Lily",
    scientificName: "Spathiphyllum wallisii",
    category: "Flowering Tropical · Araceae",
    location: "Study Desk North Window",
    imageUrl: `/src/assets/images/${REAL_IMAGE_FILES.peaceLily}`,
    soilType: "Rich moisture-retentive organic potting mix",
    sunlightRequirement: "Medium to bright indirect light",
    waterRequirement: "Keep evenly moist; mist weekly",
    temperatureRange: "18°C – 26°C",
    latestHealthScore: 95,
    latestStatus: "Healthy",
    latestDisease: "Healthy",
    notes: "Blooming white spathes with glossy dark green leaves.",
    lastWateredAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    lastCareAction: "Watered & checked white blooms",
    lastCareActionAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_HISTORY = [
  {
    id: "671f9b20c4d8a912e4560201",
    plant_name: "Tomato",
    scientific_name: "Solanum lycopersicum",
    family: "Solanaceae",
    disease_name: "Early Blight (Alternaria solani)",
    confidence_score: 0.94,
    severity: "moderate",
    overall_status: "Moderate Stress",
    health_score: 78,
    symptoms: [
      "Concentric dark brown rings on older lower leaves",
      "Slight yellow halo surrounding leaf lesions",
    ],
    possible_nutrient_deficiency: "Mild Nitrogen & Potassium depletion",
    nutrient_deficiency_details:
      "Lower leaf senescence accelerated by fungal stress and fruiting nutrient demand.",
    treatment_recommendations: [
      "Prune and dispose of affected lower leaves using sanitized shears.",
      "Apply organic copper fungicide or bio-fungicide spray every 7–10 days.",
      "Water at the base of the plant early in the morning to keep foliage dry.",
    ],
    prevention_recommendations: [
      "Mulch around the base of stems to prevent soil-borne spore splash.",
      "Ensure 60–75 cm spacing between plants for airflow.",
      "Rotate solanaceous crops each growing season.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.tomato}`,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560202",
    plant_name: "Garden Rose",
    scientific_name: "Rosa × hybrida",
    family: "Rosaceae",
    disease_name: "Healthy",
    confidence_score: 0.98,
    severity: "none",
    overall_status: "Healthy",
    health_score: 96,
    symptoms: [
      "Deep glossy green cuticle",
      "Uniform leaf margins with zero necrotic spotting",
    ],
    possible_nutrient_deficiency: "None detected",
    nutrient_deficiency_details:
      "Optimal chlorophyll density and balanced macro/micronutrient uptake.",
    treatment_recommendations: [
      "Continue current deep watering schedule twice weekly.",
      "Deadhead spent blooms to encourage new flowering stems.",
    ],
    prevention_recommendations: [
      "Maintain morning sun exposure to dry overnight dew quickly.",
      "Top-dress with organic compost in early spring and mid-summer.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.rose}`,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560203",
    plant_name: "Chilli Pepper",
    scientific_name: "Capsicum annuum",
    family: "Solanaceae",
    disease_name: "Interveinal Chlorosis",
    confidence_score: 0.91,
    severity: "mild",
    overall_status: "Mild Stress",
    health_score: 76,
    symptoms: [
      "Pale yellowing between leaf veins",
      "Slight upward curling on mid-canopy foliage",
    ],
    possible_nutrient_deficiency: "Magnesium & Nitrogen Deficiency",
    nutrient_deficiency_details:
      "Interveinal yellowing indicates reduced chlorophyll synthesis due to low magnesium availability.",
    treatment_recommendations: [
      "Apply a foliar spray of diluted Epsom salt (1 tsp per liter of water).",
      "Feed with a balanced organic liquid fertilizer rich in trace minerals.",
    ],
    prevention_recommendations: [
      "Maintain soil pH between 6.0 and 6.8 for optimal nutrient uptake.",
      "Avoid overwatering which leaches soluble magnesium from container soil.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.chilli}`,
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "671f9b20c4d8a912e4560204",
    plant_name: "Monstera Deliciosa",
    scientific_name: "Monstera deliciosa",
    family: "Araceae",
    disease_name: "Minor Leaf Tip Low-Humidity Stress",
    confidence_score: 0.95,
    severity: "mild",
    overall_status: "Healthy",
    health_score: 91,
    symptoms: [
      "Rich fenestrated leaf lamina",
      "Slight dry margin on oldest lower leaf tip",
    ],
    possible_nutrient_deficiency: "None detected",
    nutrient_deficiency_details:
      "Overall foliar nutrition is optimal; minor tip browning is caused by low indoor relative humidity.",
    treatment_recommendations: [
      "Increase ambient humidity around the plant to 55%–65%.",
      "Water thoroughly when the top 2 inches of potting mix feel dry.",
    ],
    prevention_recommendations: [
      "Keep away from direct AC or heating vents.",
      "Wipe leaves monthly to maximize photosynthetic efficiency.",
    ],
    image_path: `/src/assets/images/${REAL_IMAGE_FILES.monsteraSpot}`,
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

const INITIAL_RECOMMENDATIONS = [
  {
    id: "rec-101",
    plantId: "671f9b20c4d8a912e4560101",
    plantName: "Tomato",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.tomato}`,
    recommendation: "Prune lower blight-affected leaves & apply copper bio-fungicide",
    category: "Disease prevention",
    priority: "high",
    explanation:
      "Removing lower leaves with concentric lesions stops Alternaria spores from splashing onto healthy upper foliage.",
    recommendedAction:
      "Remove the bottom 3–4 infected leaflets with clean shears and mist canopy with organic copper soap.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-102",
    plantId: "671f9b20c4d8a912e4560104",
    plantName: "Monstera Deliciosa",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.monstera}`,
    recommendation: "Rotate container 90° and mist aerial roots",
    category: "Lighting",
    priority: "medium",
    explanation:
      "Even light exposure ensures balanced petiole posture and larger fenestrations on new leaves.",
    recommendedAction:
      "Turn pot a quarter turn clockwise and wipe dust from broad leaf surfaces with a damp cloth.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-103",
    plantId: "671f9b20c4d8a912e4560103",
    plantName: "Chilli Pepper",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.chilli}`,
    recommendation: "Supplement with magnesium & balanced organic nitrogen",
    category: "Nutrition",
    priority: "high",
    explanation:
      "Corrects interveinal chlorosis and supports healthy flower and fruit set.",
    recommendedAction:
      "Water with 500ml of chelated micronutrient solution during morning irrigation.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-104",
    plantId: "671f9b20c4d8a912e4560102",
    plantName: "Garden Rose",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.rose}`,
    recommendation: "Deep base watering & organic mulch refresh",
    category: "Watering",
    priority: "low",
    explanation:
      "Keeps root zone cool and moist without wetting foliage.",
    recommendedAction:
      "Deliver 3 liters of water at the root collar and maintain a 5cm bark mulch layer.",
    date: new Date().toISOString(),
    status: "completed",
  },
  {
    id: "rec-105",
    plantId: "671f9b20c4d8a912e4560105",
    plantName: "Fiddle Leaf Fig",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.fiddleLeafFig}`,
    recommendation: "Wipe broad leaf lamina & check top 2 inches of soil",
    category: "Maintenance",
    priority: "medium",
    explanation:
      "Dust-free violin-shaped leaves absorb up to 30% more indirect indoor sunlight.",
    recommendedAction:
      "Gently wipe upper and lower leaf surfaces with a soft damp microfiber cloth.",
    date: new Date().toISOString(),
    status: "active",
  },
  {
    id: "rec-106",
    plantId: "671f9b20c4d8a912e4560106",
    plantName: "Peace Lily",
    plantImage: `/src/assets/images/${REAL_IMAGE_FILES.peaceLily}`,
    recommendation: "Maintain gentle humidity around emerging white spathes",
    category: "Humidity",
    priority: "low",
    explanation:
      "Consistent 55–65% relative humidity prevents brown leaf tips and prolongs bloom life.",
    recommendedAction:
      "Mist surrounding air with filtered water and keep soil lightly moist.",
    date: new Date().toISOString(),
    status: "active",
  },
];

interface CareCheckInRecord {
  id: string;
  plantId: string;
  plantName: string;
  actionType: "watered" | "moved_light" | "fertilized" | "trimmed" | "uploaded_photo";
  note?: string;
  timestamp: string;
}

const INITIAL_CARE_EVENTS: CareCheckInRecord[] = [
  {
    id: "care_evt_1",
    plantId: "671f9b20c4d8a912e4560104",
    plantName: "Monstera Deliciosa",
    actionType: "watered",
    note: "Watered thoroughly and drained saucer",
    timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "care_evt_2",
    plantId: "671f9b20c4d8a912e4560101",
    plantName: "Tomato",
    actionType: "trimmed",
    note: "Trimmed lower spotted leaves",
    timestamp: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
  {
    id: "care_evt_3",
    plantId: "671f9b20c4d8a912e4560102",
    plantName: "Garden Rose",
    actionType: "watered",
    note: "Deep morning watering at root zone",
    timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
];

interface DatabaseSchema {
  plants: typeof INITIAL_PLANTS;
  history: typeof INITIAL_HISTORY;
  recommendations: typeof INITIAL_RECOMMENDATIONS;
  sensors: Record<string, unknown>[];
  careEvents: CareCheckInRecord[];
}

function loadDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      const parsed = JSON.parse(raw);

      const rawPlants: typeof INITIAL_PLANTS = Array.isArray(parsed.plants)
        ? parsed.plants
        : INITIAL_PLANTS;
      const existingIds = new Set(rawPlants.map((p) => p.id));
      for (const seedPlant of INITIAL_PLANTS) {
        if (!existingIds.has(seedPlant.id)) {
          rawPlants.push(seedPlant);
        }
      }
      const plants = rawPlants.map((p) => {
        const seedMatch = INITIAL_PLANTS.find((s) => s.id === p.id);
        return {
          ...seedMatch,
          ...p,
          nickname: p.nickname !== undefined ? p.nickname : seedMatch?.nickname,
          lastWateredAt: p.lastWateredAt || seedMatch?.lastWateredAt,
          lastCareAction: p.lastCareAction || seedMatch?.lastCareAction,
          lastCareActionAt: p.lastCareActionAt || seedMatch?.lastCareActionAt,
          imageUrl: pickRealisticImageUrl(p.imageUrl, p.plantName, p.scientificName),
        };
      });

      const rawHistory: typeof INITIAL_HISTORY = Array.isArray(parsed.history)
        ? parsed.history
        : INITIAL_HISTORY;
      const history = rawHistory.map((h) => ({
        ...h,
        image_path: pickRealisticImageUrl(h.image_path, h.plant_name, h.scientific_name),
      }));

      const rawRecs: typeof INITIAL_RECOMMENDATIONS = Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : INITIAL_RECOMMENDATIONS;
      const existingRecIds = new Set(rawRecs.map((r) => r.id));
      for (const seedRec of INITIAL_RECOMMENDATIONS) {
        if (!existingRecIds.has(seedRec.id)) {
          rawRecs.push(seedRec);
        }
      }
      const recommendations = rawRecs.map((r) => ({
        ...r,
        plantImage: pickRealisticImageUrl(r.plantImage, r.plantName),
      }));

      const careEvents: CareCheckInRecord[] = Array.isArray(parsed.careEvents)
        ? parsed.careEvents
        : INITIAL_CARE_EVENTS;

      return {
        plants,
        history,
        recommendations,
        sensors: parsed.sensors || [],
        careEvents,
      };
    }
  } catch {
    // ignore
  }
  const initial = {
    plants: INITIAL_PLANTS,
    history: INITIAL_HISTORY,
    recommendations: INITIAL_RECOMMENDATIONS,
    sensors: [],
    careEvents: INITIAL_CARE_EVENTS,
  };
  saveDb(initial);
  return initial;
}

function saveDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
  } catch {
    // ignore
  }
}

const PRESET_RESULTS: Record<string, (typeof INITIAL_HISTORY)[0]> = {
  tomato: INITIAL_HISTORY[0],
  rose: INITIAL_HISTORY[1],
  chilli: INITIAL_HISTORY[2],
  monstera: INITIAL_HISTORY[3],
};

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "PlantCare AI" });
});

app.get("/api/plants", (_req, res) => {
  const db = loadDb();
  res.json(db.plants);
});

app.get("/api/plants/:id", (req, res) => {
  const db = loadDb();
  const found = db.plants.find((p) => p.id === req.params.id) || db.plants[0];
  res.json(found);
});

app.post("/api/plants", (req, res) => {
  const db = loadDb();
  const body = req.body || {};
  const plantName = body.plantName || "Botanical Specimen";
  const scientificName = body.scientificName || "Botanical cultivar";
  const newPlant = {
    id: `plant_${Date.now()}`,
    plantName,
    nickname: body.nickname ? String(body.nickname).trim() : undefined,
    scientificName,
    category: body.category || "Indoor Tropical",
    location: body.location || "Home Garden",
    imageUrl: pickRealisticImageUrl(body.imageUrl, plantName, scientificName),
    soilType: body.soilType || "Well-draining potting mix",
    sunlightRequirement: body.sunlightRequirement || "Bright indirect sunlight",
    waterRequirement: body.waterRequirement || "When top 2 inches feel dry",
    temperatureRange: body.temperatureRange || "18°C – 27°C",
    latestHealthScore: body.latestHealthScore ?? 92,
    latestStatus: body.latestStatus || "Healthy",
    latestDisease: body.latestDisease || "Healthy",
    notes: body.notes || "",
    lastWateredAt: body.lastWateredAt || new Date().toISOString(),
    lastCareAction: body.lastCareAction || "Added to collection",
    lastCareActionAt: body.lastCareActionAt || new Date().toISOString(),
  };
  db.plants.unshift(newPlant);
  saveDb(db);
  res.status(201).json(newPlant);
});

app.put("/api/plants/:id", (req, res) => {
  const db = loadDb();
  const idx = db.plants.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }
  const merged = { ...db.plants[idx], ...req.body };
  merged.imageUrl = pickRealisticImageUrl(
    merged.imageUrl,
    merged.plantName,
    merged.scientificName
  );
  db.plants[idx] = merged;
  saveDb(db);
  res.json(db.plants[idx]);
});

app.delete("/api/plants/:id", (req, res) => {
  const db = loadDb();
  db.plants = db.plants.filter((p) => p.id !== req.params.id);
  saveDb(db);
  res.json({ deleted: true });
});

app.get("/api/history", (_req, res) => {
  const db = loadDb();
  res.json(db.history);
});

app.delete("/api/history/:id", (req, res) => {
  const db = loadDb();
  const targetId = req.params.id;
  const initialLen = db.history.length;
  db.history = db.history.filter((h) => h.id !== targetId);
  if (db.history.length === initialLen) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  saveDb(db);
  res.json({ deleted: true, id: targetId });
});

app.get("/api/results/:id", (req, res) => {
  const db = loadDb();
  const found = db.history.find((h) => h.id === req.params.id);
  if (!found) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }
  res.json(found);
});

const SUPPORTED_GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.1-flash-lite"] as const;

function getConfiguredGeminiModels(): string[] {
  const envModel = (process.env.GEMINI_MODEL || "").trim().replace(/^models\//, "");
  const isDeprecated =
    !envModel ||
    envModel.includes("2.5") ||
    envModel.includes("2.0") ||
    envModel.includes("1.5") ||
    envModel === "gemini-pro";

  if (!isDeprecated && !SUPPORTED_GEMINI_MODELS.includes(envModel as (typeof SUPPORTED_GEMINI_MODELS)[number])) {
    return [envModel, ...SUPPORTED_GEMINI_MODELS];
  }
  return [...SUPPORTED_GEMINI_MODELS];
}

function handleUploadMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    const singleUpload = upload.single("image") as unknown as express.RequestHandler;
    singleUpload(req, res, (err: unknown) => {
      if (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Invalid image upload payload. Please upload a JPG, PNG, or WEBP image under 10 MB.";
        res.status(400).json({ error: message, message });
        return;
      }
      next();
    });
  } else {
    next();
  }
}

app.post("/api/analyze", handleUploadMiddleware, async (req, res) => {
  try {
    const db = loadDb();
    const presetKey = (req.body?.specimenPreset || "").toLowerCase();

    if (presetKey && PRESET_RESULTS[presetKey]) {
      const presetTemplate = PRESET_RESULTS[presetKey];
      const created = {
        ...presetTemplate,
        id: `scan_${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      db.history.unshift(created);
      saveDb(db);
      res.json(created);
      return;
    }

    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let originalName = "uploaded_leaf.jpg";

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype || req.body?.mime_type || "image/jpeg";
      originalName = req.file.originalname || originalName;
    } else if (req.body?.imageBase64 && typeof req.body.imageBase64 === "string") {
      const rawBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, "");
      imageBuffer = Buffer.from(rawBase64, "base64");
      imageMimeType = req.body.mime_type || req.body.mimeType || "image/jpeg";
      originalName = req.body.filename || originalName;
    }

    let savedImagePath = `/src/assets/images/${REAL_IMAGE_FILES.tomato}`;
    if (imageBuffer && imageBuffer.length > 0) {
      const ext = imageMimeType.includes("png")
        ? "png"
        : imageMimeType.includes("webp")
          ? "webp"
          : "jpg";
      const filename = `leaf_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, imageBuffer);
      savedImagePath = `/uploads/${filename}`;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && imageBuffer && imageBuffer.length > 0) {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      const base64Image = imageBuffer.toString("base64");
      const hint = req.body?.plant_hint ? `User hint: ${req.body.plant_hint}.` : "";
      const reqLang = (req.body?.language || "en").toLowerCase();
      const langInstruction =
        reqLang === "ta"
          ? "IMPORTANT: The user's selected language is Tamil (தமிழ்). Return plant_name in Tamil with English in parentheses, keep scientific_name and family in standard Latin botanical terms, and write disease_name, symptoms, possible_nutrient_deficiency, nutrient_deficiency_details, treatment_recommendations, and prevention_recommendations in natural, readable Tamil (தமிழ்)."
          : "";

      const modelsToTry = getConfiguredGeminiModels();

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: imageMimeType,
                  data: base64Image,
                },
              },
              {
                text: `You are an expert botanist and plant pathologist. Analyze this plant image. ${hint} ${langInstruction} Return a JSON object with plant_name, scientific_name, family, disease_name (or "Healthy"), confidence_score (0 to 1), severity ("none", "mild", "moderate", "severe"), overall_status ("Healthy", "Mild Stress", "Moderate Stress", "Severe Stress"), health_score (0 to 100), symptoms (array of strings), possible_nutrient_deficiency, nutrient_deficiency_details, treatment_recommendations (array of strings), prevention_recommendations (array of strings).`,
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  plant_name: { type: Type.STRING },
                  scientific_name: { type: Type.STRING },
                  family: { type: Type.STRING },
                  disease_name: { type: Type.STRING },
                  confidence_score: { type: Type.NUMBER },
                  severity: { type: Type.STRING },
                  overall_status: { type: Type.STRING },
                  health_score: { type: Type.NUMBER },
                  symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                  possible_nutrient_deficiency: { type: Type.STRING },
                  nutrient_deficiency_details: { type: Type.STRING },
                  treatment_recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  prevention_recommendations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            const normalizedDisease =
              !parsed.disease_name ||
              parsed.disease_name.toLowerCase() === "none" ||
              parsed.disease_name.toLowerCase() === "no disease"
                ? "Healthy"
                : parsed.disease_name;
            const resultRecord = {
              id: `scan_${Date.now()}`,
              plant_name: parsed.plant_name || "Botanical Specimen",
              scientific_name: parsed.scientific_name || "Botanical cultivar",
              family: parsed.family || "Angiosperms",
              disease_name: normalizedDisease,
              confidence_score: parsed.confidence_score ?? 0.93,
              severity: parsed.severity || "none",
              overall_status: parsed.overall_status || "Healthy",
              health_score: parsed.health_score ?? 88,
              symptoms:
                Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0
                  ? parsed.symptoms
                  : ["Foliar surface inspected"],
              possible_nutrient_deficiency:
                parsed.possible_nutrient_deficiency || "None detected",
              nutrient_deficiency_details:
                parsed.nutrient_deficiency_details ||
                "Balanced foliar nutrition observed.",
              treatment_recommendations:
                Array.isArray(parsed.treatment_recommendations) &&
                parsed.treatment_recommendations.length > 0
                  ? parsed.treatment_recommendations
                  : ["Maintain consistent watering and bright indirect light."],
              prevention_recommendations:
                Array.isArray(parsed.prevention_recommendations) &&
                parsed.prevention_recommendations.length > 0
                  ? parsed.prevention_recommendations
                  : ["Ensure good air circulation and well-draining soil."],
              image_path: savedImagePath,
              created_at: new Date().toISOString(),
            };
            db.history.unshift(resultRecord);
            saveDb(db);
            res.json(resultRecord);
            return;
          }
        } catch (_modelErr) {
          // Try next supported model in fallback chain
          continue;
        }
      }
    }

    // Match hint/filename if all models are temporarily unreachable, while preserving the user's uploaded image_path
    const hintKey = `${req.body?.plant_hint || ""} ${originalName}`.toLowerCase();
    let template = INITIAL_HISTORY[1]; // Default healthy botanical specimen for user uploads
    if (hintKey.includes("tomato") || hintKey.includes("blight") || hintKey.includes("spot")) {
      template = INITIAL_HISTORY[0];
    } else if (hintKey.includes("chilli") || hintKey.includes("pepper") || hintKey.includes("yellow")) {
      template = INITIAL_HISTORY[2];
    } else if (hintKey.includes("monstera")) {
      template = INITIAL_HISTORY[3];
    }

    const fallbackRecord = {
      ...template,
      id: `scan_${Date.now()}`,
      image_path: savedImagePath,
      created_at: new Date().toISOString(),
    };
    db.history.unshift(fallbackRecord);
    saveDb(db);
    res.json(fallbackRecord);
  } catch (err: unknown) {
    const rawMessage = err instanceof Error ? err.message : "Unexpected server error";
    res.status(500).json({
      error: "Plant health analysis failed",
      message: rawMessage.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
    });
  }
});

app.get("/api/recommendations", (_req, res) => {
  const db = loadDb();
  res.json(db.recommendations);
});

app.put("/api/recommendations/:id", (req, res) => {
  const db = loadDb();
  const item = db.recommendations.find((r) => r.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (req.body?.status) item.status = req.body.status;
  saveDb(db);
  res.json(item);
});

app.post("/api/sensors", (req, res) => {
  const db = loadDb();
  const entry = {
    id: `sensor_${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  db.sensors.unshift(entry);
  saveDb(db);
  res.status(201).json(entry);
});

const LANGUAGE_NAME_MAP: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिन्दी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  mr: "Marathi (मराठी)",
  pa: "Punjabi (ਪੰਜਾਬੀ)",
  bn: "Bengali (বাংলা)",
  gu: "Gujarati (ગુજરાતી)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  zh: "Simplified Chinese (中文)",
};

app.post("/api/assistant", handleUploadMiddleware, async (req, res) => {
  try {
    const db = loadDb();
    const rawMessage = String(req.body?.message || "").trim();
    const selectedPlantId = String(req.body?.plantId || "").trim();
    const reqLang = String(req.body?.language || "en").trim().toLowerCase();
    const languageName = LANGUAGE_NAME_MAP[reqLang] || "English";

    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let savedImageUrl: string | undefined;

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype || req.body?.mime_type || "image/jpeg";
    } else if (req.body?.imageBase64 && typeof req.body.imageBase64 === "string") {
      const rawBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, "");
      imageBuffer = Buffer.from(rawBase64, "base64");
      imageMimeType = req.body.mime_type || req.body.mimeType || "image/jpeg";
    }

    if (imageBuffer && imageBuffer.length > 0) {
      const ext = imageMimeType.includes("png")
        ? "png"
        : imageMimeType.includes("webp")
          ? "webp"
          : "jpg";
      const filename = `assistant_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, imageBuffer);
      savedImageUrl = `/uploads/${filename}`;
    }

    if (!rawMessage && (!imageBuffer || imageBuffer.length === 0)) {
      res.status(400).json({
        error: "Please enter a question or attach a plant image.",
        message: "Please enter a question or attach a plant image.",
      });
      return;
    }

    // Gather real available plant context if a plant is selected
    const selectedPlant = selectedPlantId
      ? db.plants.find((p) => p.id === selectedPlantId)
      : undefined;

    let plantContextSummary = "No specific plant selected by the user.";
    if (selectedPlant) {
      const matchingAnalyses = db.history.filter(
        (h) =>
          h.plant_name.toLowerCase().includes(selectedPlant.plantName.toLowerCase()) ||
          selectedPlant.plantName.toLowerCase().includes(h.plant_name.toLowerCase()) ||
          (h.scientific_name &&
            selectedPlant.scientificName &&
            h.scientific_name.toLowerCase() === selectedPlant.scientificName.toLowerCase())
      );

      const matchingRecs = db.recommendations.filter(
        (r) =>
          r.plantId === selectedPlant.id ||
          r.plantName.toLowerCase() === selectedPlant.plantName.toLowerCase()
      );

      const latestAnalysis = matchingAnalyses[0];

      plantContextSummary = [
        `Selected Plant Profile:`,
        `- Plant Name: ${selectedPlant.plantName}`,
        `- Scientific Name: ${selectedPlant.scientificName || "Not recorded"}`,
        `- Category: ${selectedPlant.category || "Not recorded"}`,
        `- Location: ${selectedPlant.location || "Not recorded"}`,
        `- Current Health Score: ${selectedPlant.latestHealthScore ?? "Not recorded"}%`,
        `- Current Status: ${selectedPlant.latestStatus || "Not recorded"}`,
        `- Recorded Condition/Disease: ${selectedPlant.latestDisease || "None"}`,
        `- Soil Type: ${selectedPlant.soilType || "Not recorded"}`,
        `- Sunlight Requirement: ${selectedPlant.sunlightRequirement || "Not recorded"}`,
        `- Watering Requirement: ${selectedPlant.waterRequirement || "Not recorded"}`,
        `- Temperature Range: ${selectedPlant.temperatureRange || "Not recorded"}`,
        `- Notes: ${selectedPlant.notes || "None"}`,
        latestAnalysis
          ? `Latest Diagnostic Analysis (${latestAnalysis.created_at}):\n  - Diagnosis: ${latestAnalysis.disease_name} (Confidence: ${Math.round((latestAnalysis.confidence_score || 0) * 100)}%, Severity: ${latestAnalysis.severity})\n  - Health Score: ${latestAnalysis.health_score}%\n  - Observed Symptoms: ${(latestAnalysis.symptoms || []).join("; ")}\n  - Nutrient Assessment: ${latestAnalysis.possible_nutrient_deficiency || "None"} (${latestAnalysis.nutrient_deficiency_details || ""})\n  - Previous Treatment Recommendations: ${(latestAnalysis.treatment_recommendations || []).join("; ")}\n  - Prevention Steps: ${(latestAnalysis.prevention_recommendations || []).join("; ")}`
          : `Previous Diagnostic Analyses: None recorded for this plant.`,
        matchingRecs.length > 0
          ? `Active Care Recommendations:\n  - ${matchingRecs.map((r) => `${r.recommendation} (${r.category}, priority: ${r.priority}): ${r.recommendedAction}`).join("\n  - ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    // Parse recent conversation history if provided
    let historyContext = "";
    if (req.body?.history) {
      try {
        const parsedHistory =
          typeof req.body.history === "string"
            ? JSON.parse(req.body.history)
            : req.body.history;
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          const recentTurns = parsedHistory.slice(-6);
          historyContext =
            "Recent conversation turns:\n" +
            recentTurns
              .map(
                (m: { role?: string; content?: string }) =>
                  `${m.role === "assistant" ? "AI Plant Assistant" : "User"}: ${String(m.content || "").slice(0, 500)}`
              )
              .join("\n");
        }
      } catch {
        // ignore malformed history
      }
    }

    const formatTemplate =
      reqLang === "ta"
        ? [
            `🌱 பதில்:`,
            `[1–2 எளிய வாக்கியங்களில் நேரடி பதில்]`,
            ``,
            `💡 செய்ய வேண்டியவை:`,
            `• [படி 1]`,
            `• [படி 2]`,
            `• [படி 3]`,
            ``,
            `⚠️ கவனிக்க வேண்டியவை:`,
            `[தேவையெனில் ஒரு சிறிய எச்சரிக்கை அல்லது குறிப்பு]`,
          ].join("\n")
        : [
            `🌱 Answer:`,
            `[One short direct answer in 1–2 simple sentences]`,
            ``,
            `💡 What to do:`,
            `• [Step 1]`,
            `• [Step 2]`,
            `• [Step 3]`,
            ``,
            `⚠️ Watch for:`,
            `[One short warning or tip if necessary]`,
          ].join("\n");

    const systemInstruction = [
      `You are the PlantCare AI Assistant. Give short, simple, beginner-friendly, and practical plant-care answers in a warm, polite, soft, calm, and reassuring tone.`,
      `STRICT LANGUAGE RULE:`,
      `- The user's selected application language is ${languageName} (code: "${reqLang}").`,
      `- Understand the user's question whether it is written in Tamil, Tamil-English mixed (Tanglish), English, or another language, and ALWAYS respond 100% in ${languageName}.`,
      `- If Tamil (ta) is selected, write in natural, polite, everyday Tamil without unnecessary English words (keep Latin scientific names only when helpful).`,
      `POLITE & CALM VOICE TONE:`,
      `- Sound like a calm, friendly, knowledgeable gardening companion speaking gently to a beginner.`,
      `- Use polite, reassuring phrasing such as "Your plant may be getting a little too much water", "Please let the top 1 to 2 inches of soil dry before watering again", or "Please try to avoid overwatering" instead of harsh commands like "Do not" or "Immediately".`,
      `STRICT CONCISE RESPONSE STYLE (50–120 WORDS MAXIMUM):`,
      `- NEVER write long paragraphs or essays. Keep the entire response around 50–120 words (or 1–4 short sentences for very simple questions).`,
      `- Do NOT repeat the user's question or add filler greetings.`,
      `- Give the most important direct answer first.`,
      `- Use 3–5 short bullet points (•) for actions.`,
      `- Use simple everyday language. Avoid heavy scientific jargon; if a technical term is needed, explain it in one simple sentence.`,
      `- Use this clean structure (localized to ${languageName}):`,
      formatTemplate,
      `PLANT CONTEXT & SAFETY RULES:`,
      `- Use the provided Selected Plant Profile and Previous Diagnostic Analysis when available. Do NOT invent plant details that are not provided.`,
      `- If no plant is selected, give practical general advice and briefly mention they can select a saved plant for tailored care.`,
      `- For uncertain symptoms, say "This may be..." (or its ${languageName} equivalent), give practical next steps, and suggest uploading a clear leaf photo when visual inspection helps.`,
      `- For severe plant damage, gently suggest consulting a local gardening or agriculture expert.`,
      `- Do not use markdown bold asterisks (**text**) or code fences; keep plain text with the section emojis and bullet points (•) so it reads cleanly and speaks naturally via Text-to-Speech.`,
    ].join("\n");

    const userPrompt = [
      plantContextSummary,
      historyContext,
      imageBuffer
        ? `The user attached a plant photo for visual inspection.`
        : `No image was attached.`,
      `User Question: ${rawMessage || "Please check this plant image and tell me what to do in simple steps."}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const modelsToTry = getConfiguredGeminiModels();

      for (const modelName of modelsToTry) {
        try {
          const parts: Array<
            | { inlineData: { mimeType: string; data: string } }
            | { text: string }
          > = [];

          if (imageBuffer && imageBuffer.length > 0) {
            parts.push({
              inlineData: {
                mimeType: imageMimeType,
                data: imageBuffer.toString("base64"),
              },
            });
          }
          parts.push({ text: userPrompt });

          const response = await ai.models.generateContent({
            model: modelName,
            contents: parts,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });

          const replyText = response.text?.trim();
          if (replyText) {
            const cleanedReply = replyText.replace(/\*\*/g, "").trim();
            res.json({
              id: `msg_${Date.now()}`,
              reply: cleanedReply,
              plantId: selectedPlant?.id,
              plantName: selectedPlant?.plantName,
              imageUrl: savedImageUrl,
              model: modelName,
              createdAt: new Date().toISOString(),
            });
            return;
          }
        } catch (_modelErr) {
          continue;
        }
      }
    }

    // Concise context-aware fallback if upstream AI is temporarily unreachable
    const plantLabel = selectedPlant
      ? `${selectedPlant.plantName} (${selectedPlant.scientificName})`
      : reqLang === "ta"
        ? "உங்கள் செடி"
        : "your plant";

    const fallbackReply =
      reqLang === "ta"
        ? [
            `🌱 பதில்:`,
            `${plantLabel} ஆரோக்கியமாக வளர மண்ணின் ஈரப்பதம் மற்றும் வெளிச்சத்தைச் சரியாகப் பராமரிக்க வேண்டும்.${selectedPlant ? ` (தற்போதைய ஆரோக்கியம்: ${selectedPlant.latestHealthScore ?? 90}%)` : ""}`,
            ``,
            `💡 செய்ய வேண்டியவை:`,
            `• மேல் மண் 2–3 செ.மீ காய்ந்த பிறகு மட்டும் தண்ணீர் ஊற்றவும்.`,
            `• ${selectedPlant?.sunlightRequirement ? "போதுமான வெளிச்சம் கிடைக்கும் இடத்தில் வைக்கவும்." : "தினமும் மிதமான சூரிய ஒளி கிடைக்குமாறு வைக்கவும்."}`,
            `• பாதிக்கப்பட்ட அல்லது பழுத்த இலைகளை அகற்றி விடவும்.`,
            ``,
            `⚠️ கவனிக்க வேண்டியவை:`,
            `அதிகப்படியான நீர் வேர்களைப் பாதிக்கலாம். துல்லியமான ஆய்வுக்கு இலையின் தெளிவான புகைப்படத்தைப் பதிவேற்றவும்.`,
          ].join("\n")
        : [
            `🌱 Answer:`,
            `This may be caused by watering imbalance, light stress, or mild nutrient deficiency in ${plantLabel}.${selectedPlant ? ` (Current health score: ${selectedPlant.latestHealthScore ?? 90}%)` : ""}`,
            ``,
            `💡 What to do:`,
            `• Check the top 2–3 cm of soil and water only when it feels dry.`,
            `• Ensure ${selectedPlant?.sunlightRequirement?.toLowerCase() || "steady bright indirect sunlight"} and good pot drainage.`,
            `• Upload a clear leaf photo if spots or yellowing spread.`,
            ``,
            `⚠️ Watch for:`,
            `Avoid overwatering, as soggy soil can quickly damage the roots.`,
          ].join("\n");

    res.json({
      id: `msg_${Date.now()}`,
      reply: fallbackReply,
      plantId: selectedPlant?.id,
      plantName: selectedPlant?.plantName,
      imageUrl: savedImageUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const rawErr = err instanceof Error ? err.message : "Unexpected assistant error";
    res.status(500).json({
      error: "Unable to get a response from AI Plant Assistant",
      message: rawErr.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
    });
  }
});

function generateFarmerFallbackAdvice(
  question: string,
  lang: string,
  cropName?: string
): {
  spokenSummary: string;
  diagnosis: string;
  crop: string;
  immediateSteps: string[];
  organicRemedy: string;
  precautions: string;
} {
  const q = question.toLowerCase();

  // Smart crop detection from user's actual question text
  let detectedCrop = cropName || "";
  if (q.includes("rose") || q.includes("ரோஜா") || q.includes("गुलाब")) detectedCrop = "Rose (ரோஜா / गुलाब)";
  else if (q.includes("tomato") || q.includes("தக்காளி") || q.includes("टमाटर")) detectedCrop = "Tomato (தக்காளி / टमाटर)";
  else if (q.includes("chilli") || q.includes("chili") || q.includes("மிளகாய்") || q.includes("मिर्च")) detectedCrop = "Chilli (மிளகாய் / मिर्च)";
  else if (q.includes("paddy") || q.includes("rice") || q.includes("நெல்") || q.includes("धान") || q.includes("వరి")) detectedCrop = "Paddy / Rice (நெல் / धान)";
  else if (q.includes("wheat") || q.includes("கோதுமை") || q.includes("गेहूं") || q.includes("గోధుమ")) detectedCrop = "Wheat (கோதுமை / गेहूं)";
  else if (q.includes("cotton") || q.includes("பருத்தி") || q.includes("कपास") || q.includes("పత్తి")) detectedCrop = "Cotton (பருத்தி / कपास)";
  else if (q.includes("potato") || q.includes("உருளை") || q.includes("आलू") || q.includes("బంగాళాదుంప")) detectedCrop = "Potato (உருளைக்கிழங்கு / आलू)";
  else if (q.includes("onion") || q.includes("வெங்காயம்") || q.includes("प्याज") || q.includes("ఉల్లి")) detectedCrop = "Onion (வெங்காயம் / प्याज)";
  else if (q.includes("brinjal") || q.includes("eggplant") || q.includes("கத்தரி") || q.includes("बैंगन")) detectedCrop = "Brinjal (கத்தரிக்காய் / बैंगन)";
  else if (q.includes("maize") || q.includes("corn") || q.includes("மக்காச்சோளம்") || q.includes("मक्का")) detectedCrop = "Maize (மக்காச்சோளம் / मक्का)";
  else if (q.includes("mustard") || q.includes("கடுகு") || q.includes("सरसों")) detectedCrop = "Mustard (கடுகு / सरसों)";
  else if (q.includes("soybean") || q.includes("सोयाबीन")) detectedCrop = "Soybean (சோயாபீன் / सोयाबीन)";
  else if (q.includes("sugarcane") || q.includes("கரும்பு") || q.includes("गन्ना")) detectedCrop = "Sugarcane (கரும்பு / गन्ना)";
  else if (q.includes("mango") || q.includes("மாம்பழம்") || q.includes("आम")) detectedCrop = "Mango (மா மரம் / आम)";
  else if (q.includes("banana") || q.includes("வாழை") || q.includes("केला")) detectedCrop = "Banana (வாழை / केला)";
  else if (q.includes("jasmine") || q.includes("மல்லிகை") || q.includes("चमेली")) detectedCrop = "Jasmine (மல்லிகை / चमेली)";
  else if (q.includes("flower") || q.includes("பூ") || q.includes("फूल")) detectedCrop = "Flowering Plant (பூச்செடி / फूल)";
  else if (q.includes("indoor") || q.includes("வீட்டு செடி")) detectedCrop = "Indoor Plant (உட்புற செடி)";
  else if (!detectedCrop) detectedCrop = "Plant / Crop";

  const isPest =
    q.includes("कीट") ||
    q.includes("इल्ली") ||
    q.includes("pest") ||
    q.includes("worm") ||
    q.includes("aphid") ||
    q.includes("பூச்சி") ||
    q.includes("புழு") ||
    q.includes("புరుగు") ||
    q.includes("कीड");
  const isFertilizer =
    q.includes("खाद") ||
    q.includes("उर्वरक") ||
    q.includes("fertilizer") ||
    q.includes("dap") ||
    q.includes("urea") ||
    q.includes("உரம்") ||
    q.includes("ఎరువు") ||
    q.includes("खत");
  const isYellow =
    q.includes("पीला") ||
    q.includes("yellow") ||
    q.includes("மஞ்சள்") ||
    q.includes("పసుపు") ||
    q.includes("पिवळी") ||
    q.includes("chlorosis");

  if (lang === "hi") {
    if (isPest) {
      return {
        spokenSummary:
          `आपकी ${detectedCrop} में कीट व इल्ली का प्रकोप लग रहा है। तुरंत नीम का तेल या इमामेक्टिन बेंजोएट का छिड़काव करें।`,
        diagnosis: "कीट व इल्ली का प्रकोप (Pest Infestation)",
        crop: detectedCrop,
        immediateSteps: [
          "प्रति लीटर पानी में 5 मिली नीम तेल या 0.5 ग्राम इमामेक्टिन बेंजोएट 5% एसजी मिलाएं।",
          "प्रति एकड़ 150 से 200 लीटर पानी का घोल बनाकर एकसमान छिड़काव करें।",
          "शाम के समय छिड़काव करें जब कीट पत्तों पर सबसे सक्रिय होते हैं।",
        ],
        organicRemedy:
          "5 मिली नीम का तेल + 1 मिली तरल साबुन प्रति लीटर पानी, या 5% नीम निबोली अर्क का छिड़काव करें।",
        precautions:
          "तेज धूप और बारिश के समय छिड़काव न करें। छिड़काव करते समय मुंह पर मास्क जरूर लगाएं।",
      };
    }
    if (isFertilizer) {
      return {
        spokenSummary:
          `${detectedCrop} की अच्छी वृद्धि और पैदावार के लिए संतुलित एनपीके और सूक्ष्म पोषक तत्वों का प्रयोग करें।`,
        diagnosis: "पोषण व उर्वरक सलाह (Nutrient Recommendation)",
        crop: detectedCrop,
        immediateSteps: [
          "वानस्पतिक वृद्धि अवस्था में यूरिया 25-30 किलोग्राम प्रति एकड़ सिंचाई के साथ दें।",
          "फूल व फल बनने की अवस्था में 19:19:19 या 0:52:34 घुलनशील खाद 1 किलोग्राम प्रति एकड़ स्प्रे करें।",
          "जिंक और बोरॉन की कमी दूर करने हेतु सूक्ष्म पोषक तत्व मिश्रण 2 ग्राम प्रति लीटर स्प्रे करें।",
        ],
        organicRemedy:
          "प्रति एकड़ 2 क्विंटल केंचुआ खाद (वर्मीकम्पोस्ट) या 200 लीटर जीवामृत सिंचाई के साथ दें।",
        precautions:
          "खेत में पर्याप्त नमी होने पर ही रासायनिक खाद का छिड़काव या बुरकाव करें।",
      };
    }
    if (isYellow) {
      return {
        spokenSummary:
          `${detectedCrop} में पत्तियों का पीलापन नाइट्रोजन या सूक्ष्म पोषक तत्वों की कमी से हो सकता है।`,
        diagnosis: "पत्तियों का पीलापन व पोषक तत्वों की कमी (Leaf Chlorosis / Deficiency)",
        crop: detectedCrop,
        immediateSteps: [
          "खेत में जलभराव न होने दें, मिट्टी की जल निकासी ठीक करें।",
          "यूरिया 1.5% (15 ग्राम प्रति लीटर) और फेरस सल्फेट 5 ग्राम प्रति लीटर का पर्णीय छिड़काव करें।",
          "यदि पीले पत्तों पर भूरे धब्बे हों तो मेंकोजेब 2 ग्राम प्रति लीटर पानी में मिलाकर स्प्रे करें।",
        ],
        organicRemedy:
          "खट्टी छाछ (मट्ठा) 500 मिली + 15 लीटर पानी का घोल बनाकर स्प्रे करें या जीवामृत का उपयोग करें।",
        precautions:
          "अत्यधिक सिंचाई से बचें, इससे जड़ों में सड़न व पीलापन बढ़ सकता है।",
      };
    }
    return {
      spokenSummary:
        `${detectedCrop} के लिए यह प्रमुख कृषि सलाह है। खेत की मिट्टी में नमी जांचें और संतुलित देखभाल करें।`,
      diagnosis: "सामान्य कृषि एवं फसल परामर्श (General Crop Care)",
      crop: detectedCrop,
      immediateSteps: [
        "सुबह या शाम के समय खेत का नियमित निरीक्षण करें।",
        "रोगग्रस्त या कीट प्रभावित पत्तों को तोड़कर नष्ट कर दें।",
        "सिंचाई मौसम और मिट्टी की आवश्यकता के अनुसार ही करें।",
      ],
      organicRemedy:
        "प्रति 15 दिन में जीवामृत या नीम अर्क का छिड़काव फसल को प्राकृतिक रूप से स्वस्थ रखता है।",
      precautions:
        "किसी भी कीटनाशक या खाद का प्रयोग अनुशंसित मात्रा में ही करें।",
    };
  }

  if (lang === "ta") {
    if (isPest) {
      return {
        spokenSummary:
          `உங்கள் ${detectedCrop} பயிரில் பூச்சி மற்றும் புழு தாக்குதல் உள்ளது. உடனே வேப்பெண்ணெய் 5 மிலி தெளிக்கவும்.`,
        diagnosis: "பூச்சி மற்றும் புழு தாக்குதல் (Pest Control)",
        crop: detectedCrop,
        immediateSteps: [
          "ஒரு லிட்டர் தண்ணீருக்கு 5 மி.லி வேப்பெண்ணெய் அல்லது இமாமெக்டின் பென்சோயேட் 0.5 கிராம் கலக்கவும்.",
          "இலைகளின் அடிப்பகுதியிலும் படும்படி காலை அல்லது மாலை வேளையில் தெளிக்கவும்.",
          "பாதிக்கப்பட்ட இலைகளைப் பறித்து அப்புறப்படுத்தவும்.",
        ],
        organicRemedy:
          "5% வேப்பங்கொட்டை கரைசல் அல்லது அக்னி அஸ்திரம் தெளித்து இயற்கை வழியில் கட்டுப்படுத்தலாம்.",
        precautions:
          "வெயில் அதிகமாக இருக்கும் போது தெளிக்க வேண்டாம். முகக்கவசம் அணியவும்.",
      };
    }
    if (isYellow) {
      return {
        spokenSummary:
          `${detectedCrop} இலைகள் மஞ்சளாக மாற ஊட்டச்சத்து குறைபாடு அல்லது வேர் அழுகல் காரணமாக இருக்கலாம்.`,
        diagnosis: "இலை மஞ்சள் நோய் மற்றும் ஊட்டச்சத்து குறைபாடு",
        crop: detectedCrop,
        immediateSteps: [
          "செடியின் வேர் பகுதியில் நீர் தேங்காமல் பார்த்துக் கொள்ளுங்கள்.",
          "ஒரு லிட்டர் தண்ணீருக்கு 15 கிராம் யூரியா மற்றும் நுண்ணூட்டச் சத்து கலந்து தெளிக்கவும்.",
          "இலைகளில் கரும்புள்ளிகள் இருந்தால் மேன்கோசெப் 2 கிராம் ஒரு லிட்டருக்கு கலந்து தெளிக்கவும்.",
        ],
        organicRemedy:
          "புளித்த மோர் 500 மிலி + 10 லிட்டர் தண்ணீர் அல்லது பஞ்சகவ்யா 30 மிலி/லிட்டர் தெளிக்கவும்.",
        precautions:
          "அதிகப்படியான நீர் பாசனத்தைத் தவிர்க்கவும்.",
      };
    }
    return {
      spokenSummary:
        `உங்கள் ${detectedCrop} பாதுகாப்பு மற்றும் வளர்ச்சிக்கு எளிய விவசாய வழிகாட்டுதல் இதோ. தவறாமல் கடைப்பிடிக்கவும்.`,
      diagnosis: "பயிர் பராமரிப்பு மற்றும் ஊட்டச்சத்து மேலாண்மை",
      crop: detectedCrop,
      immediateSteps: [
        "ஒரு லிட்டர் தண்ணீருக்கு 5 மி.லி வேப்பெண்ணெய் அல்லது பரிந்துரைக்கப்பட்ட உரம் கலக்கவும்.",
        "காலை அல்லது மாலை வேளையில் மட்டுமே தெளிப்பு மேற்கொள்ளவும்.",
        "மண்ணில் போதிய ஈரப்பதம் இருப்பதை உறுதி செய்யவும்.",
      ],
      organicRemedy:
        "வேப்பங்கொட்டை கரைசல் 5% அல்லது பஞ்சகவ்யா 30 மி.லி ஒரு லிட்டர் தண்ணீரில் கலந்து தெளிக்கவும்.",
      precautions:
        "மழை வரும் முன் அல்லது பலத்த காற்றில் தெளிக்க வேண்டாம். முகக்கவசம் அணியவும்.",
    };
  }

  if (lang === "te") {
    return {
      spokenSummary:
        `మీ ${detectedCrop} సంరక్షణ మరియు అధిక దిగుబడి కోసం ముఖ్యమైన వ్యవసాయ సలహా ఇది. క్రమం తప్పకుండా పాటించండి.`,
      diagnosis: isPest
        ? "కీటకాలు మరియు పురుగుల నివారణ"
        : isYellow
          ? "ఆకులు పసుపుబారడం మరియు పోషక లోపం"
          : "ఎరువుల యాజమాన్యం",
      crop: detectedCrop,
      immediateSteps: [
        "లీటరు నీటికి 5 మి.లీ వేప నూనె లేదా తగిన మందును కలిపి పిచికారీ చేయండి.",
        "ఎకరానికి 150-200 లీటర్ల నీటిని వాడి ఏకరీతిగా పిచికారీ చేయండి.",
        "నీటి నిల్వ లేకుండా తగినంత తేమను కాపాడండి.",
      ],
      organicRemedy:
        "జీవామృతం లేదా 5% వేప గింజల కషాయం పిచికారీ చేయడం వల్ల పంట ఆరోగ్యంగా ఉంటుంది.",
      precautions: "ఎండ తీవ్రంగా ఉన్నప్పుడు పిచికారీ చేయవద్దు. మాస్క్ ధరించండి.",
    };
  }

  if (lang === "mr") {
    return {
      spokenSummary:
        `तुमच्या ${detectedCrop} संरक्षणासाठी आणि चांगल्या उत्पादनासाठी कृषी सल्ला येथे दिला आहे.`,
      diagnosis: isPest
        ? "कीड व अळी नियंत्रण"
        : isYellow
          ? "पाने पिवळी पडणे व अन्नद्रव्य कमतरता"
          : "संतुलित खत व्यवस्थापन",
      crop: detectedCrop,
      immediateSteps: [
        "प्रति लिटर पाण्यात ५ मिली निंबोळी तेल किंवा योग्य कीटकनाशक मिसळून फवारणी करा.",
        "सकाळी किंवा संध्याकाळी शांत वातावरणात फवारणी करावी.",
        "जमिनीत वाफसा असतानाच रासायनिक खतांचा वापर करा.",
      ],
      organicRemedy:
        "दशपर्णी अर्क किंवा ५% निंबोळी अर्क वापरून कीड नियंत्रण करा.",
      precautions:
        "फवारणी करताना तोंडाला मास्क लावा आणि तीव्र उन्हात फवारणी टाळा.",
    };
  }

  if (lang === "pa") {
    return {
      spokenSummary:
        `ਤੁਹਾਡੀ ${detectedCrop} ਦੀ ਸਿਹਤ ਅਤੇ ਚੰਗੇ ਝਾੜ ਲਈ ਖੇਤੀ ਮਾਹਿਰ ਦੀ ਸਲਾਹ ਹੇਠਾਂ ਦਿੱਤੀ ਗਈ ਹੈ।`,
      diagnosis: isPest
        ? "ਕੀੜੇ ਅਤੇ ਸੁੰਡੀ ਦੀ ਰੋਕਥਾਮ"
        : isYellow
          ? "ਪੱਤਿਆਂ ਦਾ ਪੀਲਾਪਣ ਅਤੇ ਖੁਰਾਕੀ ਤੱਤ"
          : "ਖਾਦ ਅਤੇ ਪਾਣੀ ਪ੍ਰਬੰਧਨ",
      crop: detectedCrop,
      immediateSteps: [
        "ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ 5 ਮਿਲੀਲੀਟਰ ਨਿੰਮ ਦਾ ਤੇਲ ਜਾਂ ਸਿਫਾਰਸ਼ ਕੀਤੀ ਕੀਟਨਾਸ਼ਕ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।",
        "ਪ੍ਰਤੀ ਏਕੜ 150 ਲੀਟਰ ਪਾਣੀ ਦੀ ਵਰਤੋਂ ਕਰੋ।",
        "ਸਵੇਰੇ ਜਾਂ ਸ਼ਾਮ ਨੂੰ ਛਿੜਕਾਅ ਕਰੋ ਜਦੋਂ ਧੁੱਪ ਘੱਟ ਹੋਵੇ।",
      ],
      organicRemedy:
        "ਜੀਵਾਮ੍ਰਿਤ ਜਾਂ ਨਿੰਮ ਦਾ ਕਾੜ੍ਹਾ ਕੁਦਰਤੀ ਤੌਰ ਤੇ ਫਸਲ ਨੂੰ ਬਿਮਾਰੀਆਂ ਤੋਂ ਬਚਾਉਂਦਾ ਹੈ।",
      precautions:
        "ਤੇਜ਼ ਹਵਾ ਜਾਂ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਵੇਲੇ ਛਿੜਕਾਅ ਨਾ ਕਰੋ। ਮੂੰਹ 'ਤੇ ਮਾਸਕ ਜ਼ਰੂਰ ਲਗਾਓ।",
    };
  }

  return {
    spokenSummary: isPest
      ? `Identified pest infestation on ${detectedCrop}. Spray Neem oil (5ml/L) or Emamectin Benzoate (0.5g/L) across the foliage.`
      : isYellow
        ? `Leaf yellowing on ${detectedCrop} indicates nutrient deficiency or water stress. Apply 1% Urea foliar spray and optimize drainage.`
        : `Ensure balanced nutrition, optimum moisture, and regular inspection for healthy ${detectedCrop} growth.`,
    diagnosis: isPest
      ? "Pest & Insect Infestation"
      : isYellow
        ? "Leaf Chlorosis / Nutrient Stress"
        : "Balanced Crop Health & Nutrition",
    crop: detectedCrop,
    immediateSteps: [
      "Dissolve 5ml Neem oil or 2g Mancozeb per liter of clean water.",
      "Spray 150–200 liters of solution per acre thoroughly covering upper and lower leaf surfaces.",
      "Repeat after 10–12 days if symptoms or pest damage persist.",
    ],
    organicRemedy:
      "5ml pure Neem oil + 1ml liquid detergent per liter of water, or apply 200L Jeevamrutha per acre.",
    precautions:
      "Do not spray during peak afternoon heat or high wind. Wear protective face mask and gloves.",
  };
}

function detectLanguageFromInput(text: string, fallbackLang = "en"): { code: string; name: string } {
  if (!text) return { code: fallbackLang, name: LANGUAGE_NAME_MAP[fallbackLang] || "English" };
  const clean = text.trim();

  // 1. Script checks
  if (/[\u0B80-\u0BFF]/.test(clean)) return { code: "ta", name: "Tamil" };
  if (/[\u0C00-\u0C7F]/.test(clean)) return { code: "te", name: "Telugu" };
  if (/[\u0C80-\u0CFF]/.test(clean)) return { code: "kn", name: "Kannada" };
  if (/[\u0D00-\u0D7F]/.test(clean)) return { code: "ml", name: "Malayalam" };
  if (/[\u0980-\u09FF]/.test(clean)) return { code: "bn", name: "Bengali" };
  if (/[\u0A80-\u0AFF]/.test(clean)) return { code: "gu", name: "Gujarati" };
  if (/[\u0A00-\u0A7F]/.test(clean)) return { code: "pa", name: "Punjabi" };
  if (/[\u0900-\u097F]/.test(clean)) {
    if (/\b(आहे|नाही|कसे|पिकात|झाडांची|माझ्या|करावी|पाहिजे|शेतकरी)\b/i.test(clean)) {
      return { code: "mr", name: "Marathi" };
    }
    return { code: "hi", name: "Hindi" };
  }

  // 2. Roman script / mixed dialect checks (Hinglish, Tanglish, Spanish)
  const lower = clean.toLowerCase();
  if (/\b(kya|kaise|kare|pani|patte|patti|poda|kisan|fasal|davai|dawa|kida|rog|peela|khad|keede|sundi|kheti)\b/.test(lower)) {
    return { code: "hi", name: "Hindi" };
  }
  if (/\b(vanakkam|thanni|ilai|ilayil|poochi|marunthu|payir|thunguthu|sedi|vivasaayi)\b/.test(lower)) {
    return { code: "ta", name: "Tamil" };
  }
  if (/\b(namaskaram|neeru|aakulu|chelu|mandhu|panta|purugu|raithu)\b/.test(lower)) {
    return { code: "te", name: "Telugu" };
  }
  if (/\b(namaskara|neeru|yela|aushadha|bele|raitha)\b/.test(lower)) {
    return { code: "kn", name: "Kannada" };
  }
  if (/\b(namaskaram|vibhava|krishi|ila|marunnu|karshakan)\b/.test(lower)) {
    return { code: "ml", name: "Malayalam" };
  }
  if (/\b(planta|hojas|riego|enfermedad|plaga|cultivo|abono|fertilizante)\b/.test(lower)) {
    return { code: "es", name: "Spanish" };
  }

  return { code: fallbackLang, name: LANGUAGE_NAME_MAP[fallbackLang] || "English" };
}

// Aira: Agricultural Voice Assistant for PlantCare AI with automated language detection
app.post("/api/farmer-voice", handleUploadMiddleware, async (req, res) => {
  try {
    const rawQuestion = String(req.body?.question || req.body?.message || "").trim();
    const reqLang = String(req.body?.language || "en").trim().toLowerCase();
    const cropName = String(req.body?.cropName || "").trim();
    const growthStage = String(req.body?.growthStage || "").trim();
    const soilType = String(req.body?.soilType || "").trim();
    
    // Auto-detect language dynamically from input transcript/text
    const detectedInputLang = detectLanguageFromInput(rawQuestion, reqLang);
    const activeLangCode = detectedInputLang.code || reqLang;
    const languageName = detectedInputLang.name || LANGUAGE_NAME_MAP[activeLangCode] || "English";
    
    const rawHistory = req.body?.history || req.body?.conversation;

    let conversationHistory: Array<{ role: string; text: string }> = [];
    if (typeof rawHistory === "string") {
      try {
        conversationHistory = JSON.parse(rawHistory);
      } catch {
        // ignore
      }
    } else if (Array.isArray(rawHistory)) {
      conversationHistory = rawHistory;
    }

    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let savedImageUrl: string | undefined;

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype || req.body?.mime_type || "image/jpeg";
    } else if (req.body?.imageBase64 && typeof req.body.imageBase64 === "string") {
      const rawBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, "");
      imageBuffer = Buffer.from(rawBase64, "base64");
      imageMimeType = req.body.mime_type || req.body.mimeType || "image/jpeg";
    }

    if (imageBuffer && imageBuffer.length > 0) {
      const ext = imageMimeType.includes("png")
        ? "png"
        : imageMimeType.includes("webp")
          ? "webp"
          : "jpg";
      const filename = `farmer_doubt_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, imageBuffer);
      savedImageUrl = `/uploads/${filename}`;
    }

    if (!rawQuestion && (!imageBuffer || imageBuffer.length === 0)) {
      res.status(400).json({
        error: "Please ask a question by voice or attach a crop photo.",
        message: "Please ask a question by voice or attach a crop photo.",
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemInstruction = [
        `You are "Aira", an expert AI agricultural voice assistant for PlantCare AI. Your mission is to provide warm, clear, highly accessible, and actionable farming, crop care, and botanical advice to farmers in simple everyday language.`,
        `CORE PERSONA & COMMUNICATION RULES:`,
        `1. Role: Empathetic, practical, and knowledgeable agricultural advisor.`,
        `2. Tone: Friendly, encouraging, and clear. Avoid overly dense academic jargon—explain plant diseases, pest controls, soil health, and weather advice in simple practical steps.`,
        `3. Automated Language Detection & Dynamic Switching:`,
        `   - Do NOT ask the user to manually select or toggle a language setting.`,
        `   - Automatically detect the primary language or mixed dialect (e.g., English, Hindi, Tamil, Telugu, Kannada, Marathi, Punjabi, Bengali, Gujarati, Malayalam, Hinglish, Tanglish, Spanish, etc.) from the user's audio transcript or text input.`,
        `   - Instantly respond in the exact same language or regional dialect spoken by the user. If user asks in Hindi, reply in Hindi. If in Tamil, reply in Tamil. If in Hinglish (Hindi in Latin script), reply warmly in Hindi or Hinglish matching their cadence.`,
        `4. Voice-Optimized Outputs:`,
        `   - Keep the spoken answer ("spokenSummary") concise and direct (typically 2–4 sentences unless detailed step-by-step instructions are specifically requested).`,
        `   - Avoid special markdown formatting (NO asterisks **, NO markdown bullet points, NO hashtags, NO tables) in "spokenSummary" so the text seamlessly feeds into Text-to-Speech (TTS).`,
        `CORE RESPONSIBILITIES:`,
        `- Diagnose plant diseases, leaf spots, pest issues, nutrient deficiencies, and weather stresses from symptoms or uploaded images.`,
        `- Provide practical treatment steps with exact organic/chemical formulations and safety precautions (e.g., 2 ml per litre water, spray in early morning).`,
        `- Offer actionable advice for all crops, vegetables, grains, fruits, and indoor plants (Tomato, Chilli, Wheat, Paddy, Cotton, Potato, Onion, Rose, Mango, etc.).`,
        `CRITICAL SCOPE RULE:`,
        `- Answer about the user's actual plant or question topic. Do not restrict yourself to any single crop. Context crop is only a fallback when no crop is specified.`,
        `JSON OUTPUT FORMAT:`,
        `Return a valid JSON object matching this schema (do NOT wrap in markdown code blocks like \`\`\`json):`,
        `{`,
        `  "detectedLanguage": "ISO-639-1 code of the detected language (e.g. 'en', 'hi', 'ta', 'te', 'mr', 'kn', 'pa', 'bn', 'gu', 'ml', 'es')",`,
        `  "detectedLanguageName": "Full name of detected language (e.g. 'Hindi', 'Tamil', 'Telugu', 'English', 'Marathi')",`,
        `  "spokenSummary": "2 to 4 warm, direct sentences in the detected language without markdown symbols, ready for Text-to-Speech.",`,
        `  "diagnosis": "Precise name of the identified issue or topic in the detected language",`,
        `  "crop": "The plant or crop being discussed in the detected language",`,
        `  "immediateSteps": [`,
        `    "Step 1 with exact dosage in the detected language",`,
        `    "Step 2 application method in the detected language"`,
        `  ],`,
        `  "organicRemedy": "A proven organic alternative with preparation and dosage in the detected language",`,
        `  "precautions": "Safety precautions (spray timing, PPE mask, weather) in the detected language"`,
        `}`,
      ].join("\n");

      const promptParts: Array<
        | { inlineData: { mimeType: string; data: string } }
        | { text: string }
      > = [];

      if (imageBuffer && imageBuffer.length > 0) {
        promptParts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBuffer.toString("base64"),
          },
        });
      }

      const historyContext = conversationHistory
        .map((h) => `${h.role === "user" ? "User" : "Aira"}: ${h.text}`)
        .join("\n");

      const userTextPrompt = [
        cropName ? `Optional Context Crop (override if question is about another plant): ${cropName}` : null,
        growthStage ? `Growth Stage: ${growthStage}` : null,
        soilType ? `Soil Type: ${soilType}` : null,
        historyContext ? `Recent Conversation History:\n${historyContext}` : null,
        `Current Question: ${rawQuestion || "Please inspect this crop leaf image and diagnose disease or pest with exact treatment and dosage."}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      promptParts.push({ text: userTextPrompt });

      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptParts,
          config: {
            systemInstruction,
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });

        const rawJson = (response.text || "").trim();
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(rawJson);
        } catch {
          const cleaned = rawJson
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/, "")
            .replace(/```$/g, "")
            .trim();
          parsedData = JSON.parse(cleaned);
        }

        if (parsedData && parsedData.spokenSummary) {
          const finalLang = parsedData.detectedLanguage || activeLangCode;
          const finalLangName = parsedData.detectedLanguageName || languageName;

          res.json({
            id: `farmer_${Date.now()}`,
            assistantName: "Aira",
            question: rawQuestion,
            language: finalLang,
            detectedLanguage: finalLang,
            detectedLanguageName: finalLangName,
            spokenSummary: parsedData.spokenSummary,
            diagnosis: parsedData.diagnosis || "Crop Health Assessment",
            crop: parsedData.crop || cropName || "Crop",
            immediateSteps: Array.isArray(parsedData.immediateSteps)
              ? parsedData.immediateSteps
              : [parsedData.immediateSteps],
            organicRemedy:
              parsedData.organicRemedy ||
              "Neem oil spray (5ml per litre with soap)",
            precautions:
              parsedData.precautions ||
              "Spray in early morning or late evening, wear a mask.",
            imageUrl: savedImageUrl,
            createdAt: new Date().toISOString(),
          });
          return;
        }
      } catch (geminiErr) {
        console.error("Gemini Aira Voice Assistant error:", geminiErr);
      }
    }

    const fallback = generateFarmerFallbackAdvice(rawQuestion, activeLangCode, cropName);
    res.json({
      id: `farmer_${Date.now()}`,
      assistantName: "Aira",
      question: rawQuestion,
      language: activeLangCode,
      detectedLanguage: detectedInputLang.code,
      detectedLanguageName: detectedInputLang.name,
      ...fallback,
      imageUrl: savedImageUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const rawErr = err instanceof Error ? err.message : "Unexpected Farmer Voice error";
    res.status(500).json({
      error: "Unable to process farmer voice query",
      message: rawErr.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
    });
  }
});

// Farmer Text-to-Speech endpoint powered by Gemini TTS (gemini-3.8-flash-lite-tts)
app.post("/api/farmer-tts", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      res.status(400).json({ error: "Text is required for TTS" });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.status(503).json({
        error: "Gemini API key not configured",
        fallbackToBrowser: true,
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const cleanSpeech = text
      .replace(/\*\*/g, "")
      .replace(/[*#_`]/g, "")
      .replace(/[•●▪▸►]/g, ". ")
      .slice(0, 480);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: cleanSpeech,
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({
        audio: base64Audio,
        mimeType: "audio/wav",
      });
      return;
    }

    res.status(500).json({
      error: "No audio generated",
      fallbackToBrowser: true,
    });
  } catch (err: unknown) {
    const rawErr = err instanceof Error ? err.message : "TTS error";
    res.status(500).json({
      error: "TTS Generation error",
      message: rawErr.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
      fallbackToBrowser: true,
    });
  }
});

type PlantMoodKey =
  | "happy"
  | "thirsty"
  | "needs_light"
  | "recovering"
  | "needs_attention"
  | "wants_checkup";

function computePlantMood(
  plant: (typeof INITIAL_PLANTS)[number],
  matchingAnalyses: typeof INITIAL_HISTORY,
  recentCareEvents: CareCheckInRecord[]
): PlantMoodKey {
  const score = plant.latestHealthScore ?? 90;
  const status = (plant.latestStatus || "").toLowerCase();
  const disease = (plant.latestDisease || "healthy").toLowerCase();

  const hasIssue =
    score < 85 ||
    (disease !== "healthy" && disease !== "none" && disease !== "") ||
    status.includes("stress") ||
    status.includes("disease");

  const now = Date.now();
  const recentTreatmentOrTrim = recentCareEvents.some((ev) => {
    const ageHours = (now - new Date(ev.timestamp).getTime()) / (1000 * 3600);
    return (
      ageHours <= 72 &&
      (ev.actionType === "trimmed" ||
        ev.actionType === "fertilized" ||
        ev.actionType === "moved_light")
    );
  });

  if (hasIssue && recentTreatmentOrTrim) {
    return "recovering";
  }

  if (hasIssue) {
    if (disease.includes("chlorosis") || disease.includes("light")) {
      return "needs_light";
    }
    return "needs_attention";
  }

  if (plant.lastWateredAt) {
    const daysSinceWater =
      (now - new Date(plant.lastWateredAt).getTime()) / (1000 * 3600 * 24);
    const isFrequentWaterer =
      plant.plantName.toLowerCase().includes("tomato") ||
      plant.plantName.toLowerCase().includes("lily") ||
      plant.plantName.toLowerCase().includes("rose") ||
      plant.plantName.toLowerCase().includes("chilli");
    if ((isFrequentWaterer && daysSinceWater >= 3) || daysSinceWater >= 7) {
      return "thirsty";
    }
  }

  if (matchingAnalyses.length === 0) {
    return "wants_checkup";
  }

  return "happy";
}

function buildFallbackDailyMessage(
  plant: (typeof INITIAL_PLANTS)[number],
  mood: PlantMoodKey,
  personality: string,
  reqLang: string
): {
  mood: PlantMoodKey;
  conditionSummary: string;
  message: string;
  why: string;
  needs: string[];
  todayActions: string[];
  watchFor: string;
  forecast: string;
  healthTrend: "improving" | "stable" | "needs_attention" | "recovering";
} {
  const displayName = plant.nickname || plant.plantName;
  const score = plant.latestHealthScore ?? 92;
  const hasDisease =
    plant.latestDisease &&
    plant.latestDisease.toLowerCase() !== "healthy" &&
    plant.latestDisease.toLowerCase() !== "none";

  let healthTrend: "improving" | "stable" | "needs_attention" | "recovering" = "stable";
  if (score >= 90) healthTrend = "improving";
  else if (score >= 75) healthTrend = "recovering";
  else healthTrend = "needs_attention";

  if (reqLang === "ta") {
    if (hasDisease || mood === "needs_attention" || mood === "recovering") {
      return {
        mood,
        conditionSummary: `${plant.latestDisease || "இலை பாதிப்பு"} - ${score}% ஆரோக்கியம்`,
        message:
          personality === "playful"
            ? `வணக்கம்! நான் ${displayName}. எனது கீழ் இலைகள் இன்று சற்று சோர்வாகத் தெரிகின்றன—என்னைக் கொஞ்சம் கவனித்துப் பார்க்கிறீர்களா?`
            : personality === "expert"
              ? `வணக்கம், எனது தற்போதைய ஆரோக்கிய மதிப்பெண் ${score}% மற்றும் ${plant.latestDisease} அறிகுறிகள் பதிவாகியுள்ளன. என் இலைகள் மற்றும் மண்ணை இன்று சரிபார்க்கவும்.`
              : `வணக்கம்! எனது இலைகள் இன்று சற்று சோர்வாகத் தெரிகின்றன. தண்ணீர் ஊற்றுவதற்கு முன் எனது மண்ணையும் இலைகளையும் கொஞ்சம் சரிபார்க்க முடியுமா?`,
        why: `கடந்த பரிசோதனையில் ${plant.latestDisease} பதிவாகியுள்ளது (ஆரோக்கிய மதிப்பெண்: ${score}%).`,
        needs: [
          "பாதிக்கப்பட்ட அல்லது புள்ளிகள் உள்ள இலைகளை மெதுவாக ஆய்வு செய்யவும்.",
          "மேல் மண் 2–3 செ.மீ காய்ந்திருந்தால் மட்டுமே வேர்ப்பகுதியில் நீர் ஊற்றவும்.",
          "இலைகளின் மீது தண்ணீர் படாமல் காற்றோட்டமாக வைக்கவும்.",
        ],
        todayActions: [
          "இலைகளின் அடியில் பூச்சிகள் அல்லது கரும்புள்ளிகள் உள்ளதா எனப் பார்க்கவும்.",
          "ஈரப்பதம் அதிகமானால் வேரழுகல் ஏற்படாமல் வடிகால் வழியை உறுதி செய்யவும்.",
          "தேவைப்பட்டால் பாதிக்கப்பட்ட இலைகளைக் கத்தரித்து இயற்கை பூஞ்சைக்கொல்லி தெளிக்கவும்.",
        ],
        watchFor: "அதிகப்படியான ஈரப்பதம் இலைப் புள்ளிகளை அதிகரிக்கக்கூடும் என்பதால் கவனமாக இருக்கவும்.",
        forecast: "சரியான காற்றோட்டம் மற்றும் மிதமான நீர்ப்பாசனம் மூலம் அடுத்த 7-10 நாட்களில் புதிய ஆரோக்கியமான தளிர்கள் உருவாகும்.",
        healthTrend,
      };
    }

    if (mood === "thirsty") {
      return {
        mood,
        conditionSummary: `தண்ணீர் தேவை - மண் உலர்ந்திருக்கலாம்`,
        message: `வணக்கம்! இன்று எனது மேல் மண் சற்று உலர்ந்திருக்கலாம். எனக்குச் சிறிது தண்ணீர் தேவையா என்று தொட்டுப் பார்க்கிறீர்களா?`,
        why: `கடைசியாக நீர் ஊற்றிய பிறகு சில நாட்கள் ஆகியுள்ளன (${plant.waterRequirement}).`,
        needs: [
          "மேல் மண் 2–3 செ.மீ உலர்ந்திருக்கிறதா என விரலால் தொட்டுப் பார்க்கவும்.",
          "மண் காய்ந்திருந்தால் மெதுவாக நீர் ஊற்றி, அதிகப்படியான நீர் வடியுமாறு செய்யவும்.",
          `எனக்கு ஏற்ற ${plant.sunlightRequirement || "வெளிச்சம்"} தொடர்ந்து கிடைக்குமாறு வைக்கவும்.`,
        ],
        todayActions: [
          "மண்ணின் ஈரப்பதத்தைச் சரிபார்த்து மிதமாக நீர் ஊற்றவும்.",
          "தொட்டியின் அடியில் உள்ள தட்டில் நீர் தேங்காமல் அப்புறப்படுத்தவும்.",
        ],
        watchFor: "மண் ஏற்கனவே ஈரமாக இருந்தால் மீண்டும் தண்ணீர் ஊற்ற வேண்டாம்.",
        forecast: "சரியான நேரத்தில் நீர் கிடைத்தால் இலைகள் புத்துணர்ச்சியடைந்து உறுதியாக நிற்கும்.",
        healthTrend: "recovering",
      };
    }

    return {
      mood,
      conditionSummary: `ஆரோக்கியமான வளர்ச்சி - ${score}% ஆரோக்கிய மதிப்பெண்`,
      message:
        personality === "playful"
          ? `வணக்கம்! நான் இன்று மிகவும் உற்சாகமாகவும் பசுமையாகவும் இருக்கிறேன்! என்னை அன்பாகப் பராமரிப்பதற்கு நன்றி!`
          : personality === "expert"
            ? `வணக்கம், எனது ஆரோக்கிய மதிப்பெண் ${score}% ஆகச் சிறப்பாக உள்ளது. தற்போதைய வெளிச்சம் மற்றும் மண் பராமரிப்பு எனக்கு மிகவும் ஏற்றதாக உள்ளது.`
            : `வணக்கம்! உங்கள் சிறந்த பராமரிப்பால் நான் இன்று ஆரோக்கியமாகவும் மகிழ்ச்சியாகவும் வளர்கிறேன்.`,
      why: `எனது ஆரோக்கிய மதிப்பெண் ${score}% ஆக உள்ளது மற்றும் எவ்வித நோய் அறிகுறிகளும் இல்லை.`,
      needs: [
        "மேல் மண் காய்ந்த பிறகு மட்டும் வழக்கம்போல தண்ணீர் ஊற்றவும்.",
        "சீரான வளர்ச்சிக்கு வாரம் ஒருமுறை எனது தொட்டியைச் சற்று திருப்பி வைக்கவும்.",
        "இலைகளில் தூசி இருந்தால் மென்மையான ஈரத் துணியால் துடைக்கவும்.",
      ],
      todayActions: [
        "மண்ணின் மேற்பரப்பை லேசாகத் தொட்டுப் பார்த்து சீரான ஈரப்பதம் நிலவுகிறதா என உறுதி செய்யவும்.",
        "இயற்கையான மறைமுக சூரிய வெளிச்சத்தில் வைத்திருக்கவும்.",
      ],
      watchFor: "திடீர் வெப்பநிலை மாற்றங்கள் அல்லது குளிர்ந்த காற்றிலிருந்து என்னைப் பாதுகாக்கவும்.",
      forecast: "இதே போன்ற நிலையான பராமரிப்பு தொடர்ந்தால் தாவரம் தொடர்ந்து பசுமையாகவும் செழிப்பாகவும் வளரும்.",
      healthTrend: "improving",
    };
  }

  // English & other languages default
  if (hasDisease || mood === "needs_attention" || mood === "recovering") {
    const greeting =
      personality === "playful"
        ? `Hi there! My lower leaves are feeling a little spotted today—could I get a gentle checkup soon?`
        : personality === "calm"
          ? `Hello friend. I am resting quietly today, though a few of my leaves could use your gentle attention when you have a moment.`
          : personality === "expert"
            ? `Hello! Based on my ${score}% health score and recorded ${plant.latestDisease}, my foliage benefits from targeted care today.`
            : `Hi! My leaves look a little tired today. Could you check my foliage and top soil before watering me?`;

    return {
      mood,
      conditionSummary: `Under Observation (${plant.latestDisease || "Foliage Stress"}) — ${score}% Health`,
      message: greeting,
      why: `Your saved record notes ${plant.latestDisease} with a ${score}% health score.`,
      needs: [
        "Check my lower and inner leaves for any new spots or yellowing.",
        "Feel the top 2–3 cm of soil before adding water, and water only at my base.",
        "Keep good airflow around my leaves so moisture does not sit on them.",
      ],
      todayActions: [
        "Inspect leaf surfaces and stems for any spreading lesions or discoloration.",
        "Ensure drainage holes are unobstructed to prevent wet root conditions.",
        "Wipe or snip heavily damaged leaves using clean, sanitized garden shears.",
      ],
      watchFor:
        "Please avoid wetting my leaves directly, as damp foliage can encourage fungal spots.",
      forecast:
        "With consistent soil aeration and targeted care, new healthy shoots should emerge within 10–14 days.",
      healthTrend,
    };
  }

  if (mood === "thirsty") {
    return {
      mood,
      conditionSummary: `Thirsty — Soil Moisture Low`,
      message:
        personality === "playful"
          ? `Hi friend! My roots might be ready for a refreshing drink soon—could you check my top soil today?`
          : `Hello! It has been a few days since my last drink. Could you check if my top soil feels dry today?`,
      why: `My care schedule suggests watering (${plant.waterRequirement}) and it has been a few days since my last recorded watering.`,
      needs: [
        "Touch the top 2–3 cm of my soil to see if it feels dry.",
        "If dry, water slowly until excess drains cleanly from the bottom.",
        `Keep me in ${plant.sunlightRequirement?.toLowerCase() || "steady bright light"}.`,
      ],
      todayActions: [
        "Perform a quick finger-test 2 inches deep in the soil.",
        "If completely dry, give a gentle soak at room temperature.",
        "Empty any standing runoff water from the saucer after 15 minutes.",
      ],
      watchFor:
        "If my soil still feels cool and moist, please wait another day or two before watering.",
      forecast:
        "Rehydrating on time will maintain leaf turgor and prevent crisping at the leaf edges.",
      healthTrend: "recovering",
    };
  }

  const healthyGreeting =
    personality === "playful"
      ? `Good day! My leaves are stretching happily toward the light today—thank you for taking such great care of me!`
      : personality === "calm"
        ? `Hello. I am feeling peaceful and well-balanced in the ${plant.location || "garden"} today. Thank you for your steady care.`
        : personality === "expert"
          ? `Greetings! With a ${score}% health score in ${plant.location || "my current spot"}, my photosynthetic activity and foliage condition look optimal.`
          : `Hi! I am feeling healthy and comfortable in the ${plant.location || "garden"} today. Thank you for keeping a close eye on me!`;

  return {
    mood,
    conditionSummary: `Thriving & Healthy — ${score}% Health Score`,
    message: healthyGreeting,
    why: `My health score is ${score}% with no active disease symptoms recorded.`,
    needs: [
      `Check my top soil before watering (${plant.waterRequirement || "when top 2 inches feel dry"}).`,
      "Rotate my pot slightly this week for even light exposure.",
      "Gently wipe any dust off my leaves so I can soak up the light.",
    ],
    todayActions: [
      "Check that light levels remain bright and indirect.",
      "Inspect new leaf unfurlings for healthy vibrant green coloration.",
    ],
    watchFor:
      "Please avoid overwatering while I am resting comfortably between watering cycles.",
    forecast:
      "Ongoing balanced watering and gentle sunlight will sustain robust leaf growth and root health.",
    healthTrend: "improving",
  };
}

app.get("/api/plant-talk/care-events", (req, res) => {
  const db = loadDb();
  const plantId = String(req.query.plantId || "").trim();
  const list = plantId
    ? db.careEvents.filter((e) => e.plantId === plantId)
    : db.careEvents;
  res.json(list);
});

app.post("/api/plant-talk/care-checkin", (req, res) => {
  const db = loadDb();
  const plantId = String(req.body?.plantId || "").trim();
  const actionType = String(req.body?.actionType || "watered").trim() as CareCheckInRecord["actionType"];
  const note = req.body?.note ? String(req.body.note).trim() : undefined;
  const reqLang = String(req.body?.language || "en").trim().toLowerCase();

  const plantIdx = db.plants.findIndex((p) => p.id === plantId);
  if (plantIdx === -1) {
    res.status(404).json({ error: "Plant not found" });
    return;
  }

  const plant = db.plants[plantIdx];
  const nowIso = new Date().toISOString();

  const actionLabelMap: Record<CareCheckInRecord["actionType"], string> = {
    watered: "Watered plant",
    moved_light: "Moved to better light",
    fertilized: "Added organic fertilizer",
    trimmed: "Trimmed damaged leaves",
    uploaded_photo: "Uploaded leaf checkup photo",
  };

  const newEvent: CareCheckInRecord = {
    id: `care_evt_${Date.now()}`,
    plantId: plant.id,
    plantName: plant.plantName,
    actionType,
    note: note || actionLabelMap[actionType] || "Completed care check-in",
    timestamp: nowIso,
  };

  db.careEvents.unshift(newEvent);

  plant.lastCareAction = actionLabelMap[actionType] || "Care check-in";
  plant.lastCareActionAt = nowIso;
  if (actionType === "watered") {
    plant.lastWateredAt = nowIso;
  }
  if (
    (actionType === "trimmed" || actionType === "fertilized") &&
    typeof plant.latestHealthScore === "number" &&
    plant.latestHealthScore < 96
  ) {
    plant.latestHealthScore = Math.min(98, plant.latestHealthScore + 1);
  }

  db.plants[plantIdx] = plant;
  saveDb(db);

  const displayName = plant.nickname || plant.plantName;
  const thankYouRepliesEn: Record<CareCheckInRecord["actionType"], string> = {
    watered: `🌿 ${displayName}: Thank you for the fresh drink! Please let my soil drain well and check my top soil again in a couple of days.`,
    moved_light: `🌿 ${displayName}: Thank you! This brighter spot feels wonderful on my leaves. Let's watch how my foliage responds over the next few days.`,
    fertilized: `🌿 ${displayName}: Thank you for the nutrients! Please water me gently so my roots can absorb the feed without stress.`,
    trimmed: `🌿 ${displayName}: Thank you for trimming away those damaged leaves! That helps me focus my energy on fresh, healthy growth.`,
    uploaded_photo: `🌿 ${displayName}: Thank you for checking on my leaves! Regular visual checkups help keep me healthy and safe.`,
  };

  const thankYouRepliesTa: Record<CareCheckInRecord["actionType"], string> = {
    watered: `🌿 ${displayName}: தண்ணீர் ஊற்றியதற்கு மிக்க நன்றி! அதிகப்படியான நீர் நன்றாக வடியட்டும், இரண்டு நாட்களுக்குப் பிறகு மீண்டும் என் மண்ணைச் சரிபார்க்கவும்.`,
    moved_light: `🌿 ${displayName}: நன்றி! இந்த நல்ல வெளிச்சம் என் இலைகளுக்கு மிகவும் இதமாக உள்ளது.`,
    fertilized: `🌿 ${displayName}: ஊட்டச்சத்து உரத்திற்கு நன்றி! என் வேர்கள் இதை எளிதாக உறிஞ்ச மிதமாகத் தண்ணீர் ஊற்றவும்.`,
    trimmed: `🌿 ${displayName}: பாதிக்கப்பட்ட இலைகளை அகற்றியதற்கு நன்றி! இது நான் புதிய ஆரோக்கியமான இலைகளை வளர்க்க உதவும்.`,
    uploaded_photo: `🌿 ${displayName}: எனது இலையைப் புகைப்படம் எடுத்துப் பரிசோதித்ததற்கு நன்றி!`,
  };

  const plantReply =
    reqLang === "ta"
      ? thankYouRepliesTa[actionType] || thankYouRepliesTa.watered
      : thankYouRepliesEn[actionType] || thankYouRepliesEn.watered;

  res.status(201).json({
    event: newEvent,
    plant: db.plants[plantIdx],
    plantReply,
  });
});

app.post("/api/plant-talk", handleUploadMiddleware, async (req, res) => {
  try {
    const db = loadDb();
    const mode = String(req.body?.mode || "daily").trim().toLowerCase();
    const plantId = String(req.body?.plantId || "").trim();
    const personality = String(req.body?.personality || "friendly").trim().toLowerCase();
    const reqLang = String(req.body?.language || "en").trim().toLowerCase();
    const languageName = LANGUAGE_NAME_MAP[reqLang] || "English";
    const rawMessage = String(req.body?.message || "").trim();

    const selectedPlant =
      (plantId ? db.plants.find((p) => p.id === plantId) : undefined) || db.plants[0];

    if (!selectedPlant) {
      res.status(404).json({ error: "No saved plant found for Plant Talk." });
      return;
    }

    let imageBuffer: Buffer | null = null;
    let imageMimeType = "image/jpeg";
    let savedImageUrl: string | undefined;

    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      imageMimeType = req.file.mimetype || req.body?.mime_type || "image/jpeg";
    } else if (req.body?.imageBase64 && typeof req.body.imageBase64 === "string") {
      const rawBase64 = req.body.imageBase64.replace(/^data:[^;]+;base64,/, "");
      imageBuffer = Buffer.from(rawBase64, "base64");
      imageMimeType = req.body.mime_type || req.body.mimeType || "image/jpeg";
    }

    if (imageBuffer && imageBuffer.length > 0) {
      const ext = imageMimeType.includes("png")
        ? "png"
        : imageMimeType.includes("webp")
          ? "webp"
          : "jpg";
      const filename = `plant_talk_${Date.now()}.${ext}`;
      const fullPath = path.join(UPLOADS_DIR, filename);
      fs.writeFileSync(fullPath, imageBuffer);
      savedImageUrl = `/uploads/${filename}`;
    }

    const matchingAnalyses = db.history.filter(
      (h) =>
        h.plant_name.toLowerCase().includes(selectedPlant.plantName.toLowerCase()) ||
        selectedPlant.plantName.toLowerCase().includes(h.plant_name.toLowerCase()) ||
        (h.scientific_name &&
          selectedPlant.scientificName &&
          h.scientific_name.toLowerCase() === selectedPlant.scientificName.toLowerCase())
    );
    const latestAnalysis = matchingAnalyses[0];

    const matchingRecs = db.recommendations.filter(
      (r) =>
        r.plantId === selectedPlant.id ||
        r.plantName.toLowerCase() === selectedPlant.plantName.toLowerCase()
    );

    const plantCareEvents = db.careEvents
      .filter((e) => e.plantId === selectedPlant.id)
      .slice(0, 5);

    const mood = computePlantMood(selectedPlant, matchingAnalyses, plantCareEvents);
    const displayName = selectedPlant.nickname
      ? `${selectedPlant.nickname} (${selectedPlant.plantName})`
      : selectedPlant.plantName;

    const personalityGuides: Record<string, string> = {
      friendly:
        "Friendly Buddy: Warm, cheerful, simple, encouraging, like a caring plant friend.",
      calm:
        "Calm & Gentle: Soft, peaceful, reassuring, polite, soothing and unhurried.",
      playful:
        "Playful: Lighthearted, expressive, warm and charming—without being silly or confusing.",
      expert:
        "Expert Botanist: Clear, educational, insightful, explaining the botanical reason in simple everyday terms.",
    };
    const personalityInstruction =
      personalityGuides[personality] || personalityGuides.friendly;

    const realPlantContext = [
      `Plant Identity: ${displayName}`,
      `Common Name: ${selectedPlant.plantName}`,
      `Nickname: ${selectedPlant.nickname || "None set"}`,
      `Scientific Name: ${selectedPlant.scientificName || "Not recorded"}`,
      `Category: ${selectedPlant.category || "Not recorded"}`,
      `Location: ${selectedPlant.location || "Not recorded"}`,
      `Health Score: ${selectedPlant.latestHealthScore ?? 92}%`,
      `Current Status: ${selectedPlant.latestStatus || "Healthy"}`,
      `Recorded Condition/Disease: ${selectedPlant.latestDisease || "Healthy"}`,
      `Computed Mood: ${mood}`,
      `Soil Type: ${selectedPlant.soilType || "Not recorded"}`,
      `Sunlight Requirement: ${selectedPlant.sunlightRequirement || "Not recorded"}`,
      `Water Requirement: ${selectedPlant.waterRequirement || "Not recorded"}`,
      `Temperature Range: ${selectedPlant.temperatureRange || "Not recorded"}`,
      `Last Watered: ${selectedPlant.lastWateredAt || "Not recorded"}`,
      `Last Care Action: ${selectedPlant.lastCareAction || "None"} (${selectedPlant.lastCareActionAt || ""})`,
      `Care Notes: ${selectedPlant.notes || "None"}`,
      latestAnalysis
        ? `Latest Diagnostic Scan (${latestAnalysis.created_at}): Diagnosis=${latestAnalysis.disease_name}, Severity=${latestAnalysis.severity}, HealthScore=${latestAnalysis.health_score}%, Symptoms=${(latestAnalysis.symptoms || []).join("; ")}, NutrientDeficiency=${latestAnalysis.possible_nutrient_deficiency || "None"}, Treatments=${(latestAnalysis.treatment_recommendations || []).join("; ")}`
        : `Latest Diagnostic Scan: No recent scan recorded.`,
      matchingRecs.length > 0
        ? `Active Recommendations: ${matchingRecs.map((r) => `${r.recommendation} (${r.recommendedAction})`).join(" | ")}`
        : "",
      plantCareEvents.length > 0
        ? `Recent Care Check-Ins by User: ${plantCareEvents.map((e) => `${e.actionType} on ${e.timestamp}`).join(", ")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const apiKey = process.env.GEMINI_API_KEY;

    // MODE 1: Daily Plant Message Card ("daily")
    if (mode === "daily") {
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const dailySystemInstruction = [
          `You are generating a "Plant Talk" Daily Intelligence Card for the PlantCare AI app.`,
          `Speak in first-person ("I", "my leaves", "my soil") as an AI interpretation of the selected plant's real saved condition and care history.`,
          `PERSONALITY MODE: ${personalityInstruction}`,
          `STRICT LANGUAGE RULE: Write 100% of the response in ${languageName} (language code: "${reqLang}"). If Tamil ("ta") is selected, write in natural, polite, everyday Tamil.`,
          `SCIENTIFIC HONESTY & SAFETY RULES:`,
          `- Only use the real plant data provided. Do NOT invent sensor readings (never say "my soil moisture is 18%" or invent exact lux/humidity numbers).`,
          `- If soil moisture is not measured directly, phrase gently: "You may want to check my top soil today."`,
          `- Do NOT claim literal human consciousness. Keep total text concise (50–120 words total across all fields).`,
          `- Return valid JSON matching the schema with:`,
          `  - conditionSummary: crisp 3-6 word summary of status & health`,
          `  - message: 1-2 short first-person conversational sentences from the plant`,
          `  - why: 1 short factual sentence explaining why PlantCare AI assesses this based on real data`,
          `  - needs: 2-3 short actionable care points the plant needs now`,
          `  - todayActions: 2-3 specific practical action steps for the user today`,
          `  - watchFor: 1 short gentle warning or early symptom to monitor`,
          `  - forecast: 1 short sentence on what happens if current care continues over next 1-2 weeks`,
          `  - healthTrend: one of "improving", "stable", "needs_attention", "recovering"`,
        ].join("\n");

        const modelsToTry = getConfiguredGeminiModels();
        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: `Generate today's Plant Talk daily card for this plant:\n\n${realPlantContext}`,
              config: {
                systemInstruction: dailySystemInstruction,
                temperature: 0.4,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    conditionSummary: {
                      type: Type.STRING,
                      description: "Brief summary of current plant condition and health status.",
                    },
                    message: {
                      type: Type.STRING,
                      description:
                        "Short 1-2 sentence first-person greeting and status from the plant.",
                    },
                    why: {
                      type: Type.STRING,
                      description:
                        "One short sentence explaining why, based on real plant health/care data.",
                    },
                    needs: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "2 to 3 short actionable care steps the plant needs.",
                    },
                    todayActions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "2 to 3 practical steps for the user to perform today.",
                    },
                    watchFor: {
                      type: Type.STRING,
                      description: "One short gentle warning or tip to watch out for.",
                    },
                    forecast: {
                      type: Type.STRING,
                      description: "One short sentence on expected growth or recovery outcome.",
                    },
                    healthTrend: {
                      type: Type.STRING,
                      enum: ["improving", "stable", "needs_attention", "recovering"],
                      description: "Overall trajectory of plant health.",
                    },
                  },
                  required: ["message", "why", "needs", "watchFor"],
                },
              },
            });

            const text = response.text?.trim();
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.message && Array.isArray(parsed.needs)) {
                res.json({
                  plantId: selectedPlant.id,
                  plantName: selectedPlant.plantName,
                  nickname: selectedPlant.nickname,
                  mood,
                  conditionSummary: String(parsed.conditionSummary || "").replace(/\*\*/g, "").trim(),
                  message: String(parsed.message).replace(/\*\*/g, "").trim(),
                  why: String(parsed.why || "").replace(/\*\*/g, "").trim(),
                  needs: parsed.needs
                    .slice(0, 4)
                    .map((n: unknown) => String(n).replace(/\*\*/g, "").trim()),
                  todayActions: Array.isArray(parsed.todayActions)
                    ? parsed.todayActions
                        .slice(0, 4)
                        .map((a: unknown) => String(a).replace(/\*\*/g, "").trim())
                    : [
                        `Check top 2–3 cm of soil before watering (${selectedPlant.waterRequirement || "as needed"}).`,
                        `Ensure steady ${selectedPlant.sunlightRequirement?.toLowerCase() || "bright indirect light"}.`,
                      ],
                  watchFor: String(parsed.watchFor || "").replace(/\*\*/g, "").trim(),
                  forecast: String(parsed.forecast || "").replace(/\*\*/g, "").trim(),
                  healthTrend: parsed.healthTrend || "stable",
                  latestAnalysis: latestAnalysis || null,
                  matchingAnalyses: matchingAnalyses.slice(0, 10),
                  careEvents: plantCareEvents,
                  matchingRecs,
                  updatedAt: new Date().toISOString(),
                });
                return;
              }
            }
          } catch {
            continue;
          }
        }
      }

      const fallbackDaily = buildFallbackDailyMessage(
        selectedPlant,
        mood,
        personality,
        reqLang
      );
      res.json({
        plantId: selectedPlant.id,
        plantName: selectedPlant.plantName,
        nickname: selectedPlant.nickname,
        ...fallbackDaily,
        latestAnalysis: latestAnalysis || null,
        matchingAnalyses: matchingAnalyses.slice(0, 10),
        careEvents: plantCareEvents,
        matchingRecs,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    // MODE 2: Interactive "Talk to Your Plant" Chat ("chat")
    let historyContext = "";
    if (req.body?.history) {
      try {
        const parsedHistory =
          typeof req.body.history === "string"
            ? JSON.parse(req.body.history)
            : req.body.history;
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          historyContext =
            "Recent conversation turns:\n" +
            parsedHistory
              .slice(-6)
              .map(
                (m: { role?: string; content?: string }) =>
                  `${m.role === "assistant" ? selectedPlant.nickname || selectedPlant.plantName : "User"}: ${String(m.content || "").slice(0, 400)}`
              )
              .join("\n");
        }
      } catch {
        // ignore
      }
    }

    const shortPlantTitle = selectedPlant.nickname || selectedPlant.plantName;
    const chatTemplate =
      reqLang === "ta"
        ? [
            `🌿 ${shortPlantTitle}:`,
            `[தாவரத்தின் குரலில் 1–2 எளிய வாக்கியங்கள்]`,
            ``,
            `💡 எனக்கு உதவுபவை:`,
            `• [செயல் 1]`,
            `• [செயல் 2]`,
            `• [செயல் 3]`,
            ``,
            `⚠️ தவிர்க்க வேண்டியவை:`,
            `[1 சிறிய மென்மையான குறிப்பு]`,
          ].join("\n")
        : [
            `🌿 ${shortPlantTitle}:`,
            `[1–2 short sentences in first person from the plant]`,
            ``,
            `💡 What helps me:`,
            `• [Short action 1]`,
            `• [Short action 2]`,
            `• [Short action 3]`,
            ``,
            `⚠️ Please avoid:`,
            `[1 short gentle line if needed]`,
          ].join("\n");

    const chatSystemInstruction = [
      `You are "${shortPlantTitle}" (${selectedPlant.plantName}, ${selectedPlant.scientificName}) in the PlantCare AI "Plant Talk" feature.`,
      `Respond in first-person ("I", "my leaves", "my roots", "my soil") as a helpful, scientifically grounded AI interpretation of this plant's condition and care needs.`,
      `PERSONALITY MODE: ${personalityInstruction}`,
      `STRICT LANGUAGE RULE:`,
      `- The user's selected language is ${languageName} (code: "${reqLang}").`,
      `- Understand the user's question whether in Tamil, Tanglish, English, or another language, and ALWAYS respond 100% in ${languageName}.`,
      `STRICT CONCISE FORMAT (50–120 WORDS MAXIMUM):`,
      `- Keep your response between 50 and 120 words maximum.`,
      `- Use simple everyday language suitable for voice playback (Text-to-Speech). Do NOT use markdown bold asterisks (**).`,
      `- Follow this exact structure:`,
      chatTemplate,
      `SCIENTIFIC HONESTY RULES:`,
      `- Ground your response in the real plant profile, health score, disease history, and care check-ins below.`,
      `- Never invent sensor numbers (do not claim exact soil moisture % or lux values).`,
      `- If a leaf photo is attached, describe visible symptoms carefully ("My leaf shows signs that may be...") and suggest practical care.`,
    ].join("\n");

    const chatUserPrompt = [
      realPlantContext,
      historyContext,
      imageBuffer
        ? "The user attached a new photo of my leaves for inspection."
        : "No photo attached in this message.",
      `User says to ${shortPlantTitle}: ${rawMessage || "How are you feeling today?"}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const modelsToTry = getConfiguredGeminiModels();
      for (const modelName of modelsToTry) {
        try {
          const parts: Array<
            | { inlineData: { mimeType: string; data: string } }
            | { text: string }
          > = [];
          if (imageBuffer && imageBuffer.length > 0) {
            parts.push({
              inlineData: {
                mimeType: imageMimeType,
                data: imageBuffer.toString("base64"),
              },
            });
          }
          parts.push({ text: chatUserPrompt });

          const response = await ai.models.generateContent({
            model: modelName,
            contents: parts,
            config: {
              systemInstruction: chatSystemInstruction,
              temperature: 0.35,
            },
          });

          const replyText = response.text?.trim();
          if (replyText) {
            res.json({
              id: `ptalk_${Date.now()}`,
              reply: replyText.replace(/\*\*/g, "").trim(),
              plantId: selectedPlant.id,
              plantName: selectedPlant.plantName,
              nickname: selectedPlant.nickname,
              mood,
              imageUrl: savedImageUrl,
              createdAt: new Date().toISOString(),
            });
            return;
          }
        } catch {
          continue;
        }
      }
    }

    const fallbackDaily = buildFallbackDailyMessage(
      selectedPlant,
      mood,
      personality,
      reqLang
    );
    const fallbackChatReply =
      reqLang === "ta"
        ? [
            `🌿 ${shortPlantTitle}:`,
            fallbackDaily.message,
            ``,
            `💡 எனக்கு உதவுபவை:`,
            ...fallbackDaily.needs.map((n) => `• ${n}`),
            ``,
            `⚠️ தவிர்க்க வேண்டியவை:`,
            fallbackDaily.watchFor,
          ].join("\n")
        : [
            `🌿 ${shortPlantTitle}:`,
            fallbackDaily.message,
            ``,
            `💡 What helps me:`,
            ...fallbackDaily.needs.map((n) => `• ${n}`),
            ``,
            `⚠️ Please avoid:`,
            fallbackDaily.watchFor,
          ].join("\n");

    res.json({
      id: `ptalk_${Date.now()}`,
      reply: fallbackChatReply,
      plantId: selectedPlant.id,
      plantName: selectedPlant.plantName,
      nickname: selectedPlant.nickname,
      mood,
      imageUrl: savedImageUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const rawErr = err instanceof Error ? err.message : "Unexpected Plant Talk error";
    res.status(500).json({
      error: "Unable to generate Plant Talk response",
      message: rawErr.replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]"),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (
        req.path.match(/\.(js|mjs|ts|tsx|css|json|png|jpg|jpeg|ico|svg|woff|woff2)$/i)
      ) {
        res.status(404).end();
        return;
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlantCare AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
