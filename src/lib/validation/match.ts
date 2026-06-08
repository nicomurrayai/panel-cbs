import { z } from "zod";

export const matchPairSchema = z.object({
  id: z.string().min(1),
  text: z.string().trim().max(600),
  image_asset_id: z.string().uuid().nullable(),
  active: z.boolean(),
});

export const matchConfigSchema = z
  .object({
    pairs: z.array(matchPairSchema),
  })
  .superRefine((val, ctx) => {
    val.pairs.forEach((pair, index) => {
      if (pair.active && !pair.text.trim()) {
        ctx.addIssue({
          code: "custom",
          message: `El par #${index + 1} activo necesita una oracion.`,
          path: ["pairs", index, "text"],
        });
      }

      if (pair.active && !pair.image_asset_id) {
        ctx.addIssue({
          code: "custom",
          message: `El par #${index + 1} activo necesita una imagen.`,
          path: ["pairs", index, "image_asset_id"],
        });
      }
    });
  });

export type MatchConfigInput = z.infer<typeof matchConfigSchema>;
