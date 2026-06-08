import { z } from "zod";
import { hexColor } from "./common";

export const PRIZE_TYPES = ["prize", "thanks", "retry"] as const;

export const PRIZE_TYPE_LABEL: Record<(typeof PRIZE_TYPES)[number], string> = {
  prize: "Premio",
  thanks: "Gracias por participar",
  retry: "Volvé a intentarlo",
};

export const rouletteSegmentSchema = z.object({
  id: z.string().min(1),
  label: z.string().trim().max(120),
  prize_type: z.enum(PRIZE_TYPES),
  probability_weight: z.coerce.number().int().min(0).max(100_000),
  color: hexColor,
  text_color: hexColor,
  enabled: z.boolean(),
  asset_id: z.string().uuid().nullable(),
  result_title: z.string().trim().max(160).nullable(),
  result_text: z.string().trim().max(600).nullable(),
  stock_managed: z.boolean(),
  total_stock: z.coerce.number().int().min(0).max(1_000_000).nullable(),
});

export const rouletteSettingsSchema = z.object({
  instruction_title: z.string().trim().max(160),
  instruction_text: z.string().trim().max(600),
  spin_label: z.string().trim().min(1, "El texto del botón es obligatorio").max(40),
  winner_title: z.string().trim().max(160),
  thanks_title: z.string().trim().max(160),
  offline_title: z.string().trim().max(160),
  offline_text: z.string().trim().max(600),
  duration_ms: z.coerce.number().int().min(0).max(30_000),
  min_turns: z.coerce.number().int().min(0).max(30),
});

export const rouletteConfigSchema = z
  .object({
    settings: rouletteSettingsSchema,
    segments: z.array(rouletteSegmentSchema).min(1, "Agregá al menos un segmento."),
  })
  .superRefine((val, ctx) => {
    const enabled = val.segments.filter((s) => s.enabled);
    if (enabled.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Tiene que haber al menos un segmento habilitado.",
        path: ["segments"],
      });
    }
    const totalWeight = enabled.reduce((a, s) => a + s.probability_weight, 0);
    if (enabled.length > 0 && totalWeight <= 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "La suma de probabilidades de los segmentos habilitados debe ser mayor a 0.",
        path: ["segments"],
      });
    }
    val.segments.forEach((s, i) => {
      if (s.enabled && !s.label.trim()) {
        ctx.addIssue({
          code: "custom",
          message: `El segmento #${i + 1} está habilitado pero no tiene nombre.`,
          path: ["segments", i, "label"],
        });
      }
      if (s.stock_managed && s.total_stock == null) {
        ctx.addIssue({
          code: "custom",
          message: `Definí el stock total del segmento "${s.label || i + 1}".`,
          path: ["segments", i, "total_stock"],
        });
      }
    });
  });

export type RouletteConfigInput = z.infer<typeof rouletteConfigSchema>;
export type RouletteSegmentInput = z.infer<typeof rouletteSegmentSchema>;
