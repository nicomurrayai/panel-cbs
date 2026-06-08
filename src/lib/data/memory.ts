import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";

export type MemoryCardView = {
  id: string;
  asset_id: string | null;
  assetUrl: string | null;
  active: boolean;
};

export type MemoryConfigView = {
  time_limit_seconds: number;
  cards: MemoryCardView[];
};

const DEFAULT_CONFIG: MemoryConfigView = {
  time_limit_seconds: 60,
  cards: [],
};

export async function getMemoryConfig(): Promise<MemoryConfigView> {
  const supabase = getAdminClient();

  const [settingsRes, cardsRes] = await Promise.all([
    supabase.from("memory_settings").select("time_limit_seconds").eq("game_id", "memory").maybeSingle(),
    supabase
      .from("memory_card_faces")
      .select(
        "id,asset_id,active,sort_order, asset:media_assets!memory_card_faces_asset_id_fkey(public_url,bucket,path,fallback_src)",
      )
      .eq("game_id", "memory")
      .order("sort_order", { ascending: true }),
  ]);

  if (settingsRes.error) {
    throw settingsRes.error;
  }

  if (cardsRes.error) {
    throw cardsRes.error;
  }

  return {
    time_limit_seconds: settingsRes.data?.time_limit_seconds ?? DEFAULT_CONFIG.time_limit_seconds,
    cards: (cardsRes.data ?? []).map((row) => {
      const asset = one(
        (row as { asset: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] }).asset,
      );

      return {
        id: row.id,
        asset_id: row.asset_id,
        assetUrl: assetUrl(asset),
        active: row.active,
      };
    }),
  };
}
