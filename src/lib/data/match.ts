import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";

export type MatchPairView = {
  id: string;
  text: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  active: boolean;
};

export type MatchConfigView = {
  pairs: MatchPairView[];
};

export async function getMatchConfig(): Promise<MatchConfigView> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("match_pairs")
    .select(
      "id,text,image_asset_id,active,sort_order, image:media_assets!match_pairs_image_asset_id_fkey(public_url,bucket,path,fallback_src)",
    )
    .eq("game_id", "match")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    pairs: (data ?? []).map((row) => {
      const image = one(
        (row as { image: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] }).image,
      );

      return {
        id: row.id,
        text: row.text,
        image_asset_id: row.image_asset_id,
        imageUrl: assetUrl(image),
        active: row.active,
      };
    }),
  };
}
