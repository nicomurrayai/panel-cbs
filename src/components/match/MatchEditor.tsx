"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { MatchConfigView } from "@/lib/data/match";
import { matchConfigSchema } from "@/lib/validation/match";
import { saveMatchConfig } from "@/actions/match";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { ImagePicker } from "@/components/media/ImagePicker";
import { PendingRemoteChange } from "@/components/realtime/PendingRemoteChange";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import { sameJson } from "@/lib/realtime/compare";
import { fetchMediaAssetById, type MediaAssetRow } from "@/lib/realtime/mediaAssets";
import type { Database } from "@/types/database.types";

type MatchPairRow = Database["public"]["Tables"]["match_pairs"]["Row"];

type PairForm = {
  id: string;
  text: string;
  image_asset_id: string | null;
  imageUrl: string | null;
  active: boolean;
  sort_order: number;
};

type MatchForm = {
  pairs: PairForm[];
};

function sortPairs(pairs: PairForm[]) {
  return [...pairs].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

function formFromConfig(config: MatchConfigView): MatchForm {
  return {
    pairs: config.pairs.map((pair, index) => ({ ...pair, sort_order: index })),
  };
}

async function pairFromRow(row: MatchPairRow): Promise<PairForm> {
  const image = await fetchMediaAssetById(row.image_asset_id);
  return {
    id: row.id,
    text: row.text,
    image_asset_id: row.image_asset_id,
    imageUrl: assetUrl(image),
    active: row.active,
    sort_order: row.sort_order,
  };
}

async function fetchMatchForm(): Promise<MatchForm | null> {
  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("match_pairs")
    .select("*")
    .eq("game_id", "match")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  const pairs = await Promise.all(((data ?? []) as MatchPairRow[]).map(pairFromRow));
  return { pairs: sortPairs(pairs) };
}

export function MatchEditor({ config }: { config: MatchConfigView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromConfig(config), [config]);
  const [pairs, setPairs] = useState<PairForm[]>(initialForm.pairs);
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<MatchForm | null>(null);

  const currentForm = useMemo<MatchForm>(() => ({ pairs }), [pairs]);
  const isDirty = !sameJson(currentForm, baseline);

  const applyForm = useCallback((form: MatchForm) => {
    setPairs(sortPairs(form.pairs).map((pair) => ({ ...pair })));
    setBaseline(form);
    setPendingRemote(null);
  }, []);

  const queueRemoteSnapshot = useCallback(async () => {
    const form = await fetchMatchForm();
    if (form) {
      setPendingRemote(form);
      toast.info("Hay cambios externos en Relacionar.");
    }
  }, []);

  const handleRemoteForm = useCallback(
    (form: MatchForm) => {
      if (isDirty) {
        setPendingRemote(form);
        toast.info("Hay cambios externos en Relacionar.");
        return;
      }

      applyForm(form);
    },
    [applyForm, isDirty],
  );

  useSupabaseRealtime({
    channelName: "panel-cbs-match",
    tables: ["match_pairs", "media_assets"],
    onChange: (table, payload) => {
      if (isDirty) {
        void queueRemoteSnapshot();
        return;
      }

      if (table === "match_pairs") {
        const matchPayload = payload as RealtimePayload<MatchPairRow>;
        const row = (matchPayload.eventType === "DELETE" ? matchPayload.old : matchPayload.new) as Partial<MatchPairRow>;
        if (row.game_id && row.game_id !== "match") {
          return;
        }

        if (matchPayload.eventType === "DELETE") {
          applyForm({ pairs: currentForm.pairs.filter((pair) => pair.id !== row.id) });
          return;
        }

        void pairFromRow(matchPayload.new as MatchPairRow).then((nextPair) => {
          applyForm({
            pairs: sortPairs([
              nextPair,
              ...currentForm.pairs.filter((pair) => pair.id !== nextPair.id),
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

      const nextPairs = currentForm.pairs.map((pair) =>
        pair.image_asset_id === row.id
          ? { ...pair, imageUrl: mediaPayload.eventType === "DELETE" ? null : assetUrl(mediaPayload.new as MediaAssetRow) }
          : pair,
      );
      applyForm({ pairs: nextPairs });
    },
    onReconnect: async () => {
      const form = await fetchMatchForm();
      if (form) {
        handleRemoteForm(form);
      }
    },
  });

  function updatePair(id: string, patch: Partial<PairForm>) {
    setPairs((current) => current.map((pair) => (pair.id === id ? { ...pair, ...patch } : pair)));
  }

  function buildInput() {
    return {
      pairs: pairs.map((pair) => ({
        id: pair.id,
        text: pair.text,
        image_asset_id: pair.image_asset_id,
        active: pair.active,
      })),
    };
  }

  const validation = useMemo(
    () => matchConfigSchema.safeParse(buildInput()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pairs],
  );

  function save() {
    const parsed = matchConfigSchema.safeParse(buildInput());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
      return;
    }

    run(() => saveMatchConfig(parsed.data), {
      success: "Relacionar guardado",
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
            {pairs.filter((pair) => pair.active).length} pares activos de {pairs.length}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Pares oracion-imagen"
          description="Cada par une una oracion con su imagen. Podes elegir la misma imagen en varios pares para que dos o mas oraciones apunten a una sola imagen. El totem baraja las imagenes al jugar."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setPairs((current) => [
                  ...current,
                  {
                    id: crypto.randomUUID(),
                    text: "",
                    image_asset_id: null,
                    imageUrl: null,
                    active: true,
                    sort_order: current.length,
                  },
                ])
              }
            >
              <Plus size={15} /> Agregar par
            </Button>
          }
        />
        <CardBody>
          {pairs.length === 0 ? <p className="py-6 text-center text-sm text-muted">No hay pares. Agrega el primero.</p> : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.map((pair, index) => (
              <div key={pair.id} className="flex flex-col gap-3 rounded-2xl border border-panel-border bg-cream/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-muted">#{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                      Activa
                      <Toggle checked={pair.active} onChange={(value) => updatePair(pair.id, { active: value })} label="Activa" />
                    </label>
                    <button
                      type="button"
                      onClick={() => setPairs((current) => current.filter((item) => item.id !== pair.id))}
                      className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                      aria-label="Eliminar par"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <Field label="Oracion" required={pair.active}>
                  <Textarea
                    value={pair.text}
                    onChange={(event) => updatePair(pair.id, { text: event.target.value })}
                    rows={2}
                    placeholder="Escribe la oracion a relacionar..."
                  />
                </Field>

                <Field label="Imagen" required={pair.active}>
                  <ImagePicker
                    label={`Imagen par ${index + 1}`}
                    value={pair.image_asset_id}
                    valueUrl={pair.imageUrl}
                    onChange={(id, url) => updatePair(pair.id, { image_asset_id: id, imageUrl: url })}
                  />
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
