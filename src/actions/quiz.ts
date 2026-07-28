"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/supabase/admin";
import { quizConfigSchema } from "@/lib/validation/quiz";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function saveQuizConfig(input: unknown): Promise<ActionResult> {
  const parsed = quizConfigSchema.safeParse(input);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
  }

  const { questions } = parsed.data;
  const supabase = getAdminClient();

  try {
    const { data: existingQuestions, error: existingQuestionsError } = await supabase
      .from("quiz_questions")
      .select("id")
      .eq("game_id", "quiz");
    if (existingQuestionsError) {
      throw existingQuestionsError;
    }

    const submittedIds = new Set(questions.map((question) => question.id));
    const toDelete = (existingQuestions ?? []).map((question) => question.id).filter((id) => !submittedIds.has(id));
    if (toDelete.length > 0) {
      const { error } = await supabase.from("quiz_questions").delete().in("id", toDelete);
      if (error) {
        throw error;
      }
    }

    if (questions.length > 0) {
      const rows = questions.map((question, index) => {
        const isMultipleChoice = question.type === "multiple_choice";

        return {
          id: question.id,
          game_id: "quiz",
          question: question.question,
          image_asset_id: question.image_asset_id,
          image_alt: question.image_alt,
          question_type: question.type,
          correct_answer: question.correct,
          options: isMultipleChoice ? question.options : null,
          correct_option_index: isMultipleChoice ? question.correct_option_index : null,
          active: question.active,
          sort_order: index,
        };
      });

      const { error } = await supabase.from("quiz_questions").upsert(rows);
      if (error) {
        throw error;
      }
    }

    revalidatePath("/quiz");
    revalidatePath("/");
    return ok();
  } catch (error) {
    return fail(toMessage(error));
  }
}
