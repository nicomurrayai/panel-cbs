export const IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const IMAGE_MAX_DIMENSION = 4096; // px
export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");

export function isAllowedImageType(mime: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
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
