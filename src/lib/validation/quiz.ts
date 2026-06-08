import { z } from "zod";

export const quizCategorySchema = z.object({
  id: z.string().min(1),
  slug: z.string().trim().max(60),
  name: z.string().trim().min(1, "La categoría necesita un nombre").max(80),
  active: z.boolean(),
});

export const quizQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().trim().max(600),
  image_asset_id: z.string().uuid().nullable(),
  image_alt: z.string().trim().max(160),
  difficulty: z.string().trim().max(40),
  time_limit_seconds: z.coerce.number().int().min(0).max(600).nullable(),
  category_id: z.string().uuid().nullable(),
  correct: z.boolean(),
  active: z.boolean(),
});

export const quizSettingsSchema = z.object({
  instruction_title: z.string().trim().max(160),
  correct_label: z.string().trim().max(40),
  incorrect_label: z.string().trim().max(40),
  correct_feedback: z.string().trim().max(300),
  incorrect_feedback: z.string().trim().max(300),
  loading_text: z.string().trim().max(160),
  next_question_text: z.string().trim().max(80),
  final_title: z.string().trim().max(160),
  final_text: z.string().trim().max(300),
  empty_title: z.string().trim().max(160),
  empty_text: z.string().trim().max(300),
  feedback_delay_ms: z.coerce.number().int().min(0).max(30_000),
  next_delay_ms: z.coerce.number().int().min(0).max(30_000),
});

export const quizConfigSchema = z
  .object({
    settings: quizSettingsSchema,
    categories: z.array(quizCategorySchema),
    questions: z.array(quizQuestionSchema),
  })
  .superRefine((val, ctx) => {
    // Una pregunta activa debe tener su enunciado completo.
    val.questions.forEach((q, i) => {
      if (q.active && !q.question.trim()) {
        ctx.addIssue({
          code: "custom",
          message: `La pregunta #${i + 1} está activa pero no tiene enunciado.`,
          path: ["questions", i, "question"],
        });
      }
    });
    // Slugs de categoría únicos.
    const seen = new Set<string>();
    val.categories.forEach((c, i) => {
      const slug = c.slug.trim().toLowerCase();
      if (slug && seen.has(slug)) {
        ctx.addIssue({
          code: "custom",
          message: `La categoría "${c.name}" tiene un identificador repetido.`,
          path: ["categories", i, "slug"],
        });
      }
      seen.add(slug);
    });
  });

export type QuizConfigInput = z.infer<typeof quizConfigSchema>;
