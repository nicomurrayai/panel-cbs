import { z } from "zod";
import { hexColor } from "./common";

export const THEME_FIELDS = [
  { key: "surface", label: "Fondo" },
  { key: "surfaceStrong", label: "Superficie" },
  { key: "accent", label: "Acento" },
  { key: "accentDeep", label: "Acento oscuro" },
  { key: "highlight", label: "Resalte" },
  { key: "ink", label: "Texto" },
  { key: "muted", label: "Texto suave" },
  { key: "inverse", label: "Inverso" },
  { key: "success", label: "Éxito" },
  { key: "danger", label: "Error" },
] as const;

export const themeSchema = z.object({
  surface: hexColor,
  surfaceStrong: hexColor,
  accent: hexColor,
  accentDeep: hexColor,
  highlight: hexColor,
  ink: hexColor,
  muted: hexColor,
  inverse: hexColor,
  success: hexColor,
  danger: hexColor,
});

export const brandingSchema = z.object({
  primaryName: z.string().trim().max(40),
  secondaryName: z.string().trim().max(40),
  footer: z.string().trim().max(120),
  equipmentTitle: z.string().trim().max(80).optional().default(""),
  logoAssetId: z.string().uuid().nullable().optional().default(null),
});

export const globalSettingsSchema = z.object({
  home_eyebrow: z.string().trim().max(80),
  home_title: z.string().trim().max(160),
  home_subtitle: z.string().trim().max(200),
  home_background_asset_id: z.string().uuid().nullable(),
  theme: themeSchema,
  branding: brandingSchema,
});

export type GlobalSettingsInput = z.infer<typeof globalSettingsSchema>;
export type ThemeConfig = z.infer<typeof themeSchema>;
export type BrandingConfig = z.infer<typeof brandingSchema>;
