import {
  DEFAULT_GAME_THEME_OVERRIDE,
  DEFAULT_HOME_CHROME,
  DEFAULT_SURFACE_CONFIG,
  DEFAULT_TYPOGRAPHY,
  type GameThemeOverride,
  type HomeChromeConfig,
  type SurfaceConfig,
  type TypographyConfig,
} from "@/lib/validation/themeEngine";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asNullableUuid(value: unknown): string | null {
  if (typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value)) {
    return value;
  }
  return null;
}

export function normalizeTypography(raw: unknown): TypographyConfig {
  const source = isRecord(raw) ? raw : {};
  const scale = source.scale;
  return {
    displayFont: asString(source.displayFont, DEFAULT_TYPOGRAPHY.displayFont),
    bodyFont: asString(source.bodyFont, DEFAULT_TYPOGRAPHY.bodyFont),
    scale: scale === "compact" || scale === "large" || scale === "standard" ? scale : DEFAULT_TYPOGRAPHY.scale,
    customDisplayFontAssetId: asNullableUuid(source.customDisplayFontAssetId),
    customBodyFontAssetId: asNullableUuid(source.customBodyFontAssetId),
  };
}

export function normalizeHomeChrome(raw: unknown): HomeChromeConfig {
  const source = isRecord(raw) ? raw : {};
  const card = isRecord(source.cardStyle) ? source.cardStyle : {};
  const radius = card.radius === "sm" || card.radius === "md" || card.radius === "lg" ? card.radius : DEFAULT_HOME_CHROME.cardStyle.radius;
  const elevation =
    card.elevation === "none" || card.elevation === "soft" || card.elevation === "strong"
      ? card.elevation
      : DEFAULT_HOME_CHROME.cardStyle.elevation;
  const badgeStyle =
    card.badgeStyle === "pill" || card.badgeStyle === "tag" || card.badgeStyle === "none"
      ? card.badgeStyle
      : DEFAULT_HOME_CHROME.cardStyle.badgeStyle;
  const borderWidth =
    card.borderWidth === 0 || card.borderWidth === 1 || card.borderWidth === 2
      ? card.borderWidth
      : DEFAULT_HOME_CHROME.cardStyle.borderWidth;
  const ctaSize =
    source.ctaSize === "md" || source.ctaSize === "lg" || source.ctaSize === "xl"
      ? source.ctaSize
      : DEFAULT_HOME_CHROME.ctaSize;

  return {
    showBrandHeader: typeof source.showBrandHeader === "boolean" ? source.showBrandHeader : DEFAULT_HOME_CHROME.showBrandHeader,
    ctaSize,
    cardStyle: {
      radius,
      elevation,
      borderWidth,
      badgeStyle,
      showCoverImage:
        typeof card.showCoverImage === "boolean"
          ? card.showCoverImage
          : DEFAULT_HOME_CHROME.cardStyle.showCoverImage,
    },
  };
}

export function normalizeSurfaceConfig(raw: unknown): SurfaceConfig {
  const source = isRecord(raw) ? raw : {};
  const kind = source.attractMediaKind;
  const opacity =
    typeof source.patternOpacity === "number" && Number.isFinite(source.patternOpacity)
      ? Math.min(1, Math.max(0, source.patternOpacity))
      : DEFAULT_SURFACE_CONFIG.patternOpacity;

  return {
    patternAssetId: asNullableUuid(source.patternAssetId),
    patternOpacity: opacity,
    attractMediaKind: kind === "image" || kind === "video" ? kind : null,
  };
}

export function normalizeGameThemeOverride(raw: unknown): GameThemeOverride {
  const source = isRecord(raw) ? raw : {};
  const theme = isRecord(source.theme) ? source.theme : undefined;
  const typography = isRecord(source.typography) ? source.typography : undefined;

  const partialTheme: GameThemeOverride["theme"] = {};
  if (theme) {
    for (const key of [
      "surface",
      "surfaceStrong",
      "accent",
      "accentDeep",
      "highlight",
      "ink",
      "muted",
      "inverse",
      "success",
      "danger",
    ] as const) {
      const value = theme[key];
      if (typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
        partialTheme[key] = value;
      }
    }
  }

  return {
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_GAME_THEME_OVERRIDE.enabled,
    theme: Object.keys(partialTheme).length > 0 ? partialTheme : undefined,
    typography: typography
      ? {
          displayFont: typeof typography.displayFont === "string" ? typography.displayFont : undefined,
          bodyFont: typeof typography.bodyFont === "string" ? typography.bodyFont : undefined,
          scale:
            typography.scale === "compact" || typography.scale === "standard" || typography.scale === "large"
              ? typography.scale
              : undefined,
        }
      : undefined,
    cardAccent:
      typeof source.cardAccent === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(source.cardAccent)
        ? source.cardAccent
        : source.cardAccent === null
          ? null
          : undefined,
    backgroundAssetId: asNullableUuid(source.backgroundAssetId),
  };
}
