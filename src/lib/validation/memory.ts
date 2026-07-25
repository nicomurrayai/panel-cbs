import { z } from "zod";

export const memoryPlayerModeSchema = z.enum(["one", "two", "selectable"]);

export const memoryCardSchema = z.object({
  id: z.string().min(1),
  asset_id: z.string().uuid("La carta necesita una imagen"),
  active: z.boolean(),
});

export const memoryConfigSchema = z.object({
  time_limit_seconds: z.coerce.number().int().min(10).max(600),
  player_mode: memoryPlayerModeSchema,
  cards: z.array(memoryCardSchema),
});

export type MemoryPlayerMode = z.infer<typeof memoryPlayerModeSchema>;
export type MemoryConfigInput = z.infer<typeof memoryConfigSchema>;

export const MEMORY_PLAYER_MODE_OPTIONS: Array<{
  value: MemoryPlayerMode;
  label: string;
  description: string;
}> = [
  {
    value: "one",
    label: "1 jugador",
    description: "Siempre arranca en modo individual.",
  },
  {
    value: "two",
    label: "2 jugadores",
    description: "Turnos alternados; gana quien complete más pares.",
  },
  {
    value: "selectable",
    label: "Elegir en el tótem",
    description: "Antes de jugar, el tótem pregunta 1 o 2 jugadores.",
  },
];
