"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle2,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { QuizConfigView } from "@/lib/data/quiz";
import { quizConfigSchema } from "@/lib/validation/quiz";
import { DIFFICULTIES, DIFFICULTY_LABEL } from "@/lib/validation/memory";
import { saveQuizConfig } from "@/actions/quiz";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { ImagePicker } from "@/components/media/ImagePicker";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { cn } from "@/lib/cn";

type QuestionForm = {
  id: string;
  question: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  image_alt: string;
  difficulty: string;
  time_limit_seconds: string;
  correct: boolean;
  active: boolean;
};

export function QuizEditor({ config }: { config: QuizConfigView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();

  const [settings, setSettings] = useState({ ...config.settings });
  const [questions, setQuestions] = useState<QuestionForm[]>(
    config.questions.map((q) => ({
      id: q.id,
      question: q.question,
      image_asset_id: q.image_asset_id,
      imageUrl: q.imageUrl,
      image_alt: q.image_alt,
      difficulty: q.difficulty,
      time_limit_seconds:
        q.time_limit_seconds != null ? String(q.time_limit_seconds) : "",
      correct: q.correct,
      active: q.active,
    })),
  );

  function setS(field: keyof typeof settings, value: string | number) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }
  function updateQuestion(id: string, patch: Partial<QuestionForm>) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }
  function buildInput() {
    return {
      settings: {
        ...settings,
        feedback_delay_ms: Number(settings.feedback_delay_ms) || 0,
        next_delay_ms: Number(settings.next_delay_ms) || 0,
      },
      categories: [],
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        image_asset_id: q.image_asset_id,
        image_alt: q.image_alt,
        difficulty: q.difficulty,
        time_limit_seconds: q.time_limit_seconds.trim()
          ? Number(q.time_limit_seconds) || 0
          : null,
        category_id: null,
        correct: q.correct,
        active: q.active,
      })),
    };
  }

  const validation = useMemo(
    () => quizConfigSchema.safeParse(buildInput()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, questions],
  );

  function save() {
    const parsed = quizConfigSchema.safeParse(buildInput());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuración inválida.");
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
                <span className="text-ink">Configuración válida</span>
              </>
            ) : (
              <>
                <AlertTriangle size={18} className="text-danger" />
                <span className="text-danger">
                  {validation.error.issues[0]?.message}
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-muted">
            {questions.filter((q) => q.active).length} preguntas activas de{" "}
            {questions.length}
          </div>
        </CardBody>
      </Card>

      {/* Preguntas */}
      <Card>
        <CardHeader
          title="Preguntas (Verdadero / Falso)"
          description="Cada pregunta tiene una afirmación, imagen opcional y la respuesta correcta."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setQuestions((p) => [
                  ...p,
                  {
                    id: crypto.randomUUID(),
                    question: "",
                    image_asset_id: null,
                    imageUrl: null,
                    image_alt: "",
                    difficulty: "normal",
                    time_limit_seconds: "",
                    category_id: null,
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
          {questions.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              No hay preguntas. Agregá la primera.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-cream/30 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-muted">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                      Activa
                      <Toggle
                        checked={q.active}
                        onChange={(v) => updateQuestion(q.id, { active: v })}
                        label="Activa"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions((p) => p.filter((x) => x.id !== q.id))
                      }
                      className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                      aria-label="Eliminar pregunta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <Field label="Enunciado" required={q.active}>
                  <Textarea
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(q.id, { question: e.target.value })
                    }
                    rows={2}
                    placeholder="Escribí la afirmación a evaluar…"
                  />
                </Field>

                <Field label="Imagen (opcional)">
                  <ImagePicker
                    label={`Imagen · pregunta ${index + 1}`}
                    value={q.image_asset_id}
                    valueUrl={q.imageUrl}
                    onChange={(id, url) =>
                      updateQuestion(q.id, { image_asset_id: id, imageUrl: url })
                    }
                  />
                </Field>

                <Field label="Respuesta correcta">
                  <div className="flex gap-2">
                    {(
                      [
                        { v: true, label: "Verdadero", icon: Check },
                        { v: false, label: "Falso", icon: X },
                      ] as const
                    ).map(({ v, label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => updateQuestion(q.id, { correct: v })}
                        className={cn(
                          "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition",
                          q.correct === v
                            ? v
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

                <Field label="Dificultad">
                  <Select
                    value={q.difficulty}
                    onChange={(e) =>
                      updateQuestion(q.id, { difficulty: e.target.value })
                    }
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {DIFFICULTY_LABEL[d]}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Tiempo (seg)" hint="Vacío = sin límite">
                  <Input
                    type="number"
                    min={0}
                    value={q.time_limit_seconds}
                    onChange={(e) =>
                      updateQuestion(q.id, { time_limit_seconds: e.target.value })
                    }
                  />
                </Field>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={save}
          loading={isPending}
          disabled={!validation.success}
          className="shadow-soft"
        >
          <Save size={16} /> Guardar configuración
        </Button>
      </div>
    </div>
  );
}
