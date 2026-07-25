import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";

import type { GameThemeOverride } from "@/lib/validation/themeEngine";
import { normalizeGameThemeOverride } from "@/lib/theme";

export type GameEditView = {
  id: string;
  name: string;
  title: string;
  description: string;
  cta_label: string;
  visible: boolean;
  enabled: boolean;
  maintenance_mode: boolean;
  maintenance_title: string | null;
  maintenance_text: string | null;
  sort_order: number;
  accent_color: string | null;
  cover_asset_id: string | null;
  coverUrl: string | null;
  theme_config: GameThemeOverride;
};

type CoverEmbed = {
  public_url: string | null;
  bucket: string | null;
  path: string | null;
  fallback_src: string | null;
} | null;

export async function getGames(): Promise<GameEditView[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("games")
    .select(
      "id,name,title,description,cta_label,visible,enabled,maintenance_mode,maintenance_title,maintenance_text,sort_order,accent_color,cover_asset_id,theme_config, cover:media_assets!games_cover_asset_id_fkey(public_url,bucket,path,fallback_src)",
    )
    .order("sort_order", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const cover = (row as { cover: CoverEmbed }).cover;
    return {
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      cta_label: row.cta_label,
      visible: row.visible,
      enabled: row.enabled,
      maintenance_mode: row.maintenance_mode,
      maintenance_title: row.maintenance_title,
      maintenance_text: row.maintenance_text,
      sort_order: row.sort_order,
      accent_color: row.accent_color,
      cover_asset_id: row.cover_asset_id,
      coverUrl: assetUrl(cover),
      theme_config: normalizeGameThemeOverride(row.theme_config),
    } satisfies GameEditView;
  });
}
