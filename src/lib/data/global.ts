import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";
import type { ThemeConfig, BrandingConfig } from "@/lib/validation/global";
import { DEFAULT_BRANDING, DEFAULT_THEME, normalizeBranding, normalizeTheme } from "@/lib/theme";

export type GlobalSettingsView = {
  version: string;
  home_eyebrow: string;
  home_title: string;
  home_subtitle: string;
  home_background_asset_id: string | null;
  backgroundUrl: string | null;
  theme: ThemeConfig;
  branding: BrandingConfig;
  logoUrl: string | null;
};

export async function getGlobalSettings(): Promise<GlobalSettingsView> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("global_settings")
    .select(
      "version,home_eyebrow,home_title,home_subtitle,home_background_asset_id,theme,branding, background:media_assets!global_settings_home_background_asset_id_fkey(public_url,bucket,path,fallback_src)",
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;

  const theme = normalizeTheme(data?.theme ?? DEFAULT_THEME);
  const branding = normalizeBranding(data?.branding ?? DEFAULT_BRANDING);
  const background = one(
    (data as { background?: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] } | null)
      ?.background,
  );

  let logoUrl: string | null = null;
  if (branding.logoAssetId) {
    const { data: logoAsset } = await supabase
      .from("media_assets")
      .select("public_url,bucket,path,fallback_src")
      .eq("id", branding.logoAssetId)
      .maybeSingle();
    logoUrl = assetUrl(logoAsset);
  }

  return {
    version: data?.version ?? new Date().toISOString().slice(0, 10),
    home_eyebrow: data?.home_eyebrow ?? "",
    home_title: data?.home_title ?? "",
    home_subtitle: data?.home_subtitle ?? "",
    home_background_asset_id: data?.home_background_asset_id ?? null,
    backgroundUrl: assetUrl(background),
    theme,
    branding,
    logoUrl,
  };
}
