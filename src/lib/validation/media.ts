export const IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const VIDEO_MAX_BYTES = 80 * 1024 * 1024; // 80 MB
export const FONT_MAX_BYTES = 4 * 1024 * 1024; // 4 MB
export const IMAGE_MAX_DIMENSION = 4096; // px
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;
export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const FONT_MIME_TYPES = [
  "font/woff2",
  "font/woff",
  "application/font-woff2",
  "application/octet-stream",
] as const;

export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_MIME_TYPES.join(",");
export const FONT_ACCEPT = ".woff2,.woff,font/woff2,font/woff";

export function isAllowedImageType(mime: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function isAllowedVideoType(mime: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}

export function isAllowedFontType(mime: string, fileName = ""): boolean {
  if ((FONT_MIME_TYPES as readonly string[]).includes(mime)) return true;
  return /\.woff2?$/i.test(fileName);
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Valida un archivo de imagen antes de subir. Devuelve un error o null. */
export function validateImageFile(
  file: { type: string; size: number },
  dims?: { width: number; height: number } | null,
): string | null {
  if (!isAllowedImageType(file.type)) {
    return "Formato no permitido. Usá PNG, JPG, WEBP o SVG.";
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return `La imagen supera el máximo de ${humanFileSize(IMAGE_MAX_BYTES)}.`;
  }
  if (dims && (dims.width > IMAGE_MAX_DIMENSION || dims.height > IMAGE_MAX_DIMENSION)) {
    return `Las dimensiones superan ${IMAGE_MAX_DIMENSION}px. Reducí la imagen.`;
  }
  return null;
}

export function validateVideoFile(file: { type: string; size: number }): string | null {
  if (!isAllowedVideoType(file.type)) {
    return "Formato de video no permitido. Usá MP4 o WEBM.";
  }
  if (file.size > VIDEO_MAX_BYTES) {
    return `El video supera el máximo de ${humanFileSize(VIDEO_MAX_BYTES)}.`;
  }
  return null;
}

export function validateFontFile(file: { type: string; size: number; name?: string }): string | null {
  if (!isAllowedFontType(file.type, file.name ?? "")) {
    return "Formato de fuente no permitido. Usá WOFF2.";
  }
  if (file.size > FONT_MAX_BYTES) {
    return `La fuente supera el máximo de ${humanFileSize(FONT_MAX_BYTES)}.`;
  }
  return null;
}
