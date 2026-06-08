import { z } from "zod";

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().max(600),
  image_asset_id: z.string().uuid().nullable(),
  image_alt: z.string().trim().max(160),
  correct: z.boolean(),
  active: z.boolean(),
});

export const quizConfigSchema = z
  .object({
    questions: z.array(quizQuestionSchema),
  })
  .superRefine((val, ctx) => {
    val.questions.forEach((question, index) => {
      if (question.active && !question.question.trim()) {
        ctx.addIssue({
          code: "custom",
          message: `La pregunta #${index + 1} activa necesita un enunciado.`,
          path: ["questions", index, "question"],
        });
      }

      if (question.active && !question.image_asset_id) {
        ctx.addIssue({
          code: "custom",
          message: `La pregunta #${index + 1} activa necesita una imagen.`,
          path: ["questions", index, "image_asset_id"],
        });
      }
    });
  });

export type QuizConfigInput = z.infer<typeof quizConfigSchema>;
