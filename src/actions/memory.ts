"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { memoryConfigSchema } from "@/lib/validation/memory";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveMemoryConfig(input: unknown): Promise<ActionResult> {
  const parsed = memoryConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
  }

  const { time_limit_seconds, player_mode, cards } = parsed.data;
  const supabase = getAdminClient();

  try {
    const { error: settingsError } = await supabase
      .from("memory_settings")
      .upsert({ game_id: "memory", time_limit_seconds, player_mode });
    if (settingsError) {
      throw settingsError;
    }

    const { data: existingCards, error: existingCardsError } = await supabase
      .from("memory_card_faces")
      .select("id")
      .eq("game_id", "memory");
    if (existingCardsError) {
      throw existingCardsError;
    }

    const submittedIds = new Set(cards.map((card) => card.id));
    const toDelete = (existingCards ?? []).map((card) => card.id).filter((id) => !submittedIds.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabase.from("memory_card_faces").delete().in("id", toDelete);
      if (error) {
        throw error;
      }
    }

    if (cards.length > 0) {
      const rows = cards.map((card, index) => ({
        id: card.id,
        game_id: "memory",
        asset_id: card.asset_id,
        active: card.active,
        sort_order: index,
      }));

      const { error } = await supabase.from("memory_card_faces").upsert(rows);
      if (error) {
        throw error;
      }
    }

    revalidatePath("/memory");
    revalidatePath("/");
    return ok();
  } catch (error) {
    return fail(toMessage(error));
  }
}
