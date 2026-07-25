import { z } from "zod";
import { hexColor } from "./common";
import { gameThemeOverrideSchema } from "./themeEngine";

export const gameUpdateSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio").max(120),
  description: z.string().trim().max(600),
  cta_label: z.string().trim().min(1, "El texto del botón es obligatorio").max(40),
  visible: z.boolean(),
  enabled: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(999),
  cover_asset_id: z.string().uuid().nullable(),
  accent_color: hexColor.nullable(),
  maintenance_mode: z.boolean(),
  maintenance_title: z.string().trim().max(120).nullable(),
  maintenance_text: z.string().trim().max(600).nullable(),
  theme_config: gameThemeOverrideSchema,
});

export type GameUpdateInput = z.infer<typeof gameUpdateSchema>;
