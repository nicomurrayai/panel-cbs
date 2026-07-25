/** Contraste relativo WCAG entre dos hex (#RGB / #RRGGBB). */
export function contrastRatio(foreground: string, background: string): number {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastHint(foreground: string, background: string): {
  ratio: number;
  level: "fail" | "aa" | "aaa";
  label: string;
} {
  const ratio = contrastRatio(foreground, background);
  if (ratio >= 7) return { ratio, level: "aaa", label: `AAA ${ratio.toFixed(1)}:1` };
  if (ratio >= 4.5) return { ratio, level: "aa", label: `AA ${ratio.toFixed(1)}:1` };
  return { ratio, level: "fail", label: `Bajo ${ratio.toFixed(1)}:1` };
}

function relativeLuminance(hex: string): number {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : normalized;
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(full.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
