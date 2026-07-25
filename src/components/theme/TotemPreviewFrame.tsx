"use client";

import type { BrandingConfig, ThemeConfig } from "@/lib/validation/global";
import type { HomeChromeConfig, TypographyConfig } from "@/lib/validation/themeEngine";

export type PreviewMode = "home" | "attract" | "cards";

type PreviewGame = {
  id: string;
  title: string;
  description: string;
  cta: string;
  accent: string | null;
};

export function TotemPreviewFrame({
  mode,
  theme,
  branding,
  typography,
  homeChrome,
  logoUrl,
  backgroundUrl,
  attractMediaUrl,
  attractIsVideo,
  title,
  subtitle,
  eyebrow,
  games,
  showTouchGuide = true,
}: {
  mode: PreviewMode;
  theme: ThemeConfig;
  branding: BrandingConfig;
  typography: TypographyConfig;
  homeChrome: HomeChromeConfig;
  logoUrl: string | null;
  backgroundUrl: string | null;
  attractMediaUrl: string | null;
  attractIsVideo: boolean;
  title: string;
  subtitle: string;
  eyebrow: string;
  games: PreviewGame[];
  showTouchGuide?: boolean;
}) {
  const radius =
    homeChrome.cardStyle.radius === "sm" ? "12px" : homeChrome.cardStyle.radius === "md" ? "18px" : "24px";
  const ctaMin =
    homeChrome.ctaSize === "xl" ? "3.4rem" : homeChrome.ctaSize === "lg" ? "2.9rem" : "2.4rem";
  const shadow =
    homeChrome.cardStyle.elevation === "none"
      ? "none"
      : homeChrome.cardStyle.elevation === "strong"
        ? "0 18px 36px rgba(0,0,0,0.22)"
        : "0 12px 28px rgba(0,0,0,0.12)";

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div
        className="relative overflow-hidden rounded-[1.6rem] border border-panel-border shadow-soft"
        style={{
          aspectRatio: "9 / 16",
          background: theme.surface,
          color: theme.ink,
          fontFamily: `"${typography.bodyFont}", system-ui, sans-serif`,
        }}
      >
        {mode === "attract" ? (
          <div className="absolute inset-0">
            {attractIsVideo && attractMediaUrl ? (
              <video
                className="h-full w-full object-cover"
                src={attractMediaUrl}
                muted
                loop
                autoPlay
                playsInline
                poster={backgroundUrl || undefined}
              />
            ) : attractMediaUrl || backgroundUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attractMediaUrl || backgroundUrl || ""} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(160deg, ${theme.accentDeep}, ${theme.inverse})`,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-4 text-white">
              {branding.primaryName ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">{branding.primaryName}</p>
              ) : null}
              <p
                className="text-2xl font-black leading-none"
                style={{ fontFamily: `"${typography.displayFont}", system-ui, sans-serif` }}
              >
                {title || "Tocá para jugar"}
              </p>
              <p className="text-xs opacity-90">{subtitle || "Elegí un desafío"}</p>
              <span
                className="mt-2 inline-flex items-center justify-center rounded-xl px-3 text-[11px] font-black uppercase tracking-wide"
                style={{ background: theme.accent, color: theme.surfaceStrong, minHeight: ctaMin }}
              >
                Tocá para jugar
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {homeChrome.showBrandHeader ? (
              <div className="flex items-center gap-2 border-b px-3 py-2.5" style={{ borderColor: `${theme.ink}18` }}>
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-5 w-auto max-w-[4.5rem] object-contain" />
                ) : null}
                <div className="min-w-0">
                  <p
                    className="truncate text-[11px] font-extrabold"
                    style={{ color: theme.accentDeep, fontFamily: `"${typography.displayFont}", system-ui` }}
                  >
                    {branding.primaryName || "Juegos"}
                  </p>
                  {eyebrow ? <p className="truncate text-[9px]" style={{ color: theme.muted }}>{eyebrow}</p> : null}
                </div>
              </div>
            ) : null}

            <div className="flex-1 space-y-2 overflow-hidden p-3">
              <div>
                <h3
                  className="text-sm font-black leading-tight"
                  style={{ fontFamily: `"${typography.displayFont}", system-ui`, fontSize: typography.scale === "large" ? "1.05rem" : "0.92rem" }}
                >
                  {title || "Elegí tu desafío"}
                </h3>
                <p className="mt-0.5 text-[10px] leading-snug" style={{ color: theme.muted }}>
                  {subtitle || "Participá y ganá premios"}
                </p>
              </div>

              <div className="space-y-2">
                {games.slice(0, 3).map((game) => {
                  const accent = game.accent || theme.accent;
                  return (
                    <div
                      key={game.id}
                      className="overflow-hidden border"
                      style={{
                        borderRadius: radius,
                        borderWidth: homeChrome.cardStyle.borderWidth,
                        borderColor: `${theme.ink}20`,
                        background: theme.surfaceStrong,
                        boxShadow: shadow,
                      }}
                    >
                      {homeChrome.cardStyle.showCoverImage ? (
                        <div className="h-10" style={{ background: `linear-gradient(90deg, ${accent}, ${theme.highlight})` }} />
                      ) : null}
                      <div className="space-y-1.5 p-2.5">
                        {homeChrome.cardStyle.badgeStyle !== "none" ? (
                          <span
                            className="inline-flex px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
                            style={{
                              borderRadius: homeChrome.cardStyle.badgeStyle === "pill" ? "999px" : "4px",
                              background: `${accent}18`,
                              color: theme.ink,
                            }}
                          >
                            Activo
                          </span>
                        ) : null}
                        <p
                          className="text-[11px] font-black leading-none"
                          style={{ fontFamily: `"${typography.displayFont}", system-ui` }}
                        >
                          {game.title}
                        </p>
                        <p className="line-clamp-2 text-[9px] leading-snug" style={{ color: theme.muted }}>
                          {game.description}
                        </p>
                        <span
                          className="inline-flex w-full items-center justify-center text-[9px] font-black uppercase tracking-wide"
                          style={{
                            minHeight: ctaMin,
                            borderRadius: "10px",
                            background: accent,
                            color: theme.surfaceStrong,
                          }}
                        >
                          {game.cta}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showTouchGuide ? (
          <div className="pointer-events-none absolute inset-x-2 bottom-2 rounded-xl border border-dashed border-white/40 bg-black/20 px-2 py-1 text-center text-[8px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-[1px]">
            Zona táctil inferior
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted">
        Preview tótem 9:16 · {mode}
      </p>
    </div>
  );
}
