import { getMemoryConfig } from "@/lib/data/memory";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { MemoryEditor } from "@/components/memory/MemoryEditor";

export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  let config: Awaited<ReturnType<typeof getMemoryConfig>> | null = null;
  let error: string | null = null;
  try {
    config = await getMemoryConfig();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Memory Card"
        description="Configurá cartas, pares, dificultad, tiempo e intentos. No se puede activar un set incompleto."
      />
      {error || !config ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <MemoryEditor config={config} />
      )}
    </>
  );
}
