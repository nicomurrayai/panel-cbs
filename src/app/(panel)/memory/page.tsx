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
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Memory Card"
        description="Configura el tiempo maximo y la galeria de imagenes que el totem duplica para formar pares."
      />
      {error || !config ? <SetupNotice error={error ?? "Sin datos"} /> : <MemoryEditor config={config} />}
    </>
  );
}
