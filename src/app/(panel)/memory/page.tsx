import { getMemoryConfig } from "@/lib/data/memory";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { MemoryEditor } from "@/components/memory/MemoryEditor";
import { getGames } from "@/lib/data/games";
import { GameWorkspace } from "@/components/games/GameWorkspace";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  let config: Awaited<ReturnType<typeof getMemoryConfig>> | null = null;
  let game: Awaited<ReturnType<typeof getGames>>[number] | null = null;
  let error: string | null = null;

  try {
    const [nextConfig, games] = await Promise.all([getMemoryConfig(), getGames()]);
    config = nextConfig;
    game = games.find((item) => item.id === "memory") ?? null;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Memory Card"
        description="Configura el tiempo, el reverso y la galeria de imagenes que el totem duplica para formar pares."
      />
      {error || !config || !game ? <SetupNotice error={error ?? "Sin datos"} /> : (
        <GameWorkspace
          game={game}
          screen="memory"
          tabs={[
            { id: "general", label: "General" },
            { id: "design", label: "Diseño" },
            { id: "cards", label: "Cartas" },
            { id: "rules", label: "Reglas" },
          ]}
        >
          <MemoryEditor config={config} />
        </GameWorkspace>
      )}
    </>
  );
}
