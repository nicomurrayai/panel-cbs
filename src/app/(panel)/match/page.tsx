import { getMatchConfig } from "@/lib/data/match";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { MatchEditor } from "@/components/match/MatchEditor";
import { getGames } from "@/lib/data/games";
import { GameWorkspace } from "@/components/games/GameWorkspace";

export const dynamic = "force-dynamic";

export default async function MatchPage() {
  let config: Awaited<ReturnType<typeof getMatchConfig>> | null = null;
  let game: Awaited<ReturnType<typeof getGames>>[number] | null = null;
  let error: string | null = null;

  try {
    const [nextConfig, games] = await Promise.all([getMatchConfig(), getGames()]);
    config = nextConfig;
    game = games.find((item) => item.id === "match") ?? null;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Relacionar"
        description="Configura pares de oraciones e imagenes. En el totem el usuario une cada oracion con su imagen correcta."
      />
      {error || !config || !game ? <SetupNotice error={error ?? "Sin datos"} /> : (
        <GameWorkspace
          game={game}
          screen="match"
          tabs={[
            { id: "general", label: "General" },
            { id: "design", label: "Diseño" },
            { id: "pairs", label: "Pares" },
          ]}
        >
          <MatchEditor config={config} />
        </GameWorkspace>
      )}
    </>
  );
}
