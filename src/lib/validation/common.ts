import { z } from "zod";

/** Color hexadecimal #RGB o #RRGGBB. */
export const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color inválido (usá formato #RRGGBB)");

export const optionalText = z.string().trim().max(2000);

export const uuid = z.string().uuid();
