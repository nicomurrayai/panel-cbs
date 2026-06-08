import { getGlobalSettings } from "@/lib/data/global";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { GlobalEditor } from "@/components/global/GlobalEditor";

export const dynamic = "force-dynamic";

export default async function GlobalPage() {
  let settings: Awaited<ReturnType<typeof getGlobalSettings>> | null = null;
  let error: string | null = null;
  try {
    settings = await getGlobalSettings();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Ajustes globales"
        description="Textos de la pantalla principal, marca y paleta de colores."
      />
      {error || !settings ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <GlobalEditor settings={settings} />
      )}
    </>
  );
}
