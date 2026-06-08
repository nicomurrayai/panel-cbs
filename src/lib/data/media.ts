import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import type { MediaAssetView } from "@/types/panel";

export async function getImageAssets(): Promise<MediaAssetView[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("media_assets")
    .select(
      "id,key,path,public_url,bucket,fallback_src,alt_text,mime_type,width,height",
    )
    .eq("kind", "image")
    .eq("active", true)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => ({
    id: r.id,
    key: r.key,
    path: r.path,
    url: assetUrl(r),
    alt: r.alt_text,
    mimeType: r.mime_type,
    width: r.width,
    height: r.height,
  }));
}
