"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { gameUpdateSchema } from "@/lib/validation/games";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function updateGame(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = gameUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const data = parsed.data;
  // Si no está en mantenimiento, limpiamos los textos para no dejar datos colgados.
  const patch = {
    ...data,
    maintenance_title: data.maintenance_mode ? data.maintenance_title : null,
    maintenance_text: data.maintenance_mode ? data.maintenance_text : null,
  };

  try {
    const supabase = getAdminClient();
    const { error } = await supabase.from("games").update(patch).eq("id", id);
    if (error) throw error;
    revalidatePath("/juegos");
    revalidatePath("/");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}

/** Atajo para el toggle de visibilidad desde la tabla. */
export async function setGameVisible(
  id: string,
  visible: boolean,
): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("games")
      .update({ visible })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/juegos");
    revalidatePath("/");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}
