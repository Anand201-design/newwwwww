import { safeLocalStorage } from "../utils/safeStorage";

export interface AssistantResponse {
  id: string;
  reply: string;
  plantId?: string;
  plantName?: string;
  imageUrl?: string;
  model?: string;
  createdAt: string;
}

export interface AssistantHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface DiagnosticResult {
  id: string;
  _id?: string;
  plant_name: string;
  scientific_name?: string;
  family?: string;
  disease_name: string;
  confidence_score: number;
  severity: "none" | "mild" | "moderate" | "severe" | string;
  overall_status: string;
  health_score: number;
  symptoms: string[];
  possible_nutrient_deficiency?: string;
  nutrient_deficiency_details?: string;
  treatment_recommendations: string[];
  prevention_recommendations: string[];
  image_path?: string;
  created_at?: string;
}

export interface PlantProfileItem {
  id: string;
  _id?: string;
  plantName: string;
  nickname?: string;
  scientificName: string;
  category?: string;
  location?: string;
  growthStage?: string;
  imageUrl?: string;
  soilType?: string;
  sunlightRequirement?: string;
  waterRequirement?: string;
  temperatureRange?: string;
  humidityPreference?: string;
  latestHealthScore?: number;
  latestStatus?: string;
  latestDisease?: string;
  notes?: string;
  lastWateredAt?: string;
  lastCareAction?: string;
  lastCareActionAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type PlantMoodKey =
  | "happy"
  | "thirsty"
  | "needs_light"
  | "recovering"
  | "needs_attention"
  | "wants_checkup";

export type PlantPersonalityMode = "friendly" | "calm" | "playful" | "expert";

export interface PlantTalkDailyMessage {
  plantId: string;
  plantName: string;
  nickname?: string;
  mood: PlantMoodKey;
  conditionSummary?: string;
  message: string;
  why: string;
  needs: string[];
  todayActions?: string[];
  watchFor: string;
  forecast?: string;
  healthTrend?: "improving" | "stable" | "needs_attention" | "recovering";
  latestAnalysis?: DiagnosticResult | null;
  matchingAnalyses?: DiagnosticResult[];
  careEvents?: CareCheckInRecord[];
  matchingRecs?: any[];
  updatedAt: string;
}

export interface PlantTalkChatResponse {
  id: string;
  reply: string;
  plantId: string;
  plantName: string;
  nickname?: string;
  mood: PlantMoodKey;
  imageUrl?: string;
  createdAt: string;
}

export interface CareCheckInRecord {
  id: string;
  plantId: string;
  plantName: string;
  actionType: "watered" | "moved_light" | "fertilized" | "trimmed" | "uploaded_photo";
  note?: string;
  timestamp: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read the selected image file."));
    reader.readAsDataURL(file);
  });
}

function formatApiErrorMessage(status: number, rawMessage?: string): string {
  const clean = (rawMessage || "").replace(/AIza[0-9A-Za-z-_]{30,}/g, "[REDACTED]").trim();
  if (status === 404) {
    return clean || "The requested AI diagnostic endpoint or model was not found (HTTP 404).";
  }
  if (status === 401 || status === 403) {
    return "AI service authentication or permission error. Please check the server API configuration.";
  }
  if (status === 429) {
    return "AI analysis quota or rate limit reached. Please wait a moment and try again.";
  }
  if (status === 413) {
    return "The uploaded image is too large. Please upload an image under 10 MB.";
  }
  if (status >= 500) {
    return clean || "The plant analysis service encountered a temporary server error. Please try again.";
  }
  return clean || "Failed to analyze plant image. Please try again.";
}

const CACHE_KEYS = {
  PLANTS: "plantcare_cached_plants",
  HISTORY: "plantcare_cached_history",
};

function readCached<T>(key: string, fallback: T): T {
  try {
    const raw = safeLocalStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCached<T>(key: string, data: T): void {
  try {
    safeLocalStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota exceeded
  }
}

export const plantService = {
  async getPlants(): Promise<PlantProfileItem[]> {
    try {
      const res = await fetch("/api/plants", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch plants");
      const data: PlantProfileItem[] = await res.json();
      writeCached(CACHE_KEYS.PLANTS, data);
      return data;
    } catch (err) {
      const cached = readCached<PlantProfileItem[]>(CACHE_KEYS.PLANTS, []);
      if (cached.length > 0) {
        return cached;
      }
      throw err;
    }
  },

  async getPlantById(id: string): Promise<PlantProfileItem> {
    try {
      const res = await fetch(`/api/plants/${id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch plant profile");
      return await res.json();
    } catch (err) {
      const cached = readCached<PlantProfileItem[]>(CACHE_KEYS.PLANTS, []);
      const found = cached.find((p) => p.id === id || p._id === id);
      if (found) return found;
      throw err;
    }
  },

  async createPlant(data: Partial<PlantProfileItem>): Promise<PlantProfileItem> {
    try {
      const res = await fetch("/api/plants", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create plant");
      const created: PlantProfileItem = await res.json();
      const current = readCached<PlantProfileItem[]>(CACHE_KEYS.PLANTS, []);
      writeCached(CACHE_KEYS.PLANTS, [created, ...current]);
      return created;
    } catch (err) {
      // Offline fallback: save locally
      const fallbackItem: PlantProfileItem = {
        id: `offline_${Date.now()}`,
        plantName: data.plantName || "My Plant",
        scientificName: data.scientificName || "Specimen",
        imageUrl: data.imageUrl,
        category: data.category || "Houseplant",
        location: data.location || "Indoor",
        latestHealthScore: data.latestHealthScore || 90,
        latestStatus: data.latestStatus || "Healthy",
        latestDisease: data.latestDisease || "Healthy",
        ...data,
      };
      const current = readCached<PlantProfileItem[]>(CACHE_KEYS.PLANTS, []);
      writeCached(CACHE_KEYS.PLANTS, [fallbackItem, ...current]);
      return fallbackItem;
    }
  },

  async updatePlant(
    id: string,
    data: Partial<PlantProfileItem>
  ): Promise<PlantProfileItem> {
    try {
      const res = await fetch(`/api/plants/${encodeURIComponent(id)}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update plant profile");
      const updated: PlantProfileItem = await res.json();
      const current = readCached<PlantProfileItem[]>(CACHE_KEYS.PLANTS, []);
      const index = current.findIndex((p) => p.id === id || p._id === id);
      if (index !== -1) {
        current[index] = { ...current[index], ...updated };
        writeCached(CACHE_KEYS.PLANTS, current);
      }
      return updated;
    } catch (err) {
      const current = readCached<PlantProfileItem[]>(CACHE_KEYS.PLANTS, []);
      const index = current.findIndex((p) => p.id === id || p._id === id);
      if (index !== -1) {
        current[index] = { ...current[index], ...data };
        writeCached(CACHE_KEYS.PLANTS, current);
        return current[index];
      }
      throw err;
    }
  },

  async getAnalysisHistory(): Promise<DiagnosticResult[]> {
    try {
      const res = await fetch("/api/history", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch analysis history");
      const data: DiagnosticResult[] = await res.json();
      writeCached(CACHE_KEYS.HISTORY, data);
      return data;
    } catch (err) {
      const cached = readCached<DiagnosticResult[]>(CACHE_KEYS.HISTORY, []);
      if (cached.length > 0) return cached;
      throw err;
    }
  },

  async getAnalysisById(id: string): Promise<DiagnosticResult> {
    try {
      const res = await fetch(`/api/results/${id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to fetch analysis report");
      return await res.json();
    } catch (err) {
      const cached = readCached<DiagnosticResult[]>(CACHE_KEYS.HISTORY, []);
      const found = cached.find((r) => r.id === id || r._id === id);
      if (found) return found;
      throw err;
    }
  },

  async deleteAnalysis(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(
        errData?.error || "Unable to delete this analysis. Please try again."
      );
    }
    const result = await res.json();
    const current = readCached<DiagnosticResult[]>(CACHE_KEYS.HISTORY, []);
    writeCached(
      CACHE_KEYS.HISTORY,
      current.filter((item) => item.id !== id && item._id !== id)
    );
    return result;
  },

  async analyzePlantImage(formData: FormData): Promise<DiagnosticResult> {
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          formatApiErrorMessage(res.status, data?.message || data?.error)
        );
      }
      if (!data || !data.id) {
        throw new Error("The server returned an empty analysis response. Please try again.");
      }
      return data;
    } catch (firstErr: unknown) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      const isNetworkFetchError =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("load failed");

      if (!isNetworkFetchError) {
        throw firstErr;
      }

      // Fallback: send JSON payload with base64-encoded image if multipart FormData fails over proxy
      try {
        const imageEntry = formData.get("image");
        let imageBase64: string | undefined;
        let filename: string | undefined;
        let mimeType = String(formData.get("mime_type") || "image/jpeg");

        if (imageEntry instanceof File) {
          imageBase64 = await fileToBase64(imageEntry);
          filename = imageEntry.name;
          mimeType = imageEntry.type || mimeType;
        }

        const jsonPayload = {
          imageBase64,
          filename,
          mime_type: mimeType,
          specimenPreset: formData.get("specimenPreset") || undefined,
          plant_id: formData.get("plant_id") || undefined,
          plant_hint: formData.get("plant_hint") || undefined,
          language: formData.get("language") || "en",
        };

        const retryRes = await fetch("/api/analyze", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonPayload),
        });

        const retryData = await retryRes.json().catch(() => null);
        if (!retryRes.ok) {
          throw new Error(
            formatApiErrorMessage(retryRes.status, retryData?.message || retryData?.error)
          );
        }
        if (!retryData || !retryData.id) {
          throw new Error("The server returned an invalid analysis result. Please try again.");
        }
        return retryData;
      } catch (retryErr: unknown) {
        const retryMsg = retryErr instanceof Error ? retryErr.message : String(retryErr);
        if (
          retryMsg.toLowerCase().includes("failed to fetch") ||
          retryMsg.toLowerCase().includes("networkerror")
        ) {
          throw new Error(
            "Unable to reach the PlantCare AI analysis server. Please check your connection and try again."
          );
        }
        throw retryErr;
      }
    }
  },

  async logSensorData(payload: {
    plantId: string;
    soilMoisture: number;
    soilPH: number;
    temperature: number;
    humidity: number;
  }): Promise<unknown> {
    const res = await fetch("/api/sensors", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to log conditions");
    return res.json();
  },

  async askPlantAssistant(params: {
    message: string;
    plantId?: string;
    language?: string;
    history?: AssistantHistoryTurn[];
    imageFile?: File | null;
  }): Promise<AssistantResponse> {
    const { message, plantId, language = "en", history = [], imageFile } = params;

    try {
      const formData = new FormData();
      formData.append("message", message);
      if (plantId) formData.append("plantId", plantId);
      formData.append("language", language);
      if (history.length > 0) {
        formData.append("history", JSON.stringify(history.slice(-6)));
      }
      if (imageFile) {
        formData.append("image", imageFile);
        formData.append("mime_type", imageFile.type || "image/jpeg");
      }

      const res = await fetch("/api/assistant", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          formatApiErrorMessage(res.status, data?.message || data?.error)
        );
      }
      if (!data || !data.reply) {
        throw new Error("The assistant returned an empty response. Please try again.");
      }
      return data;
    } catch (firstErr: unknown) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      const isNetworkFetchError =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("load failed");

      if (!isNetworkFetchError) {
        throw firstErr;
      }

      // Automatic JSON base64 fallback
      let imageBase64: string | undefined;
      let mimeType = "image/jpeg";
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
        mimeType = imageFile.type || mimeType;
      }

      const retryRes = await fetch("/api/assistant", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          plantId: plantId || undefined,
          language,
          history: history.slice(-6),
          imageBase64,
          mime_type: mimeType,
        }),
      });

      const retryData = await retryRes.json().catch(() => null);
      if (!retryRes.ok) {
        throw new Error(
          formatApiErrorMessage(retryRes.status, retryData?.message || retryData?.error)
        );
      }
      if (!retryData || !retryData.reply) {
        throw new Error("Unable to get a response from AI Plant Assistant. Please try again.");
      }
      return retryData;
    }
  },

  async getPlantTalkDailyMessage(params: {
    plantId: string;
    personality?: PlantPersonalityMode;
    language?: string;
  }): Promise<PlantTalkDailyMessage> {
    const res = await fetch("/api/plant-talk", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "daily",
        plantId: params.plantId,
        personality: params.personality || "friendly",
        language: params.language || "en",
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.message) {
      throw new Error(
        formatApiErrorMessage(res.status, data?.message || data?.error)
      );
    }
    return data;
  },

  async askPlantTalk(params: {
    plantId: string;
    message: string;
    personality?: PlantPersonalityMode;
    language?: string;
    history?: AssistantHistoryTurn[];
    imageFile?: File | null;
  }): Promise<PlantTalkChatResponse> {
    const {
      plantId,
      message,
      personality = "friendly",
      language = "en",
      history = [],
      imageFile,
    } = params;

    try {
      const formData = new FormData();
      formData.append("mode", "chat");
      formData.append("plantId", plantId);
      formData.append("message", message);
      formData.append("personality", personality);
      formData.append("language", language);
      if (history.length > 0) {
        formData.append("history", JSON.stringify(history.slice(-6)));
      }
      if (imageFile) {
        formData.append("image", imageFile);
        formData.append("mime_type", imageFile.type || "image/jpeg");
      }

      const res = await fetch("/api/plant-talk", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.reply) {
        throw new Error(
          formatApiErrorMessage(res.status, data?.message || data?.error)
        );
      }
      return data;
    } catch (firstErr: unknown) {
      const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
      const isNetworkFetchError =
        msg.toLowerCase().includes("failed to fetch") ||
        msg.toLowerCase().includes("networkerror") ||
        msg.toLowerCase().includes("load failed");

      if (!isNetworkFetchError) {
        throw firstErr;
      }

      let imageBase64: string | undefined;
      let mimeType = "image/jpeg";
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile);
        mimeType = imageFile.type || mimeType;
      }

      const retryRes = await fetch("/api/plant-talk", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          plantId,
          message,
          personality,
          language,
          history: history.slice(-6),
          imageBase64,
          mime_type: mimeType,
        }),
      });

      const retryData = await retryRes.json().catch(() => null);
      if (!retryRes.ok || !retryData || !retryData.reply) {
        throw new Error(
          formatApiErrorMessage(
            retryRes.status,
            retryData?.message || retryData?.error
          )
        );
      }
      return retryData;
    }
  },

  async getCareEvents(plantId?: string): Promise<CareCheckInRecord[]> {
    const query = plantId ? `?plantId=${encodeURIComponent(plantId)}` : "";
    const res = await fetch(`/api/plant-talk/care-events${query}`, {
      credentials: "same-origin",
    });
    if (!res.ok) return [];
    return res.json();
  },

  async logCareCheckIn(params: {
    plantId: string;
    actionType: CareCheckInRecord["actionType"];
    note?: string;
    language?: string;
  }): Promise<{
    event: CareCheckInRecord;
    plant: PlantProfileItem;
    plantReply: string;
  }> {
    const res = await fetch("/api/plant-talk/care-checkin", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      throw new Error(data?.error || "Failed to log care check-in");
    }
    return data;
  },
};
