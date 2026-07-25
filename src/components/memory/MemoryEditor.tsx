"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MemoryConfigView } from "@/lib/data/memory";
import {
  MEMORY_PLAYER_MODE_OPTIONS,
  memoryConfigSchema,
  type MemoryPlayerMode,
} from "@/lib/validation/memory";
import { saveMemoryConfig } from "@/actions/memory";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/cn";
import { DirectImageUpload } from "@/components/media/DirectImageUpload";
import { PendingRemoteChange } from "@/components/realtime/PendingRemoteChange";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import { sameJson } from "@/lib/realtime/compare";
import { fetchMediaAssetById, type MediaAssetRow } from "@/lib/realtime/mediaAssets";
import type { Database } from "@/types/database.types";

type MemorySettingsRow = Database["public"]["Tables"]["memory_settings"]["Row"];
type MemoryCardRow = Database["public"]["Tables"]["memory_card_faces"]["Row"];

type CardForm = {
  id: string;
  asset_id: string | null;
  assetUrl: string | null;
  active: boolean;
  sort_order: number;
};

type MemoryForm = {
  time_limit_seconds: string;
  player_mode: MemoryPlayerMode;
  cards: CardForm[];
};

function sortCards(cards: CardForm[]) {
  return [...cards].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

function formFromConfig(config: MemoryConfigView): MemoryForm {
  return {
    time_limit_seconds: String(config.time_limit_seconds),
    player_mode: config.player_mode,
    cards: config.cards.map((card, index) => ({ ...card, sort_order: index })),
  };
}

async function cardFromRow(row: MemoryCardRow): Promise<CardForm> {
  const asset = await fetchMediaAssetById(row.asset_id);
  return {
    id: row.id,
    asset_id: row.asset_id,
    assetUrl: assetUrl(asset),
    active: row.active,
    sort_order: row.sort_order,
  };
}

async function fetchMemoryForm(): Promise<MemoryForm | null> {
  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const [settingsRes, cardsRes] = await Promise.all([
    supabase.from("memory_settings").select("*").eq("game_id", "memory").maybeSingle(),
    supabase.from("memory_card_faces").select("*").eq("game_id", "memory").order("sort_order", { ascending: true }),
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (cardsRes.error) throw cardsRes.error;

  const cards = await Promise.all(((cardsRes.data ?? []) as MemoryCardRow[]).map(cardFromRow));
  const playerMode = settingsRes.data?.player_mode;
  return {
    time_limit_seconds: String(settingsRes.data?.time_limit_seconds ?? 60),
    player_mode:
      playerMode === "two" || playerMode === "selectable" || playerMode === "one" ? playerMode : "one",
    cards: sortCards(cards),
  };
}

export function MemoryEditor({ config }: { config: MemoryConfigView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromConfig(config), [config]);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(initialForm.time_limit_seconds);
  const [playerMode, setPlayerMode] = useState<MemoryPlayerMode>(initialForm.player_mode);
  const [cards, setCards] = useState<CardForm[]>(initialForm.cards.map((card) => ({ ...card })));
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<MemoryForm | null>(null);

  const currentForm = useMemo<MemoryForm>(
    () => ({ time_limit_seconds: timeLimitSeconds, player_mode: playerMode, cards }),
    [cards, playerMode, timeLimitSeconds],
  );
  const isDirty = !sameJson(currentForm, baseline);

  const applyForm = useCallback((form: MemoryForm) => {
    setTimeLimitSeconds(form.time_limit_seconds);
    setPlayerMode(form.player_mode);
    setCards(sortCards(form.cards).map((card) => ({ ...card })));
    setBaseline(form);
    setPendingRemote(null);
  }, []);

  const queueRemoteSnapshot = useCallback(async () => {
    const form = await fetchMemoryForm();
    if (form) {
      setPendingRemote(form);
      toast.info("Hay cambios externos en Memory.");
    }
  }, []);

  const handleRemoteForm = useCallback(
    (form: MemoryForm) => {
      if (isDirty) {
        setPendingRemote(form);
        toast.info("Hay cambios externos en Memory.");
        return;
      }

      applyForm(form);
    },
    [applyForm, isDirty],
  );

  useSupabaseRealtime({
    channelName: "panel-cbs-memory",
    tables: ["memory_settings", "memory_card_faces", "media_assets"],
    onChange: (table, payload) => {
      if (isDirty) {
        void queueRemoteSnapshot();
        return;
      }

      if (table === "memory_settings") {
        const row = (payload as RealtimePayload<MemorySettingsRow>).new;
        if (payload.eventType !== "DELETE" && row.game_id === "memory") {
          const mode = row.player_mode;
          const next = {
            ...currentForm,
            time_limit_seconds: String(row.time_limit_seconds),
            player_mode:
              mode === "two" || mode === "selectable" || mode === "one" ? mode : currentForm.player_mode,
          };
          applyForm(next);
        }
        return;
      }

      if (table === "memory_card_faces") {
        const memoryPayload = payload as RealtimePayload<MemoryCardRow>;
        const row = (memoryPayload.eventType === "DELETE" ? memoryPayload.old : memoryPayload.new) as Partial<MemoryCardRow>;
        if (row.game_id && row.game_id !== "memory") {
          return;
        }

        if (memoryPayload.eventType === "DELETE") {
          applyForm({ ...currentForm, cards: currentForm.cards.filter((card) => card.id !== row.id) });
          return;
        }

        void cardFromRow(memoryPayload.new as MemoryCardRow).then((nextCard) => {
          applyForm({
            ...currentForm,
            cards: sortCards([nextCard, ...currentForm.cards.filter((card) => card.id !== nextCard.id)]),
          });
        });
        return;
      }

      const mediaPayload = payload as RealtimePayload<MediaAssetRow>;
      const row = (mediaPayload.eventType === "DELETE" ? mediaPayload.old : mediaPayload.new) as Partial<MediaAssetRow>;
      if (!row.id) {
        return;
      }

      const nextCards = currentForm.cards.map((card) =>
        card.asset_id === row.id
          ? { ...card, assetUrl: mediaPayload.eventType === "DELETE" ? null : assetUrl(mediaPayload.new as MediaAssetRow) }
          : card,
      );
      applyForm({ ...currentForm, cards: nextCards });
    },
    onReconnect: async () => {
      const form = await fetchMemoryForm();
      if (form) {
        handleRemoteForm(form);
      }
    },
  });

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
        sort_order: current.length,
      },
    ]);
  }

  function buildInput() {
    return {
      time_limit_seconds: Number(timeLimitSeconds) || 0,
      player_mode: playerMode,
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

      <Card>
        <CardHeader
          title="Configuracion"
          description="Tiempo, modo de jugadores e imagenes disponibles para armar el tablero."
        />
        <CardBody className="space-y-5">
          <Field label="Tiempo maximo (seg)">
            <Input
              type="number"
              min={10}
              max={600}
              value={timeLimitSeconds}
              onChange={(event) => setTimeLimitSeconds(event.target.value)}
            />
          </Field>

          <Field label="Modo de jugadores">
            <div className="grid gap-2">
              {MEMORY_PLAYER_MODE_OPTIONS.map((option) => {
                const active = playerMode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPlayerMode(option.value)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      active
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-panel-border bg-white hover:border-accent/50",
                    )}
                  >
                    <p className="text-sm font-bold text-ink">{option.label}</p>
                    <p className="mt-0.5 text-xs text-muted">{option.description}</p>
                  </button>
                );
              })}
            </div>
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
          {cards.length === 0 ? <p className="py-6 text-center text-sm text-muted">No hay cartas. Agrega la primera.</p> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <div key={card.id} className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-surface/30 p-3">
                <DirectImageUpload
                  label={`Carta ${index + 1}`}
                  value={card.asset_id}
                  valueUrl={card.assetUrl}
                  onChange={(id, url) => updateCard(card.id, { asset_id: id, assetUrl: url })}
                />

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                    Activa
                    <Toggle checked={card.active} onChange={(value) => updateCard(card.id, { active: value })} label="Activa" />
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
