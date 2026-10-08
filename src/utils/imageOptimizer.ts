/**
 * Client-side image validation and optimization utility.
 * Compresses and scales high-resolution camera photos before transmission to ensure fast, reliable uploads.
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/bmp",
];

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

export function validateImageFile(file: File): ImageValidationResult {
  if (!file) {
    return { valid: false, error: "No image file provided." };
  }

  // Check file type
  const mime = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const hasValidExtension =
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".webp") ||
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    name.endsWith(".bmp");

  if (mime && !ALLOWED_MIME_TYPES.includes(mime) && !hasValidExtension) {
    return {
      valid: false,
      error: "Please upload a valid image file (JPEG, PNG, WebP, or HEIC).",
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: "Image size exceeds 15 MB. Please select a smaller photo or compress it.",
    };
  }

  return { valid: true };
}

export async function optimizeImageForAnalysis(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<File> {
  // If not in a browser environment with Canvas support or not an image, return original
  if (typeof window === "undefined" || !window.createImageBitmap && !window.Image) {
    return file;
  }

  // Small images under 800KB can be used directly without reprocessing
  if (file.size < 800 * 1024 && file.type === "image/jpeg") {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxWidth && height <= maxHeight && file.size < 1.5 * 1024 * 1024) {
          resolve(file);
          return;
        }

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const optimized = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(optimized);
          },
          "image/jpeg",
          quality
        );
      };
      img.src = String(e.target?.result || "");
    };
    reader.readAsDataURL(file);
  });
}
