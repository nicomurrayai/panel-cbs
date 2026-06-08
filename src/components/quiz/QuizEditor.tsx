"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import type { QuizConfigView } from "@/lib/data/quiz";
import { quizConfigSchema } from "@/lib/validation/quiz";
import { saveQuizConfig } from "@/actions/quiz";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
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
  correct: boolean;
  active: boolean;
  sort_order: number;
};

type QuizForm = {
  questions: QuestionForm[];
};

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
  return {
    id: row.id,
    question: row.question,
    image_asset_id: row.image_asset_id,
    imageUrl: assetUrl(image),
    image_alt: row.image_alt,
    correct: row.correct_answer,
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
                    sort_order: current.length,
                  },
                ])
              }
            >
              <Plus size={15} /> Agregar pregunta
            </Button>
          }
        />
        <CardBody>
          {questions.length === 0 ? <p className="py-6 text-center text-sm text-muted">No hay preguntas. Agrega la primera.</p> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {questions.map((question, index) => (
              <div key={question.id} className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-cream/30 p-4">
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

                <Field label="Pregunta" required={question.active}>
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
