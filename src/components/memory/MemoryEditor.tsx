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
import { DirectImageUpload } from "@/components/media/DirectImageUpload";
import { useAsyncAction } from "@/hooks/useAsyncAction";

type CardForm = {
  id: string;
  asset_id: string | null;
  assetUrl: string | null;
  active: boolean;
};

export function MemoryEditor({ config }: { config: MemoryConfigView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(String(config.time_limit_seconds));
  const [cards, setCards] = useState<CardForm[]>(config.cards.map((card) => ({ ...card })));

  function updateCard(id: string, patch: Partial<CardForm>) {
    setCards((current) => current.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  }

  function addCard() {
    setCards((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        asset_id: null,
        assetUrl: null,
        active: true,
      },
    ]);
  }

  function buildInput() {
    return {
      time_limit_seconds: Number(timeLimitSeconds) || 0,
      cards: cards.map((card) => ({
        id: card.id,
        asset_id: card.asset_id,
        active: card.active,
      })),
    };
  }

  function save() {
    const parsed = memoryConfigSchema.safeParse(buildInput());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
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
          title="Configuracion"
          description="Define el tiempo maximo y las imagenes disponibles para armar el tablero."
        />
        <CardBody>
          <Field label="Tiempo maximo (seg)">
            <Input
              type="number"
              min={10}
              max={600}
              value={timeLimitSeconds}
              onChange={(event) => setTimeLimitSeconds(event.target.value)}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Cartas"
          description="Cada imagen representa un par. El totem duplica automaticamente cada carta."
          actions={
            <Button variant="secondary" size="sm" onClick={addCard}>
              <Plus size={15} /> Agregar carta
            </Button>
          }
        />
        <CardBody>
          {cards.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No hay cartas. Agrega la primera.</p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <div
                key={card.id}
                className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-cream/30 p-3"
              >
                <DirectImageUpload
                  label={`Carta ${index + 1}`}
                  value={card.asset_id}
                  valueUrl={card.assetUrl}
                  onChange={(id, url) => updateCard(card.id, { asset_id: id, assetUrl: url })}
                />

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                    Activa
                    <Toggle
                      checked={card.active}
                      onChange={(value) => updateCard(card.id, { active: value })}
                      label="Activa"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCards((current) => current.filter((item) => item.id !== card.id))}
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
        <Button onClick={save} loading={isPending} className="shadow-soft">
          <Save size={16} /> Guardar configuracion
        </Button>
      </div>
    </div>
  );
}
