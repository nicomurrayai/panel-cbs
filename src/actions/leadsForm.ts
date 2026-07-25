"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { leadsFormSchema } from "@/lib/validation/leadsForm";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveLeadsForm(input: unknown): Promise<ActionResult> {
  const parsed = leadsFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("global_settings")
      .update({ leads_form: parsed.data })
      .eq("id", "default");
    if (error) throw error;

    revalidatePath("/leads");
    revalidatePath("/global");
    return ok();
  } catch (error) {
    return fail(toMessage(error));
  }
}
