import { getQuizConfig } from "@/lib/data/quiz";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { QuizEditor } from "@/components/quiz/QuizEditor";
import { getGames } from "@/lib/data/games";
import { GameWorkspace } from "@/components/games/GameWorkspace";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  let config: Awaited<ReturnType<typeof getQuizConfig>> | null = null;
  let game: Awaited<ReturnType<typeof getGames>>[number] | null = null;
  let error: string | null = null;

  try {
    const [nextConfig, games] = await Promise.all([getQuizConfig(), getGames()]);
    config = nextConfig;
    game = games.find((item) => item.id === "quiz") ?? null;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Quiz"
        description="Configura preguntas con enunciado, imagen opcional y modalidad Verdadero/Falso u opcion multiple."
      />
      {error || !config || !game ? <SetupNotice error={error ?? "Sin datos"} /> : (
        <GameWorkspace
          game={game}
          screen="quiz"
          tabs={[
            { id: "general", label: "General" },
            { id: "design", label: "Diseño" },
            { id: "questions", label: "Preguntas" },
          ]}
        >
          <QuizEditor config={config} />
        </GameWorkspace>
      )}
    </>
  );
}
