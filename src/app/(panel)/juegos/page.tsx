import { getGames } from "@/lib/data/games";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { GamesCatalog } from "@/components/games/GamesCatalog";

export const dynamic = "force-dynamic";

export default async function JuegosPage() {
  let games: Awaited<ReturnType<typeof getGames>> = [];
  let error: string | null = null;
  try {
    games = await getGames();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Juegos"
        description="Estado general de las experiencias disponibles en el tótem. Entrá a cada juego para editar su contenido, diseño y reglas."
      />
      {error ? (
        <SetupNotice error={error} />
      ) : (
        <GamesCatalog games={games} />
      )}
    </>
  );
}
