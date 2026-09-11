import { getRouletteConfig } from "@/lib/data/roulette";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { RouletteEditor } from "@/components/roulette/RouletteEditor";
import { getGames } from "@/lib/data/games";
import { GameWorkspace } from "@/components/games/GameWorkspace";

export const dynamic = "force-dynamic";

export default async function RuletaPage() {
  let config: Awaited<ReturnType<typeof getRouletteConfig>> | null = null;
  let game: Awaited<ReturnType<typeof getGames>>[number] | null = null;
  let error: string | null = null;
  try {
    const [nextConfig, games] = await Promise.all([getRouletteConfig(), getGames()]);
    config = nextConfig;
    game = games.find((item) => item.id === "roulette") ?? null;
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Ruleta"
        description="Configurá premios, segmentos, probabilidades y colores. No se puede guardar una configuración inválida."
      />
      {error || !config || !game ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <GameWorkspace
          game={game}
          screen="roulette"
          tabs={[
            { id: "general", label: "General" },
            { id: "design", label: "Diseño" },
            { id: "prizes", label: "Premios" },
            { id: "probability", label: "Probabilidad y stock" },
          ]}
        >
          <RouletteEditor config={config} />
        </GameWorkspace>
      )}
    </>
  );
}
