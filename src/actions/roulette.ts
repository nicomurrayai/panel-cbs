"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { rouletteConfigSchema } from "@/lib/validation/roulette";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";
import { normalizeGameThemeOverride } from "@/lib/theme";

export async function saveRouletteConfig(
  input: unknown,
): Promise<ActionResult> {
  const parsed = rouletteConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Configuración inválida.");
  }

  const { background_asset_id, settings, segments } = parsed.data;
  const supabase = getAdminClient();

  try {
    // 1) Fondo propio del juego, conservando el resto del tema configurado.
    const { data: game, error: gameReadError } = await supabase
      .from("games")
      .select("theme_config")
      .eq("id", "roulette")
      .single();
    if (gameReadError) throw gameReadError;

    const themeConfig = normalizeGameThemeOverride(game.theme_config);
    const { error: gameUpdateError } = await supabase
      .from("games")
      .update({
        theme_config: {
          ...themeConfig,
          backgroundAssetId: background_asset_id,
        },
      })
      .eq("id", "roulette");
    if (gameUpdateError) throw gameUpdateError;

    // 2) Ajustes generales de la ruleta.
    const { error: settingsError } = await supabase
      .from("roulette_settings")
      .upsert({ game_id: "roulette", ...settings });
    if (settingsError) throw settingsError;

    // 3) Borrar segmentos que ya no están en la lista.
    const { data: existing } = await supabase
      .from("roulette_segments")
      .select("id")
      .eq("game_id", "roulette");
    const submittedIds = new Set(segments.map((s) => s.id));
    const toDelete = (existing ?? [])
      .map((r) => r.id)
      .filter((id) => !submittedIds.has(id));
    if (toDelete.length) {
      const { error } = await supabase
        .from("roulette_segments")
        .delete()
        .in("id", toDelete);
      if (error) throw error;
    }

    // 4) Crear/actualizar segmentos (sort_order según el orden enviado).
    const rows = segments.map((s, idx) => ({
      id: s.id,
      game_id: "roulette",
      label: s.label,
      prize_type: s.prize_type,
      probability_weight: s.probability_weight,
      color: s.color,
      text_color: s.text_color,
      enabled: s.enabled,
      sort_order: idx,
      asset_id: s.asset_id,
      result_title: s.result_title,
      result_text: s.result_text,
      stock_managed: s.stock_managed,
    }));
    const { error: upsertError } = await supabase
      .from("roulette_segments")
      .upsert(rows);
    if (upsertError) throw upsertError;

    // 5) Inventario por segmento.
    for (const s of segments) {
      if (s.stock_managed && s.total_stock != null) {
        const { data: inv } = await supabase
          .from("roulette_prize_inventory")
          .select("remaining_stock")
          .eq("segment_id", s.id)
          .maybeSingle();
        const remaining = inv
          ? Math.min(inv.remaining_stock, s.total_stock)
          : s.total_stock;
        const { error } = await supabase
          .from("roulette_prize_inventory")
          .upsert({
            segment_id: s.id,
            total_stock: s.total_stock,
            remaining_stock: remaining,
          });
        if (error) throw error;
      } else {
        await supabase
          .from("roulette_prize_inventory")
          .delete()
          .eq("segment_id", s.id);
      }
    }

    revalidatePath("/ruleta");
    revalidatePath("/");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}
