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
  difficulty: string;
  time_limit_seconds: number | null;
  category_id: string | null;
  correct: boolean;
  active: boolean;
};

export type QuizCategoryView = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
};

export type QuizSettingsView = {
  instruction_title: string;
  correct_label: string;
  incorrect_label: string;
  correct_feedback: string;
  incorrect_feedback: string;
  loading_text: string;
  next_question_text: string;
  final_title: string;
  final_text: string;
  empty_title: string;
  empty_text: string;
  feedback_delay_ms: number;
  next_delay_ms: number;
};

export type QuizConfigView = {
  settings: QuizSettingsView;
  categories: QuizCategoryView[];
  questions: QuizQuestionView[];
};

const DEFAULT_SETTINGS: QuizSettingsView = {
  instruction_title: "",
  correct_label: "Correcto",
  incorrect_label: "Incorrecto",
  correct_feedback: "",
  incorrect_feedback: "",
  loading_text: "",
  next_question_text: "",
  final_title: "",
  final_text: "",
  empty_title: "",
  empty_text: "",
  feedback_delay_ms: 1100,
  next_delay_ms: 360,
};

export async function getQuizConfig(): Promise<QuizConfigView> {
  const supabase = getAdminClient();

  const [settingsRes, categoriesRes, questionsRes] = await Promise.all([
    supabase
      .from("quiz_settings")
      .select(
        "instruction_title,correct_label,incorrect_label,correct_feedback,incorrect_feedback,loading_text,next_question_text,final_title,final_text,empty_title,empty_text,feedback_delay_ms,next_delay_ms",
      )
      .eq("game_id", "quiz")
      .maybeSingle(),
    supabase
      .from("quiz_categories")
      .select("id,slug,name,active,sort_order")
      .eq("game_id", "quiz")
      .order("sort_order", { ascending: true }),
    supabase
      .from("quiz_questions")
      .select(
        "id,question,image_asset_id,image_alt,difficulty,time_limit_seconds,category_id,active,sort_order, image:media_assets!quiz_questions_image_asset_id_fkey(public_url,bucket,path,fallback_src), answers:quiz_answers(answer_value,is_correct)",
      )
      .eq("game_id", "quiz")
      .order("sort_order", { ascending: true }),
  ]);

  if (questionsRes.error) throw questionsRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  const settings = settingsRes.data
    ? { ...DEFAULT_SETTINGS, ...settingsRes.data }
    : DEFAULT_SETTINGS;

  const categories: QuizCategoryView[] = (categoriesRes.data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    active: c.active,
  }));

  const questions: QuizQuestionView[] = (questionsRes.data ?? []).map((row) => {
    const image = one(
      (row as { image: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] })
        .image,
    );
    const answers =
      (row as { answers: { answer_value: string; is_correct: boolean }[] }).answers ??
      [];
    const correctAnswer = answers.find((a) => a.is_correct);
    const correct = correctAnswer ? correctAnswer.answer_value === "true" : true;
    return {
      id: row.id,
      question: row.question,
      image_asset_id: row.image_asset_id,
      imageUrl: assetUrl(image),
      image_alt: row.image_alt,
      difficulty: row.difficulty,
      time_limit_seconds: row.time_limit_seconds,
      category_id: row.category_id,
      correct,
      active: row.active,
    };
  });

  return { settings, categories, questions };
}
