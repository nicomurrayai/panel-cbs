import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";

export type MemoryCardView = {
  id: string;
  pair_key: string;
  label: string;
  asset_label: string;
  asset_id: string | null;
  assetUrl: string | null;
  accent_color: string;
  active: boolean;
};

export type MemoryConfigView = {
  levelId: string | null;
  level: {
    difficulty: string;
    rows: number;
    columns: number;
    time_limit_seconds: number;
    reveal_delay_ms: number;
    max_attempts: number;
    instruction_title: string;
    instruction_text: string;
    victory_title: string;
    victory_text: string;
    timeout_title: string;
    timeout_text: string;
    active: boolean;
  };
  cards: MemoryCardView[];
};

const DEFAULT_LEVEL: MemoryConfigView["level"] = {
  difficulty: "normal",
  rows: 4,
  columns: 3,
  time_limit_seconds: 60,
  reveal_delay_ms: 650,
  max_attempts: 0,
  instruction_title: "",
  instruction_text: "",
  victory_title: "",
  victory_text: "",
  timeout_title: "",
  timeout_text: "",
  active: true,
};

export async function getMemoryConfig(): Promise<MemoryConfigView> {
  const supabase = getAdminClient();

  const { data: level, error: levelError } = await supabase
    .from("memory_levels")
    .select(
      "id,difficulty,rows,columns,time_limit_seconds,reveal_delay_ms,instruction_title,instruction_text,victory_title,victory_text,timeout_title,timeout_text,active,config",
    )
    .eq("game_id", "memory")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (levelError) throw levelError;

  if (!level) {
    return { levelId: null, level: DEFAULT_LEVEL, cards: [] };
  }

  const config = (level.config ?? {}) as { maxAttempts?: number };

  const { data: cards, error: cardsError } = await supabase
    .from("memory_card_faces")
    .select(
      "id,pair_key,label,asset_label,asset_id,accent_color,active,sort_order, asset:media_assets!memory_card_faces_asset_id_fkey(public_url,bucket,path,fallback_src)",
    )
    .eq("level_id", level.id)
    .order("sort_order", { ascending: true });

  if (cardsError) throw cardsError;

  return {
    levelId: level.id,
    level: {
      difficulty: level.difficulty,
      rows: level.rows,
      columns: level.columns,
      time_limit_seconds: level.time_limit_seconds,
      reveal_delay_ms: level.reveal_delay_ms,
      max_attempts: Number(config.maxAttempts ?? 0),
      instruction_title: level.instruction_title ?? "",
      instruction_text: level.instruction_text ?? "",
      victory_title: level.victory_title ?? "",
      victory_text: level.victory_text ?? "",
      timeout_title: level.timeout_title ?? "",
      timeout_text: level.timeout_text ?? "",
      active: level.active,
    },
    cards: (cards ?? []).map((row) => {
      const asset = one(
        (row as { asset: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] })
          .asset,
      );
      return {
        id: row.id,
        pair_key: row.pair_key,
        label: row.label,
        asset_label: row.asset_label,
        asset_id: row.asset_id,
        assetUrl: assetUrl(asset),
        accent_color: row.accent_color,
        active: row.active,
      };
    }),
  };
}
