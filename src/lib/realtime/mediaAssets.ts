"use client";

import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import type { Database } from "@/types/database.types";
import type { MediaAssetView } from "@/types/panel";

export type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];

export const MEDIA_ASSET_COLUMNS =
  "id,key,kind,bucket,path,public_url,fallback_src,alt_text,mime_type,width,height,active,updated_at";

export function mediaAssetToView(row: MediaAssetRow): MediaAssetView {
  return {
    id: row.id,
    key: row.key,
    path: row.path,
    url: assetUrl(row),
    alt: row.alt_text,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
  };
}

export function isVisibleImageAsset(row: Partial<MediaAssetRow>) {
  return row.kind === "image" && row.active !== false;
}

export async function fetchImageAssetRows() {
  const supabase = getBrowserClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select(MEDIA_ASSET_COLUMNS)
    .eq("kind", "image")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as MediaAssetRow[];
}

export async function fetchMediaAssetById(id: string | null | undefined) {
  if (!id) {
    return null;
  }

  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select(MEDIA_ASSET_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as MediaAssetRow | null) ?? null;
}
