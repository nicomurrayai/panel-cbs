"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { memoryConfigSchema } from "@/lib/validation/memory";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveMemoryConfig(input: unknown): Promise<ActionResult> {
  const parsed = memoryConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Configuración inválida.");
  }

  const { levelId, level, cards } = parsed.data;
  const supabase = getAdminClient();

  try {
    // Preservar otras claves de config y guardar maxAttempts.
    let existingConfig: Record<string, unknown> = {};
    if (levelId) {
      const { data } = await supabase
        .from("memory_levels")
        .select("config")
        .eq("id", levelId)
        .maybeSingle();
      existingConfig = (data?.config as Record<string, unknown>) ?? {};
    }

    const levelPayload = {
      game_id: "memory",
      key: "default",
      name: "Nivel principal",
      difficulty: level.difficulty,
      rows: level.rows,
      columns: level.columns,
      time_limit_seconds: level.time_limit_seconds,
      reveal_delay_ms: level.reveal_delay_ms,
      instruction_title: level.instruction_title,
      instruction_text: level.instruction_text,
      victory_title: level.victory_title,
      victory_text: level.victory_text,
      timeout_title: level.timeout_title,
      timeout_text: level.timeout_text,
      active: level.active,
      config: { ...existingConfig, maxAttempts: level.max_attempts },
    };

    // Crear o actualizar el nivel.
    let resolvedLevelId = levelId;
    if (levelId) {
      const { error } = await supabase
        .from("memory_levels")
        .update(levelPayload)
        .eq("id", levelId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("memory_levels")
        .insert(levelPayload)
        .select("id")
        .single();
      if (error) throw error;
      resolvedLevelId = data.id;
    }

    if (!resolvedLevelId) throw new Error("No se pudo resolver el nivel.");

    // Sincronizar cartas: borrar las quitadas, upsert del resto.
    const { data: existingCards } = await supabase
      .from("memory_card_faces")
      .select("id")
      .eq("level_id", resolvedLevelId);
    const submittedIds = new Set(cards.map((c) => c.id));
    const toDelete = (existingCards ?? [])
      .map((c) => c.id)
      .filter((id) => !submittedIds.has(id));
    if (toDelete.length) {
      const { error } = await supabase
        .from("memory_card_faces")
        .delete()
        .in("id", toDelete);
      if (error) throw error;
    }

    if (cards.length) {
      const rows = cards.map((c, idx) => ({
        id: c.id,
        level_id: resolvedLevelId,
        pair_key: c.pair_key,
        label: c.label || c.pair_key,
        asset_label: c.asset_label,
        asset_id: c.asset_id,
        accent_color: c.accent_color,
        active: c.active,
        sort_order: idx,
      }));
      const { error } = await supabase.from("memory_card_faces").upsert(rows);
      if (error) throw error;
    }

    revalidatePath("/memory");
    revalidatePath("/");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}
