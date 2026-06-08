import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";

export type RouletteSegmentView = {
  id: string;
  label: string;
  prize_type: "prize" | "thanks" | "retry";
  probability_weight: number;
  color: string;
  text_color: string;
  enabled: boolean;
  sort_order: number;
  asset_id: string | null;
  assetUrl: string | null;
  result_title: string | null;
  result_text: string | null;
  stock_managed: boolean;
  total_stock: number | null;
  remaining_stock: number | null;
};

export type RouletteSettingsView = {
  instruction_title: string;
  instruction_text: string;
  spin_label: string;
  winner_title: string;
  thanks_title: string;
  offline_title: string;
  offline_text: string;
  duration_ms: number;
  min_turns: number;
};

export type RouletteConfigView = {
  settings: RouletteSettingsView;
  segments: RouletteSegmentView[];
};

const DEFAULT_SETTINGS: RouletteSettingsView = {
  instruction_title: "",
  instruction_text: "",
  spin_label: "Girar",
  winner_title: "",
  thanks_title: "",
  offline_title: "",
  offline_text: "",
  duration_ms: 3800,
  min_turns: 5,
};

export async function getRouletteConfig(): Promise<RouletteConfigView> {
  const supabase = getAdminClient();

  const [settingsRes, segmentsRes] = await Promise.all([
    supabase
      .from("roulette_settings")
      .select(
        "instruction_title,instruction_text,spin_label,winner_title,thanks_title,offline_title,offline_text,duration_ms,min_turns",
      )
      .eq("game_id", "roulette")
      .maybeSingle(),
    supabase
      .from("roulette_segments")
      .select(
        "id,label,prize_type,probability_weight,color,text_color,enabled,sort_order,asset_id,result_title,result_text,stock_managed, asset:media_assets!roulette_segments_asset_id_fkey(public_url,bucket,path,fallback_src), inventory:roulette_prize_inventory(total_stock,remaining_stock)",
      )
      .eq("game_id", "roulette")
      .order("sort_order", { ascending: true }),
  ]);

  if (segmentsRes.error) throw segmentsRes.error;

  const settings = settingsRes.data
    ? { ...DEFAULT_SETTINGS, ...settingsRes.data }
    : DEFAULT_SETTINGS;

  const segments: RouletteSegmentView[] = (segmentsRes.data ?? []).map((row) => {
    const asset = one(
      (row as { asset: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] })
        .asset,
    );
    const inv = one(
      (row as { inventory: { total_stock: number; remaining_stock: number } | { total_stock: number; remaining_stock: number }[] | null }).inventory,
    );
    return {
      id: row.id,
      label: row.label,
      prize_type: row.prize_type as RouletteSegmentView["prize_type"],
      probability_weight: row.probability_weight,
      color: row.color,
      text_color: row.text_color,
      enabled: row.enabled,
      sort_order: row.sort_order,
      asset_id: row.asset_id,
      assetUrl: assetUrl(asset),
      result_title: row.result_title,
      result_text: row.result_text,
      stock_managed: row.stock_managed,
      total_stock: inv?.total_stock ?? null,
      remaining_stock: inv?.remaining_stock ?? null,
    };
  });

  return { settings, segments };
}
