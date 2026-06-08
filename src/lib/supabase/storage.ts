import "server-only";
import { STORAGE_BUCKET } from "./admin";
import type { Database } from "@/types/database.types";

type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];

/** Construye la URL pública de un objeto del bucket. */
export function publicUrl(
  path: string | null | undefined,
  bucket: string = STORAGE_BUCKET,
): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  if (!base) return null;
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}

/** Resuelve la mejor URL para una fila de media_assets. */
export function assetUrl(
  row: Pick<MediaRow, "public_url" | "bucket" | "path" | "fallback_src"> | null,
): string | null {
  if (!row) return null;
  if (row.public_url) return row.public_url;
  if (row.path) return publicUrl(row.path, row.bucket ?? STORAGE_BUCKET);
  return row.fallback_src ?? null;
}

/** Normaliza un nombre de archivo a slug seguro conservando la extensión. */
export function slugifyFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext =
    dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const raw = dot >= 0 ? name.slice(0, dot) : name;
  const base =
    raw
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "imagen";
  return ext ? `${base}.${ext}` : base;
}

/** Genera una ruta única dentro del bucket para subidas del panel. */
export function buildStoragePath(filename: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `panel/${Date.now().toString(36)}-${rand}-${slugifyFilename(filename)}`;
}
