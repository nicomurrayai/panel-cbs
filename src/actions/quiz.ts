"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { quizConfigSchema } from "@/lib/validation/quiz";
import { slugify, uniqueSlug } from "@/lib/slug";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveQuizConfig(input: unknown): Promise<ActionResult> {
  const parsed = quizConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Configuración inválida.");
  }

  const { settings, categories, questions } = parsed.data;
  const supabase = getAdminClient();

  try {
    // 1) Ajustes generales.
    const { error: settingsError } = await supabase
      .from("quiz_settings")
      .upsert({ game_id: "quiz", ...settings });
    if (settingsError) throw settingsError;

    // 2) Categorías (slugs únicos).
    const { data: existingCats } = await supabase
      .from("quiz_categories")
      .select("id")
      .eq("game_id", "quiz");
    const submittedCatIds = new Set(categories.map((c) => c.id));
    const catsToDelete = (existingCats ?? [])
      .map((c) => c.id)
      .filter((id) => !submittedCatIds.has(id));
    if (catsToDelete.length) {
      const { error } = await supabase
        .from("quiz_categories")
        .delete()
        .in("id", catsToDelete);
      if (error) throw error;
    }

    if (categories.length) {
      const takenSlugs = new Set<string>();
      const catRows = categories.map((c, idx) => ({
        id: c.id,
        game_id: "quiz",
        slug: uniqueSlug(c.slug.trim() || slugify(c.name), takenSlugs),
        name: c.name,
        active: c.active,
        sort_order: idx,
      }));
      const { error } = await supabase.from("quiz_categories").upsert(catRows);
      if (error) throw error;
    }

    // 3) Preguntas (anular categorías inexistentes).
    const validCatIds = new Set(categories.map((c) => c.id));
    const { data: existingQs } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("game_id", "quiz");
    const submittedQIds = new Set(questions.map((q) => q.id));
    const qsToDelete = (existingQs ?? [])
      .map((q) => q.id)
      .filter((id) => !submittedQIds.has(id));
    if (qsToDelete.length) {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .in("id", qsToDelete);
      if (error) throw error;
    }

    if (questions.length) {
      const qRows = questions.map((q, idx) => ({
        id: q.id,
        game_id: "quiz",
        question: q.question,
        image_asset_id: q.image_asset_id,
        image_alt: q.image_alt,
        difficulty: q.difficulty,
        time_limit_seconds: q.time_limit_seconds,
        category_id:
          q.category_id && validCatIds.has(q.category_id) ? q.category_id : null,
        active: q.active,
        sort_order: idx,
      }));
      const { error } = await supabase.from("quiz_questions").upsert(qRows);
      if (error) throw error;

      // 4) Respuestas Verdadero/Falso (regeneradas en cada guardado).
      for (const q of questions) {
        const { error: delError } = await supabase
          .from("quiz_answers")
          .delete()
          .eq("question_id", q.id);
        if (delError) throw delError;

        const { error: insError } = await supabase.from("quiz_answers").insert([
          {
            question_id: q.id,
            label: "Verdadero",
            answer_value: "true",
            is_correct: q.correct === true,
            active: true,
            sort_order: 0,
          },
          {
            question_id: q.id,
            label: "Falso",
            answer_value: "false",
            is_correct: q.correct === false,
            active: true,
            sort_order: 1,
          },
        ]);
        if (insError) throw insError;
      }
    }

    revalidatePath("/quiz");
    revalidatePath("/");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}
