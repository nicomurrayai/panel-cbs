"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import type { MemoryConfigView } from "@/lib/data/memory";
import { memoryConfigSchema } from "@/lib/validation/memory";
import { saveMemoryConfig } from "@/actions/memory";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ColorField } from "@/components/forms/ColorField";
import { ImagePicker } from "@/components/media/ImagePicker";
import { useAsyncAction } from "@/hooks/useAsyncAction";

type CardForm = {
  id: string;
  pair_key: string;
  label: string;
  asset_label: string;
  asset_id: string | null;
  assetUrl: string | null;
  accent_color: string;
  active: boolean;
};

export function MemoryEditor({ config }: { config: MemoryConfigView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();

  const [level, setLevel] = useState({
    difficulty: config.level.difficulty,
    rows: String(config.level.rows),
    columns: String(config.level.columns),
    time_limit_seconds: String(config.level.time_limit_seconds),
    reveal_delay_ms: String(config.level.reveal_delay_ms),
    max_attempts: String(config.level.max_attempts),
    instruction_title: config.level.instruction_title,
    instruction_text: config.level.instruction_text,
    victory_title: config.level.victory_title,
    victory_text: config.level.victory_text,
    timeout_title: config.level.timeout_title,
    timeout_text: config.level.timeout_text,
    active: config.level.active,
  });
  const [cards, setCards] = useState<CardForm[]>(
    config.cards.map((c) => ({ ...c })),
  );

  function setL(field: keyof typeof level, value: string | boolean) {
    setLevel((prev) => ({ ...prev, [field]: value }));
  }

  function updateCard(id: string, patch: Partial<CardForm>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCard() {
    setCards((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        pair_key: `par-${prev.length + 1}`,
        label: "",
        asset_label: "",
        asset_id: null,
        assetUrl: null,
        accent_color: "#f5a400",
        active: true,
      },
    ]);
  }

  function buildInput() {
    return {
      levelId: config.levelId || null,
      level: {
        difficulty: level.difficulty,
        rows: Number(level.rows) || 0,
        columns: Number(level.columns) || 0,
        time_limit_seconds: Number(level.time_limit_seconds) || 0,
        reveal_delay_ms: Number(level.reveal_delay_ms) || 0,
        max_attempts: Number(level.max_attempts) || 0,
        instruction_title: level.instruction_title,
        instruction_text: level.instruction_text,
        victory_title: level.victory_title,
        victory_text: level.victory_text,
        timeout_title: level.timeout_title,
        timeout_text: level.timeout_text,
        active: level.active,
      },
      cards: cards.map((c) => ({
        id: c.id,
        pair_key: c.pair_key,
        label: c.label,
        asset_label: c.asset_label,
        asset_id: c.asset_id,
        accent_color: c.accent_color,
        active: c.active,
      })),
    };
  }

  function save() {
    const parsed = memoryConfigSchema.safeParse(buildInput());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuración inválida.");
      return;
    }
    run(() => saveMemoryConfig(parsed.data), {
      success: "Memory guardado",
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Cartas (pares)"
          description="Cada carta es un par. Necesitás al menos tantos pares activos como la mitad de las cartas."
          actions={
            <Button variant="secondary" size="sm" onClick={addCard}>
              <Plus size={15} /> Agregar carta
            </Button>
          }
        />
        <CardBody>
          {cards.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              No hay cartas. Agregá la primera.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-cream/30 p-3"
            >
              <ImagePicker
                label={`Carta · ${c.label || c.pair_key}`}
                value={c.asset_id}
                valueUrl={c.assetUrl}
                onChange={(id, url) =>
                  updateCard(c.id, { asset_id: id, assetUrl: url })
                }
              />
              <div className="grid gap-2">
                <Field label="Nombre">
                  <Input
                    value={c.label}
                    placeholder="Ej: Tractor"
                    onChange={(e) => updateCard(c.id, { label: e.target.value })}
                  />
                </Field>
                <Field label="Etiqueta en la carta" hint="Texto corto si no hay imagen">
                  <Input
                    value={c.asset_label}
                    maxLength={24}
                    onChange={(e) =>
                      updateCard(c.id, { asset_label: e.target.value })
                    }
                  />
                </Field>
                <Field label="Clave de par">
                  <Input
                    value={c.pair_key}
                    onChange={(e) =>
                      updateCard(c.id, { pair_key: e.target.value })
                    }
                  />
                </Field>
                <Field label="Color">
                  <ColorField
                    value={c.accent_color}
                    onChange={(v) => updateCard(c.id, { accent_color: v })}
                  />
                </Field>
              </div>
              <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                  Activa
                  <Toggle
                    checked={c.active}
                    onChange={(v) => updateCard(c.id, { active: v })}
                    label="Activa"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setCards((p) => p.filter((x) => x.id !== c.id))}
                  className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                  aria-label="Eliminar carta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button
          onClick={save}
          loading={isPending}
          className="shadow-soft"
        >
          <Save size={16} /> Guardar configuración
        </Button>
      </div>
    </div>
  );
}
