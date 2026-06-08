import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";

export type QuizQuestionView = {
  id: string;
  question: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  image_alt: string;
  correct: boolean;
  active: boolean;
};

export type QuizConfigView = {
  questions: QuizQuestionView[];
};

export async function getQuizConfig(): Promise<QuizConfigView> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("quiz_questions")
    .select(
      "id,question,image_asset_id,image_alt,correct_answer,active,sort_order, image:media_assets!quiz_questions_image_asset_id_fkey(public_url,bucket,path,fallback_src)",
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

      return {
        id: row.id,
        question: row.question,
        image_asset_id: row.image_asset_id,
        imageUrl: assetUrl(image),
        image_alt: row.image_alt,
        correct: row.correct_answer,
        active: row.active,
      };
    }),
  };
}
