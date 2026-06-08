/** Metadatos de presentación por juego (IDs reales en la tabla games). */
export const GAME_META: Record<
  string,
  { label: string; configHref: string | null }
> = {
  memory: { label: "Memory Card", configHref: "/memory" },
  roulette: { label: "Ruleta", configHref: "/ruleta" },
  quiz: { label: "Quiz", configHref: "/quiz" },
};

export function gameLabel(id: string): string {
  return GAME_META[id]?.label ?? id;
}
