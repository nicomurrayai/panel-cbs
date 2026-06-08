import { getMatchConfig } from "@/lib/data/match";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { MatchEditor } from "@/components/match/MatchEditor";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  let config: Awaited<ReturnType<typeof getMatchConfig>> | null = null;
  let error: string | null = null;

  try {
    config = await getMatchConfig();
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Relacionar"
        description="Configura pares de oraciones e imagenes. En el totem el usuario une cada oracion con su imagen correcta."
      />
      {error || !config ? <SetupNotice error={error ?? "Sin datos"} /> : <MatchEditor config={config} />}
    </>
  );
}
