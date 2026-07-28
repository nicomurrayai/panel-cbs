import { z } from "zod";

export const quizQuestionTypeSchema = z.union([z.literal("true_false"), z.literal("multiple_choice")]);

export const quizQuestionSchema = z
  .object({
    id: z.string().min(1),
    question: z.string().trim().max(600),
    image_asset_id: z.string().uuid().nullable(),
    image_alt: z.string().trim().max(160),
    type: quizQuestionTypeSchema,
    correct: z.boolean(),
    options: z.tuple([z.string(), z.string(), z.string()]).nullable(),
    correct_option_index: z.union([z.literal(0), z.literal(1), z.literal(2)]).nullable(),
    active: z.boolean(),
  })
  .superRefine((question, ctx) => {
    if (question.type === "true_false") {
      if (question.options !== null || question.correct_option_index !== null) {
        ctx.addIssue({
          code: "custom",
          message: "Las preguntas verdadero/falso no deben tener opciones configurables.",
          path: ["options"],
        });
      }
      return;
    }

    if (!question.options || question.correct_option_index === null) {
      ctx.addIssue({
        code: "custom",
        message: "Las preguntas de opcion multiple necesitan tres respuestas y una correcta.",
        path: ["options"],
      });
    }
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

      if (question.active && question.type === "multiple_choice") {
        const options = question.options ?? ["", "", ""];
        options.forEach((option, optionIndex) => {
          if (!option.trim()) {
            ctx.addIssue({
              code: "custom",
              message: `La pregunta #${index + 1} necesita completar las tres respuestas.`,
              path: ["questions", index, "options", optionIndex],
            });
          }
        });

        if (question.correct_option_index === null) {
          ctx.addIssue({
            code: "custom",
            message: `La pregunta #${index + 1} necesita indicar la respuesta correcta.`,
            path: ["questions", index, "correct_option_index"],
          });
        }
      }
    });
  });

export type QuizQuestionType = z.infer<typeof quizQuestionTypeSchema>;
export type QuizConfigInput = z.infer<typeof quizConfigSchema>;
