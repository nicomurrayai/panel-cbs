"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { QuizConfigView } from "@/lib/data/quiz";
import { quizConfigSchema } from "@/lib/validation/quiz";
import { saveQuizConfig } from "@/actions/quiz";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { DirectImageUpload } from "@/components/media/DirectImageUpload";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { cn } from "@/lib/cn";

type QuestionForm = {
  id: string;
  question: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  image_alt: string;
  correct: boolean;
  active: boolean;
};

export function QuizEditor({ config }: { config: QuizConfigView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();
  const [questions, setQuestions] = useState<QuestionForm[]>(
    config.questions.map((question) => ({
      id: question.id,
      question: question.question,
      image_asset_id: question.image_asset_id,
      imageUrl: question.imageUrl,
      image_alt: question.image_alt,
      correct: question.correct,
      active: question.active,
    })),
  );

  function updateQuestion(id: string, patch: Partial<QuestionForm>) {
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  }

  function buildInput() {
    return {
      questions: questions.map((question) => ({
        id: question.id,
        question: question.question,
        image_asset_id: question.image_asset_id,
        image_alt: question.image_alt,
        correct: question.correct,
        active: question.active,
      })),
    };
  }

  const validation = useMemo(
    () => quizConfigSchema.safeParse(buildInput()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions],
  );

  function save() {
    const parsed = quizConfigSchema.safeParse(buildInput());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
      return;
    }

    run(() => saveQuizConfig(parsed.data), {
      success: "Quiz guardado",
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <div className="space-y-5">
      <Card className={validation.success ? "border-success/40" : "border-danger/40"}>
        <CardBody className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            {validation.success ? (
              <>
                <CheckCircle2 size={18} className="text-success" />
                <span className="text-ink">Configuracion valida</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} className="text-danger" />
                <span className="text-danger">{validation.error.issues[0]?.message}</span>
              </>
            )}
          </div>
          <div className="text-sm text-muted">
            {questions.filter((question) => question.active).length} preguntas activas de {questions.length}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Preguntas"
          description="Cada pregunta incluye enunciado, imagen opcional y una respuesta Verdadero/Falso."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setQuestions((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    question: "",
                    image_asset_id: null,
                    imageUrl: null,
                    image_alt: "",
                    correct: true,
                    active: true,
                  },
                ])
              }
            >
              <Plus size={15} /> Agregar pregunta
            </Button>
          }
        />
        <CardBody>
          {questions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No hay preguntas. Agrega la primera.</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-cream/30 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-muted">#{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                      Activa
                      <Toggle
                        checked={question.active}
                        onChange={(value) => updateQuestion(question.id, { active: value })}
                        label="Activa"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}
                      className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                      aria-label="Eliminar pregunta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <Field label="Enunciado" required={question.active}>
                  <Textarea
                    value={question.question}
                    onChange={(event) => updateQuestion(question.id, { question: event.target.value })}
                    rows={2}
                    placeholder="Escribe la afirmacion a evaluar..."
                  />
                </Field>

                <Field label="Imagen (opcional)">
                  <DirectImageUpload
                    label={`Imagen pregunta ${index + 1}`}
                    value={question.image_asset_id}
                    valueUrl={question.imageUrl}
                    onChange={(id, url) => updateQuestion(question.id, { image_asset_id: id, imageUrl: url })}
                  />
                </Field>

                <Field label="Texto alternativo">
                  <Input
                    value={question.image_alt}
                    onChange={(event) => updateQuestion(question.id, { image_alt: event.target.value })}
                    placeholder="Describe la imagen para el totem"
                  />
                </Field>

                <Field label="Respuesta correcta">
                  <div className="flex gap-2">
                    {([
                      { value: true, label: "Verdadero", icon: Check },
                      { value: false, label: "Falso", icon: X },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => updateQuestion(question.id, { correct: value })}
                        className={cn(
                          "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition",
                          question.correct === value
                            ? value
                              ? "border-success bg-success/12 text-success"
                              : "border-danger bg-danger/12 text-danger"
                            : "border-panel-border bg-white text-muted hover:bg-cream-strong",
                        )}
                      >
                        <Icon size={15} /> {label}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} loading={isPending} disabled={!validation.success} className="shadow-soft">
          <Save size={16} /> Guardar configuracion
        </Button>
      </div>
    </div>
  );
}
