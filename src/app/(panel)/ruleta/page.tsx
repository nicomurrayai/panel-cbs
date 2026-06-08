import { getRouletteConfig } from "@/lib/data/roulette";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { RouletteEditor } from "@/components/roulette/RouletteEditor";

export const dynamic = "force-dynamic";

export default async function RuletaPage() {
  let config: Awaited<ReturnType<typeof getRouletteConfig>> | null = null;
  let error: string | null = null;
  try {
    config = await getRouletteConfig();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Ruleta"
        description="Configurá premios, segmentos, probabilidades y colores. No se puede guardar una configuración inválida."
      />
      {error || !config ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <RouletteEditor config={config} />
      )}
    </>
  );
}
