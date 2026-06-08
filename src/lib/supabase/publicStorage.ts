import type { Database } from "@/types/database.types";

type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "game-assets";

export function publicUrl(path: string | null | undefined, bucket: string = STORAGE_BUCKET): string | null {
  if (!path) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return null;
  }

  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${clean}`;
}

export function assetUrl(
  row: Pick<MediaRow, "public_url" | "bucket" | "path" | "fallback_src"> | null | undefined,
): string | null {
  if (!row) {
    return null;
  }

  if (row.public_url) {
    return row.public_url;
  }

  if (row.path) {
    return publicUrl(row.path, row.bucket ?? STORAGE_BUCKET);
  }

  return row.fallback_src ?? null;
}
