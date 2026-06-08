import { getGames } from "@/lib/data/games";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { GameEditorCard } from "@/components/games/GameEditorCard";

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
        description="Mostrá u ocultá cada juego en la pantalla principal y editá su portada y textos."
      />
      {error ? (
        <SetupNotice error={error} />
      ) : (
        <div className="space-y-4">
          {games.map((game) => (
            <GameEditorCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </>
  );
}
