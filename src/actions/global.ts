"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { globalSettingsSchema } from "@/lib/validation/global";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveGlobalSettings(
  input: unknown,
): Promise<ActionResult> {
  const parsed = globalSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  const data = parsed.data;
  const supabase = getAdminClient();

  try {
    const { data: existing } = await supabase
      .from("global_settings")
      .select("version")
      .eq("id", "default")
      .maybeSingle();

    const { error } = await supabase.from("global_settings").upsert({
      id: "default",
      version: existing?.version ?? new Date().toISOString().slice(0, 10),
      home_eyebrow: data.home_eyebrow,
      home_title: data.home_title,
      home_subtitle: data.home_subtitle,
      home_background_asset_id: data.home_background_asset_id,
      theme: data.theme,
      branding: data.branding,
    });
    if (error) throw error;

    revalidatePath("/global");
    revalidatePath("/");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}
