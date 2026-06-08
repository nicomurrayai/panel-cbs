import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { assetUrl } from "@/lib/supabase/storage";
import { one } from "@/lib/embed";
import type { ThemeConfig, BrandingConfig } from "@/lib/validation/global";

export type GlobalSettingsView = {
  version: string;
  home_eyebrow: string;
  home_title: string;
  home_subtitle: string;
  home_background_asset_id: string | null;
  backgroundUrl: string | null;
  theme: ThemeConfig;
  branding: BrandingConfig;
};

const DEFAULT_THEME: ThemeConfig = {
  cream: "#fff3dc",
  creamStrong: "#fff8ec",
  orange: "#f5a400",
  orangeDeep: "#df8800",
  yellow: "#ffd100",
  ink: "#1f1f25",
  muted: "#6f6255",
  cnhBlack: "#17171d",
  success: "#34785f",
};

const DEFAULT_BRANDING: BrandingConfig = {
  primaryName: "CBS+",
  secondaryName: "CNH",
  footer: "Because I Care",
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

  const theme = { ...DEFAULT_THEME, ...((data?.theme as Partial<ThemeConfig>) ?? {}) };
  const branding = {
    ...DEFAULT_BRANDING,
    ...((data?.branding as Partial<BrandingConfig>) ?? {}),
  };
  const background = one(
    (data as { background?: Parameters<typeof assetUrl>[0] | Parameters<typeof assetUrl>[0][] } | null)
      ?.background,
  );

  return {
    version: data?.version ?? new Date().toISOString().slice(0, 10),
    home_eyebrow: data?.home_eyebrow ?? "",
    home_title: data?.home_title ?? "",
    home_subtitle: data?.home_subtitle ?? "",
    home_background_asset_id: data?.home_background_asset_id ?? null,
    backgroundUrl: assetUrl(background),
    theme,
    branding,
  };
}
