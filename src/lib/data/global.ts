import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";
import type { ThemeConfig, BrandingConfig } from "@/lib/validation/global";
import type { HomeChromeConfig, SurfaceConfig, TypographyConfig } from "@/lib/validation/themeEngine";
import {
  DEFAULT_BRANDING,
  DEFAULT_THEME,
  normalizeBranding,
  normalizeHomeChrome,
  normalizeSurfaceConfig,
  normalizeTheme,
  normalizeTypography,
} from "@/lib/theme";
import { DEFAULT_HOME_CHROME, DEFAULT_SURFACE_CONFIG, DEFAULT_TYPOGRAPHY } from "@/lib/validation/themeEngine";

export type GlobalSettingsView = {
  version: string;
  home_eyebrow: string;
  home_title: string;
  home_subtitle: string;
  home_background_asset_id: string | null;
  attract_media_asset_id: string | null;
  idle_timeout_seconds: number | null;
  auto_reset_seconds: number | null;
  backgroundUrl: string | null;
  attractMediaUrl: string | null;
  patternUrl: string | null;
  theme: ThemeConfig;
  branding: BrandingConfig;
  typography: TypographyConfig;
  home_chrome: HomeChromeConfig;
  surface_config: SurfaceConfig;
  logoUrl: string | null;
};

export async function getGlobalSettings(): Promise<GlobalSettingsView> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("global_settings")
    .select(
      "version,home_eyebrow,home_title,home_subtitle,home_background_asset_id,attract_media_asset_id,idle_timeout_seconds,auto_reset_seconds,theme,branding,typography,home_chrome,surface_config, background:media_assets!global_settings_home_background_asset_id_fkey(public_url,bucket,path,fallback_src), attract:media_assets!global_settings_attract_media_asset_id_fkey(public_url,bucket,path,fallback_src,kind,mime_type)",
    )
    .eq("id", "default")
    .maybeSingle();

  if (error) throw error;

  const theme = normalizeTheme(data?.theme ?? DEFAULT_THEME);
  const branding = normalizeBranding(data?.branding ?? DEFAULT_BRANDING);
  const typography = normalizeTypography(data?.typography ?? DEFAULT_TYPOGRAPHY);
  const home_chrome = normalizeHomeChrome(data?.home_chrome ?? DEFAULT_HOME_CHROME);
  const surface_config = normalizeSurfaceConfig(data?.surface_config ?? DEFAULT_SURFACE_CONFIG);
  const background = one(
    (data as { background?: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] } | null)
      ?.background,
  );
  const attract = one(
    (data as { attract?: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] } | null)?.attract,
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

  let patternUrl: string | null = null;
  if (surface_config.patternAssetId) {
    const { data: patternAsset } = await supabase
      .from("media_assets")
      .select("public_url,bucket,path,fallback_src")
      .eq("id", surface_config.patternAssetId)
      .maybeSingle();
    patternUrl = assetUrl(patternAsset);
  }

  return {
    version: data?.version ?? new Date().toISOString().slice(0, 10),
    home_eyebrow: data?.home_eyebrow ?? "",
    home_title: data?.home_title ?? "",
    home_subtitle: data?.home_subtitle ?? "",
    home_background_asset_id: data?.home_background_asset_id ?? null,
    attract_media_asset_id: data?.attract_media_asset_id ?? null,
    idle_timeout_seconds: data?.idle_timeout_seconds ?? 45,
    auto_reset_seconds: data?.auto_reset_seconds ?? 90,
    backgroundUrl: assetUrl(background),
    attractMediaUrl: assetUrl(attract),
    patternUrl,
    theme,
    branding,
    typography,
    home_chrome,
    surface_config,
    logoUrl,
  };
}
