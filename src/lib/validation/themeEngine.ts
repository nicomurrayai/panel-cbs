import { z } from "zod";
import { hexColor } from "./common";

export const CURATED_DISPLAY_FONTS = [
  "Segoe UI",
  "Bebas Neue",
  "Oswald",
  "Anton",
  "Archivo Black",
  "Montserrat",
] as const;

export const CURATED_BODY_FONTS = [
  "Segoe UI",
  "Source Sans 3",
  "DM Sans",
  "Nunito Sans",
  "IBM Plex Sans",
  "Open Sans",
] as const;

export const typographyScaleSchema = z.enum(["compact", "standard", "large"]);
export const ctaSizeSchema = z.enum(["md", "lg", "xl"]);
export const cardRadiusSchema = z.enum(["sm", "md", "lg"]);
export const cardElevationSchema = z.enum(["none", "soft", "strong"]);
export const badgeStyleSchema = z.enum(["pill", "tag", "none"]);
export const attractMediaKindSchema = z.enum(["image", "video"]);

export const typographySchema = z.object({
  displayFont: z.string().trim().min(1).max(80),
  bodyFont: z.string().trim().min(1).max(80),
  scale: typographyScaleSchema,
  customDisplayFontAssetId: z.string().uuid().nullable(),
  customBodyFontAssetId: z.string().uuid().nullable(),
});

export const cardStyleSchema = z.object({
  radius: cardRadiusSchema,
  elevation: cardElevationSchema,
  borderWidth: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  badgeStyle: badgeStyleSchema,
  showCoverImage: z.boolean(),
});

export const homeChromeSchema = z.object({
  showBrandHeader: z.boolean(),
  ctaSize: ctaSizeSchema,
  cardStyle: cardStyleSchema,
});

export const surfaceConfigSchema = z.object({
  patternAssetId: z.string().uuid().nullable(),
  patternOpacity: z.number().min(0).max(1),
  attractMediaKind: attractMediaKindSchema.nullable(),
});

export const partialThemeSchema = z
  .object({
    surface: hexColor.optional(),
    surfaceStrong: hexColor.optional(),
    accent: hexColor.optional(),
    accentDeep: hexColor.optional(),
    highlight: hexColor.optional(),
    ink: hexColor.optional(),
    muted: hexColor.optional(),
    inverse: hexColor.optional(),
    success: hexColor.optional(),
    danger: hexColor.optional(),
  })
  .strict();

export const gameThemeOverrideSchema = z.object({
  enabled: z.boolean(),
  theme: partialThemeSchema.optional(),
  typography: z
    .object({
      displayFont: z.string().trim().min(1).max(80).optional(),
      bodyFont: z.string().trim().min(1).max(80).optional(),
      scale: typographyScaleSchema.optional(),
    })
    .optional(),
  cardAccent: hexColor.nullable().optional(),
  backgroundAssetId: z.string().uuid().nullable().optional(),
});

export type TypographyConfig = z.infer<typeof typographySchema>;
export type HomeChromeConfig = z.infer<typeof homeChromeSchema>;
export type SurfaceConfig = z.infer<typeof surfaceConfigSchema>;
export type CardStyleConfig = z.infer<typeof cardStyleSchema>;
export type GameThemeOverride = z.infer<typeof gameThemeOverrideSchema>;

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  displayFont: "Segoe UI",
  bodyFont: "Segoe UI",
  scale: "standard",
  customDisplayFontAssetId: null,
  customBodyFontAssetId: null,
};

export const DEFAULT_HOME_CHROME: HomeChromeConfig = {
  showBrandHeader: true,
  ctaSize: "lg",
  cardStyle: {
    radius: "lg",
    elevation: "soft",
    borderWidth: 1,
    badgeStyle: "pill",
    showCoverImage: false,
  },
};

export const DEFAULT_SURFACE_CONFIG: SurfaceConfig = {
  patternAssetId: null,
  patternOpacity: 0.12,
  attractMediaKind: null,
};

export const DEFAULT_GAME_THEME_OVERRIDE: GameThemeOverride = {
  enabled: false,
};
