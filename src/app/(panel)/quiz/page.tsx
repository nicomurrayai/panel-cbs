import { getQuizConfig } from "@/lib/data/quiz";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { QuizEditor } from "@/components/quiz/QuizEditor";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  let config: Awaited<ReturnType<typeof getQuizConfig>> | null = null;
  let error: string | null = null;

  try {
    config = await getQuizConfig();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Quiz"
        description="Configura preguntas con enunciado, imagen opcional y una respuesta Verdadero o Falso."
      />
      {error || !config ? <SetupNotice error={error ?? "Sin datos"} /> : <QuizEditor config={config} />}
    </>
  );
}
