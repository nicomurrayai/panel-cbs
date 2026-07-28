"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { QuizConfigView } from "@/lib/data/quiz";
import { quizConfigSchema, type QuizQuestionType } from "@/lib/validation/quiz";
import { saveQuizConfig } from "@/actions/quiz";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { DirectImageUpload } from "@/components/media/DirectImageUpload";
import { PendingRemoteChange } from "@/components/realtime/PendingRemoteChange";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import { sameJson } from "@/lib/realtime/compare";
import { fetchMediaAssetById, type MediaAssetRow } from "@/lib/realtime/mediaAssets";
import { cn } from "@/lib/cn";
import type { Database } from "@/types/database.types";

type QuizQuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];

type QuestionForm = {
  id: string;
  question: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  image_alt: string;
  type: QuizQuestionType;
  correct: boolean;
  options: [string, string, string] | null;
  correct_option_index: 0 | 1 | 2 | null;
  active: boolean;
  sort_order: number;
};

type QuizForm = {
  questions: QuestionForm[];
};

const EMPTY_OPTIONS: [string, string, string] = ["", "", ""];

function normalizeQuestionType(value: string | null | undefined): QuizQuestionType {
  return value === "multiple_choice" ? "multiple_choice" : "true_false";
}

function normalizeOptions(options: string[] | null): [string, string, string] | null {
  if (!options || options.length !== 3) {
    return null;
  }

  return [options[0] ?? "", options[1] ?? "", options[2] ?? ""];
}

function normalizeCorrectOptionIndex(value: number | null): 0 | 1 | 2 | null {
  if (value === 0 || value === 1 || value === 2) {
    return value;
  }

  return null;
}

function createEmptyQuestion(sortOrder: number): QuestionForm {
  return {
    id: crypto.randomUUID(),
    question: "",
    image_asset_id: null,
    imageUrl: null,
    image_alt: "",
    type: "true_false",
    correct: true,
    options: null,
    correct_option_index: null,
    active: true,
    sort_order: sortOrder,
  };
}

function sortQuestions(questions: QuestionForm[]) {
  return [...questions].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

function formFromConfig(config: QuizConfigView): QuizForm {
  return {
    questions: config.questions.map((question, index) => ({ ...question, sort_order: index })),
  };
}

async function questionFromRow(row: QuizQuestionRow): Promise<QuestionForm> {
  const image = await fetchMediaAssetById(row.image_asset_id);
  const type = normalizeQuestionType(row.question_type);

  return {
    id: row.id,
    question: row.question,
    image_asset_id: row.image_asset_id,
    imageUrl: assetUrl(image),
    image_alt: row.image_alt,
    type,
    correct: row.correct_answer,
    options: type === "multiple_choice" ? normalizeOptions(row.options) : null,
    correct_option_index: type === "multiple_choice" ? normalizeCorrectOptionIndex(row.correct_option_index) : null,
    active: row.active,
    sort_order: row.sort_order,
  };
}

async function fetchQuizForm(): Promise<QuizForm | null> {
  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("game_id", "quiz")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  const questions = await Promise.all(((data ?? []) as QuizQuestionRow[]).map(questionFromRow));
  return { questions: sortQuestions(questions) };
}

function modalityPatch(type: QuizQuestionType): Pick<QuestionForm, "type" | "correct" | "options" | "correct_option_index"> {
  if (type === "true_false") {
    return {
      type,
      correct: true,
      options: null,
      correct_option_index: null,
    };
  }

  return {
    type,
    correct: true,
    options: [...EMPTY_OPTIONS],
    correct_option_index: 0,
  };
}

export function QuizEditor({ config }: { config: QuizConfigView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromConfig(config), [config]);
  const [questions, setQuestions] = useState<QuestionForm[]>(initialForm.questions);
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<QuizForm | null>(null);

  const currentForm = useMemo<QuizForm>(() => ({ questions }), [questions]);
  const isDirty = !sameJson(currentForm, baseline);

  const applyForm = useCallback((form: QuizForm) => {
    setQuestions(sortQuestions(form.questions).map((question) => ({ ...question })));
    setBaseline(form);
    setPendingRemote(null);
  }, []);

  const queueRemoteSnapshot = useCallback(async () => {
    const form = await fetchQuizForm();
    if (form) {
      setPendingRemote(form);
      toast.info("Hay cambios externos en Quiz.");
    }
  }, []);

  const handleRemoteForm = useCallback(
    (form: QuizForm) => {
      if (isDirty) {
        setPendingRemote(form);
        toast.info("Hay cambios externos en Quiz.");
        return;
      }

      applyForm(form);
    },
    [applyForm, isDirty],
  );

  useSupabaseRealtime({
    channelName: "panel-cbs-quiz",
    tables: ["quiz_questions", "media_assets"],
    onChange: (table, payload) => {
      if (isDirty) {
        void queueRemoteSnapshot();
        return;
      }

      if (table === "quiz_questions") {
        const quizPayload = payload as RealtimePayload<QuizQuestionRow>;
        const row = (quizPayload.eventType === "DELETE" ? quizPayload.old : quizPayload.new) as Partial<QuizQuestionRow>;
        if (row.game_id && row.game_id !== "quiz") {
          return;
        }

        if (quizPayload.eventType === "DELETE") {
          applyForm({ questions: currentForm.questions.filter((question) => question.id !== row.id) });
          return;
        }

        void questionFromRow(quizPayload.new as QuizQuestionRow).then((nextQuestion) => {
          applyForm({
            questions: sortQuestions([
              nextQuestion,
              ...currentForm.questions.filter((question) => question.id !== nextQuestion.id),
            ]),
          });
        });
        return;
      }

      const mediaPayload = payload as RealtimePayload<MediaAssetRow>;
      const row = (mediaPayload.eventType === "DELETE" ? mediaPayload.old : mediaPayload.new) as Partial<MediaAssetRow>;
      if (!row.id) {
        return;
      }

      const nextQuestions = currentForm.questions.map((question) =>
        question.image_asset_id === row.id
          ? { ...question, imageUrl: mediaPayload.eventType === "DELETE" ? null : assetUrl(mediaPayload.new as MediaAssetRow) }
          : question,
      );
      applyForm({ questions: nextQuestions });
    },
    onReconnect: async () => {
      const form = await fetchQuizForm();
      if (form) {
        handleRemoteForm(form);
      }
    },
  });

  function updateQuestion(id: string, patch: Partial<QuestionForm>) {
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  }

  function setQuestionType(id: string, type: QuizQuestionType) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...modalityPatch(type) } : question)),
    );
  }

  function updateOption(id: string, optionIndex: 0 | 1 | 2, value: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.id !== id) {
          return question;
        }

        const options = [...(question.options ?? EMPTY_OPTIONS)] as [string, string, string];
        options[optionIndex] = value;
        return { ...question, options };
      }),
    );
  }

  function buildInput() {
    return {
      questions: questions.map((question) => ({
        id: question.id,
        question: question.question,
        image_asset_id: question.image_asset_id,
        image_alt: question.image_alt,
        type: question.type,
        correct: question.correct,
        options: question.type === "multiple_choice" ? question.options : null,
        correct_option_index: question.type === "multiple_choice" ? question.correct_option_index : null,
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
      onSuccess: () => {
        setBaseline(currentForm);
        setPendingRemote(null);
      },
    });
  }

  return (
    <div className="space-y-5">
      {pendingRemote ? (
        <PendingRemoteChange onApply={() => applyForm(pendingRemote)} onDismiss={() => setPendingRemote(null)} />
      ) : null}

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
          description="Cada pregunta puede ser Verdadero/Falso u opcion multiple con tres respuestas."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuestions((current) => [...current, createEmptyQuestion(current.length)])}
            >
              <Plus size={15} /> Agregar pregunta
            </Button>
          }
        />
        <CardBody>
          {questions.length === 0 ? <p className="py-6 text-center text-sm text-muted">No hay preguntas. Agrega la primera.</p> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-surface/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-muted">#{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                      Activa
                      <Toggle checked={question.active} onChange={(value) => updateQuestion(question.id, { active: value })} label="Activa" />
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

                <Field label="Modalidad">
                  <div className="flex gap-2">
                    {(
                      [
                        { value: "true_false" as const, label: "Verdadero o falso" },
                        { value: "multiple_choice" as const, label: "Opcion multiple" },
                      ] as const
                    ).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          if (question.type !== value) {
                            setQuestionType(question.id, value);
                          }
                        }}
                        className={cn(
                          "flex h-10 flex-1 items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold transition",
                          question.type === value
                            ? "border-accent bg-accent/12 text-accent"
                            : "border-panel-border bg-white text-muted hover:bg-surface-strong",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Pregunta" required={question.active}>
                  <Textarea
                    value={question.question}
                    onChange={(event) => updateQuestion(question.id, { question: event.target.value })}
                    rows={2}
                    placeholder={
                      question.type === "multiple_choice"
                        ? "Escribe la pregunta..."
                        : "Escribe la afirmacion a evaluar..."
                    }
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

                {question.type === "true_false" ? (
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
                              : "border-panel-border bg-white text-muted hover:bg-surface-strong",
                          )}
                        >
                          <Icon size={15} /> {label}
                        </button>
                      ))}
                    </div>
                  </Field>
                ) : (
                  <Field label="Respuestas" required={question.active}>
                    <div className="space-y-2">
                      {([0, 1, 2] as const).map((optionIndex) => {
                        const isCorrect = question.correct_option_index === optionIndex;

                        return (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestion(question.id, { correct_option_index: optionIndex })}
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition",
                                isCorrect
                                  ? "border-success bg-success/12 text-success"
                                  : "border-panel-border bg-white text-muted hover:bg-surface-strong",
                              )}
                              aria-label={`Marcar respuesta ${optionIndex + 1} como correcta`}
                              title="Marcar como correcta"
                            >
                              <Check size={15} />
                            </button>
                            <Input
                              value={question.options?.[optionIndex] ?? ""}
                              onChange={(event) => updateOption(question.id, optionIndex, event.target.value)}
                              placeholder={`Respuesta ${optionIndex + 1}`}
                              aria-label={`Respuesta ${optionIndex + 1}`}
                            />
                          </div>
                        );
                      })}
                      <p className="text-xs text-muted">Marca con el check cual es la respuesta correcta.</p>
                    </div>
                  </Field>
                )}
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
