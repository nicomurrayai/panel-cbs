import type { ThemeConfig } from "@/lib/validation/global";
import type { HomeChromeConfig, TypographyConfig } from "@/lib/validation/themeEngine";
import { DEFAULT_HOME_CHROME, DEFAULT_TYPOGRAPHY } from "@/lib/validation/themeEngine";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  theme: ThemeConfig;
  typography: TypographyConfig;
  homeChrome: HomeChromeConfig;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "neutral",
    name: "Neutral",
    description: "Alto contraste en escala de grises.",
    theme: {
      surface: "#fafafa",
      surfaceStrong: "#ffffff",
      accent: "#171717",
      accentDeep: "#0a0a0a",
      highlight: "#525252",
      ink: "#171717",
      muted: "#737373",
      inverse: "#0a0a0a",
      success: "#404040",
      danger: "#737373",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, displayFont: "Oswald", bodyFont: "Source Sans 3" },
    homeChrome: { ...DEFAULT_HOME_CHROME, ctaSize: "lg" },
  },
  {
    id: "high-contrast",
    name: "Alto contraste",
    description: "Máxima legibilidad a distancia.",
    theme: {
      surface: "#ffffff",
      surfaceStrong: "#ffffff",
      accent: "#000000",
      accentDeep: "#000000",
      highlight: "#111111",
      ink: "#000000",
      muted: "#333333",
      inverse: "#000000",
      success: "#0a0a0a",
      danger: "#1a1a1a",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, displayFont: "Anton", bodyFont: "Open Sans", scale: "large" },
    homeChrome: {
      ...DEFAULT_HOME_CHROME,
      ctaSize: "xl",
      cardStyle: { ...DEFAULT_HOME_CHROME.cardStyle, elevation: "strong", borderWidth: 2 },
    },
  },
  {
    id: "dark-event",
    name: "Evento oscuro",
    description: "Fondos oscuros con acentos claros.",
    theme: {
      surface: "#141414",
      surfaceStrong: "#1f1f1f",
      accent: "#f5f5f5",
      accentDeep: "#e5e5e5",
      highlight: "#a3a3a3",
      ink: "#fafafa",
      muted: "#a3a3a3",
      inverse: "#fafafa",
      success: "#d4d4d4",
      danger: "#737373",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, displayFont: "Bebas Neue", bodyFont: "DM Sans" },
    homeChrome: {
      ...DEFAULT_HOME_CHROME,
      ctaSize: "xl",
      cardStyle: { ...DEFAULT_HOME_CHROME.cardStyle, radius: "md", elevation: "soft" },
    },
  },
  {
    id: "warm-brand",
    name: "Marca cálida",
    description: "Tonos ámbar sobre superficies claras.",
    theme: {
      surface: "#fffaf3",
      surfaceStrong: "#ffffff",
      accent: "#c2410c",
      accentDeep: "#9a3412",
      highlight: "#ea580c",
      ink: "#1c1917",
      muted: "#78716c",
      inverse: "#1c1917",
      success: "#166534",
      danger: "#b91c1c",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, displayFont: "Montserrat", bodyFont: "Nunito Sans", scale: "standard" },
    homeChrome: {
      ...DEFAULT_HOME_CHROME,
      ctaSize: "lg",
      cardStyle: { ...DEFAULT_HOME_CHROME.cardStyle, radius: "lg", badgeStyle: "tag" },
    },
  },
];
