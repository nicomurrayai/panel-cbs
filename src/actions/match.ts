"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { matchConfigSchema } from "@/lib/validation/match";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveMatchConfig(input: unknown): Promise<ActionResult> {
  const parsed = matchConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
  }

  const { pairs } = parsed.data;
  const supabase = getAdminClient();

  try {
    const { data: existingPairs, error: existingPairsError } = await supabase
      .from("match_pairs")
      .select("id")
      .eq("game_id", "match");
    if (existingPairsError) {
      throw existingPairsError;
    }

    const submittedIds = new Set(pairs.map((pair) => pair.id));
    const toDelete = (existingPairs ?? []).map((pair) => pair.id).filter((id) => !submittedIds.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabase.from("match_pairs").delete().in("id", toDelete);
      if (error) {
        throw error;
      }
    }

    if (pairs.length > 0) {
      const rows = pairs.map((pair, index) => ({
        id: pair.id,
        game_id: "match",
        text: pair.text,
        image_asset_id: pair.image_asset_id,
        active: pair.active,
        sort_order: index,
      }));

      const { error } = await supabase.from("match_pairs").upsert(rows);
      if (error) {
        throw error;
      }
    }

    revalidatePath("/match");
    revalidatePath("/");
    return ok();
  } catch (error) {
    return fail(toMessage(error));
  }
}
