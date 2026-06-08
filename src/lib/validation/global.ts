import { z } from "zod";
import { hexColor } from "./common";

export const THEME_FIELDS = [
  { key: "cream", label: "Crema" },
  { key: "creamStrong", label: "Crema fuerte" },
  { key: "orange", label: "Naranja" },
  { key: "orangeDeep", label: "Naranja oscuro" },
  { key: "yellow", label: "Amarillo" },
  { key: "ink", label: "Tinta (texto)" },
  { key: "muted", label: "Texto suave" },
  { key: "cnhBlack", label: "Negro CNH" },
  { key: "success", label: "Éxito" },
] as const;

export const themeSchema = z.object({
  cream: hexColor,
  creamStrong: hexColor,
  orange: hexColor,
  orangeDeep: hexColor,
  yellow: hexColor,
  ink: hexColor,
  muted: hexColor,
  cnhBlack: hexColor,
  success: hexColor,
});

export const brandingSchema = z.object({
  primaryName: z.string().trim().max(40),
  secondaryName: z.string().trim().max(40),
  footer: z.string().trim().max(120),
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
