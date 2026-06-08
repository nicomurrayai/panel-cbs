import { z } from "zod";

export const memoryCardSchema = z.object({
  id: z.string().min(1),
  asset_id: z.string().uuid("La carta necesita una imagen"),
  active: z.boolean(),
});

export const memoryConfigSchema = z.object({
  time_limit_seconds: z.coerce.number().int().min(10).max(600),
  cards: z.array(memoryCardSchema),
});

export type MemoryConfigInput = z.infer<typeof memoryConfigSchema>;
