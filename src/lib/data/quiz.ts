import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";
import type { QuizQuestionType } from "@/lib/validation/quiz";

export type QuizQuestionView = {
  id: string;
  question: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  image_alt: string;
  type: QuizQuestionType;
  correct: boolean;
  options: [string, string, string] | null;
  correct_option_index: 0 | 1 | 2 | null;
  active: boolean;
};

export type QuizConfigView = {
  questions: QuizQuestionView[];
};

function normalizeQuestionType(value: string | null | undefined): QuizQuestionType {
  return value === "multiple_choice" ? "multiple_choice" : "true_false";
}

function normalizeOptions(options: string[] | null): [string, string, string] | null {
  if (!options || options.length !== 3) {
    return null;
  }

  return [options[0] ?? "", options[1] ?? "", options[2] ?? ""];
}

function normalizeCorrectOptionIndex(value: number | null): 0 | 1 | 2 | null {
  if (value === 0 || value === 1 || value === 2) {
    return value;
  }

  return null;
}

export async function getQuizConfig(): Promise<QuizConfigView> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("quiz_questions")
    .select(
      "id,question,image_asset_id,image_alt,question_type,correct_answer,options,correct_option_index,active,sort_order, image:media_assets!quiz_questions_image_asset_id_fkey(public_url,bucket,path,fallback_src)",
    )
    .eq("game_id", "quiz")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return {
    questions: (data ?? []).map((row) => {
      const image = one(
        (row as { image: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] }).image,
      );
      const type = normalizeQuestionType(row.question_type);

      return {
        id: row.id,
        question: row.question,
        image_asset_id: row.image_asset_id,
        imageUrl: assetUrl(image),
        image_alt: row.image_alt,
        type,
        correct: row.correct_answer,
        options: type === "multiple_choice" ? normalizeOptions(row.options) : null,
        correct_option_index: type === "multiple_choice" ? normalizeCorrectOptionIndex(row.correct_option_index) : null,
        active: row.active,
      };
    }),
  };
}
