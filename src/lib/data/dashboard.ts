import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";

export type GameSummary = {
  id: string;
  title: string;
  visible: boolean;
  enabled: boolean;
  maintenance_mode: boolean;
};

export type DashboardStats = {
  games: GameSummary[];
  visibleCount: number;
  hiddenCount: number;
  rouletteSegments: number;
  rouletteEnabled: number;
  memoryFaces: number;
  quizQuestions: number;
  quizActive: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getAdminClient();

  const [games, seg, segEnabled, faces, questions, questionsActive] =
    await Promise.all([
      supabase
        .from("games")
        .select("id,title,visible,enabled,maintenance_mode")
        .order("sort_order", { ascending: true }),
      supabase.from("roulette_segments").select("id", { count: "exact", head: true }),
      supabase
        .from("roulette_segments")
        .select("id", { count: "exact", head: true })
        .eq("enabled", true),
      supabase
        .from("memory_card_faces")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase.from("quiz_questions").select("id", { count: "exact", head: true }),
      supabase
        .from("quiz_questions")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
    ]);

  if (games.error) throw games.error;

  const list = (games.data ?? []) as GameSummary[];
  return {
    games: list,
    visibleCount: list.filter((g) => g.visible).length,
    hiddenCount: list.filter((g) => !g.visible).length,
    rouletteSegments: seg.count ?? 0,
    rouletteEnabled: segEnabled.count ?? 0,
    memoryFaces: faces.count ?? 0,
    quizQuestions: questions.count ?? 0,
    quizActive: questionsActive.count ?? 0,
  };
}
