import type { BrandingConfig, ThemeConfig } from "@/lib/validation/global";

/** Defaults neutros — mantener alineados con panel-juegos/src/lib/theme.ts. */
export const DEFAULT_THEME: ThemeConfig = {
  surface: "#fafafa",
  surfaceStrong: "#ffffff",
  accent: "#171717",
  accentDeep: "#0a0a0a",
  highlight: "#525252",
  ink: "#171717",
  muted: "#737373",
  inverse: "#0a0a0a",
  success: "#3f6f5a",
  danger: "#c44545",
};

export const DEFAULT_BRANDING: BrandingConfig = {
  primaryName: "Juegos",
  secondaryName: "",
  footer: "",
  equipmentTitle: "",
  logoAssetId: null,
};

const LEGACY_THEME_KEYS: Record<string, keyof ThemeConfig> = {
  cream: "surface",
  creamStrong: "surfaceStrong",
  orange: "accent",
  orangeDeep: "accentDeep",
  yellow: "highlight",
  cnhBlack: "inverse",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function pickHex(value: unknown): string | undefined {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : undefined;
}

export function normalizeTheme(raw: unknown): ThemeConfig {
  const source = isRecord(raw) ? raw : {};
  const mapped: Partial<ThemeConfig> = {};

  for (const [key, value] of Object.entries(source)) {
    const hex = pickHex(value);
    if (!hex) continue;
    const modernKey = (LEGACY_THEME_KEYS[key] ?? key) as keyof ThemeConfig;
    if (modernKey in DEFAULT_THEME) {
      mapped[modernKey] = hex;
    }
  }

  return { ...DEFAULT_THEME, ...mapped };
}

export function normalizeBranding(raw: unknown): BrandingConfig {
  const source = isRecord(raw) ? raw : {};
  return {
    primaryName:
      typeof source.primaryName === "string" ? source.primaryName : DEFAULT_BRANDING.primaryName,
    secondaryName:
      typeof source.secondaryName === "string" ? source.secondaryName : DEFAULT_BRANDING.secondaryName,
    footer: typeof source.footer === "string" ? source.footer : DEFAULT_BRANDING.footer,
    equipmentTitle:
      typeof source.equipmentTitle === "string"
        ? source.equipmentTitle
        : DEFAULT_BRANDING.equipmentTitle,
    logoAssetId:
      typeof source.logoAssetId === "string"
        ? source.logoAssetId
        : source.logoAssetId === null
          ? null
          : DEFAULT_BRANDING.logoAssetId,
  };
}
