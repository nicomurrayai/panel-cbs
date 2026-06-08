import { z } from "zod";
import { hexColor } from "./common";

export const DIFFICULTIES = ["easy", "normal", "hard"] as const;
export const DIFFICULTY_LABEL: Record<(typeof DIFFICULTIES)[number], string> = {
  easy: "Fácil",
  normal: "Normal",
  hard: "Difícil",
};

export const memoryCardSchema = z.object({
  id: z.string().min(1),
  pair_key: z.string().trim().min(1, "Falta la clave del par").max(60),
  label: z.string().trim().max(120),
  asset_label: z.string().trim().max(24),
  asset_id: z.string().uuid().nullable(),
  accent_color: hexColor,
  active: z.boolean(),
});

export const memoryLevelSchema = z.object({
  difficulty: z.string().trim().min(1).max(40),
  rows: z.coerce.number().int().min(2).max(8),
  columns: z.coerce.number().int().min(2).max(8),
  time_limit_seconds: z.coerce.number().int().min(0).max(1800),
  reveal_delay_ms: z.coerce.number().int().min(0).max(5000),
  max_attempts: z.coerce.number().int().min(0).max(999),
  instruction_title: z.string().trim().max(160),
  instruction_text: z.string().trim().max(600),
  victory_title: z.string().trim().max(160),
  victory_text: z.string().trim().max(600),
  timeout_title: z.string().trim().max(160),
  timeout_text: z.string().trim().max(600),
  active: z.boolean(),
});

export const memoryConfigSchema = z
  .object({
    levelId: z.string().uuid().nullable(),
    level: memoryLevelSchema,
    cards: z.array(memoryCardSchema),
  })
  .superRefine((val, ctx) => {
    const { rows, columns, active } = val.level;
    const totalCards = rows * columns;

    // La cantidad de cartas (rows*columns) debe ser par.
    if (totalCards % 2 !== 0) {
      ctx.addIssue({
        code: "custom",
        message: `La cantidad de cartas (${rows}×${columns}=${totalCards}) debe ser par.`,
        path: ["level", "columns"],
      });
    }

    // pair_key únicos.
    const seen = new Set<string>();
    val.cards.forEach((c, i) => {
      const key = c.pair_key.trim().toLowerCase();
      if (key && seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `La clave de par "${c.pair_key}" está repetida.`,
          path: ["cards", i, "pair_key"],
        });
      }
      seen.add(key);
    });

    const activeCards = val.cards.filter((c) => c.active);
    const pairsNeeded = Math.floor(totalCards / 2);

    // Reglas que impiden activar un set incompleto.
    if (active) {
      if (activeCards.length < pairsNeeded) {
        ctx.addIssue({
          code: "custom",
          message: `Se necesitan ${pairsNeeded} pares para un tablero de ${totalCards} cartas y hay ${activeCards.length} activos.`,
          path: ["cards"],
        });
      }
      val.cards.forEach((c, i) => {
        if (!c.active) return;
        const hasVisual = Boolean(c.asset_id) || c.asset_label.trim().length > 0;
        if (!hasVisual) {
          ctx.addIssue({
            code: "custom",
            message: `La carta "${c.pair_key || i + 1}" necesita una imagen o una etiqueta visible.`,
            path: ["cards", i, "asset_label"],
          });
        }
      });
    }
  });

export type MemoryConfigInput = z.infer<typeof memoryConfigSchema>;
