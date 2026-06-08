import { getImageAssets } from "@/lib/data/media";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { MediaLibrary } from "@/components/media/MediaLibrary";

export const dynamic = "force-dynamic";

export default async function MediosPage() {
  let assets: Awaited<ReturnType<typeof getImageAssets>> = [];
  let error: string | null = null;
  try {
    assets = await getImageAssets();
  } catch (e) {
    error = e instanceof Error ? e.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Medios"
        description="Subí, reemplazá y eliminá las imágenes del bucket game-assets."
      />
      {error ? <SetupNotice error={error} /> : <MediaLibrary assets={assets} />}
    </>
  );
}
