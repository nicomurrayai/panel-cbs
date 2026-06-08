"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { RouletteConfigView, RouletteSegmentView } from "@/lib/data/roulette";
import { PRIZE_TYPES, PRIZE_TYPE_LABEL, rouletteConfigSchema } from "@/lib/validation/roulette";
import { saveRouletteConfig } from "@/actions/roulette";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Advanced } from "@/components/ui/Advanced";
import { ColorField } from "@/components/forms/ColorField";
import { ImagePicker } from "@/components/media/ImagePicker";
import { PendingRemoteChange } from "@/components/realtime/PendingRemoteChange";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import { sameJson } from "@/lib/realtime/compare";
import { fetchMediaAssetById, type MediaAssetRow } from "@/lib/realtime/mediaAssets";
import type { Database } from "@/types/database.types";

type RouletteSettingsRow = Database["public"]["Tables"]["roulette_settings"]["Row"];
type RouletteSegmentRow = Database["public"]["Tables"]["roulette_segments"]["Row"];
type RouletteInventoryRow = Database["public"]["Tables"]["roulette_prize_inventory"]["Row"];

type SettingsForm = {
  instruction_title: string;
  instruction_text: string;
  spin_label: string;
  winner_title: string;
  thanks_title: string;
  offline_title: string;
  offline_text: string;
  duration_ms: string;
  min_turns: string;
};

type SegForm = {
  id: string;
  label: string;
  prize_type: "prize" | "thanks" | "retry";
  probability_weight: string;
  color: string;
  text_color: string;
  enabled: boolean;
  sort_order: number;
  asset_id: string | null;
  assetUrl: string | null;
  result_title: string;
  result_text: string;
  stock_managed: boolean;
  total_stock: string;
  remaining_stock: number | null;
};

type RouletteForm = {
  settings: SettingsForm;
  segments: SegForm[];
};

const DEFAULT_SETTINGS: SettingsForm = {
  instruction_title: "",
  instruction_text: "",
  spin_label: "Girar",
  winner_title: "",
  thanks_title: "",
  offline_title: "",
  offline_text: "",
  duration_ms: "3800",
  min_turns: "5",
};

function settingsFromView(config: RouletteConfigView): SettingsForm {
  return {
    instruction_title: config.settings.instruction_title,
    instruction_text: config.settings.instruction_text,
    spin_label: config.settings.spin_label,
    winner_title: config.settings.winner_title,
    thanks_title: config.settings.thanks_title,
    offline_title: config.settings.offline_title,
    offline_text: config.settings.offline_text,
    duration_ms: String(config.settings.duration_ms),
    min_turns: String(config.settings.min_turns),
  };
}

function settingsFromRow(row: RouletteSettingsRow | null): SettingsForm {
  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return {
    instruction_title: row.instruction_title,
    instruction_text: row.instruction_text,
    spin_label: row.spin_label,
    winner_title: row.winner_title,
    thanks_title: row.thanks_title,
    offline_title: row.offline_title,
    offline_text: row.offline_text,
    duration_ms: String(row.duration_ms),
    min_turns: String(row.min_turns),
  };
}

function sortSegments(segments: SegForm[]) {
  return [...segments].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
}

function toForm(segment: RouletteSegmentView): SegForm {
  return {
    id: segment.id,
    label: segment.label,
    prize_type: segment.prize_type,
    probability_weight: String(segment.probability_weight),
    color: segment.color,
    text_color: segment.text_color,
    enabled: segment.enabled,
    sort_order: segment.sort_order,
    asset_id: segment.asset_id,
    assetUrl: segment.assetUrl,
    result_title: segment.result_title ?? "",
    result_text: segment.result_text ?? "",
    stock_managed: segment.stock_managed,
    total_stock: segment.total_stock != null ? String(segment.total_stock) : "",
    remaining_stock: segment.remaining_stock,
  };
}

async function segmentFromRow(row: RouletteSegmentRow, inventory?: RouletteInventoryRow | null): Promise<SegForm> {
  const asset = await fetchMediaAssetById(row.asset_id);
  return {
    id: row.id,
    label: row.label,
    prize_type: row.prize_type as SegForm["prize_type"],
    probability_weight: String(row.probability_weight),
    color: row.color,
    text_color: row.text_color,
    enabled: row.enabled,
    sort_order: row.sort_order,
    asset_id: row.asset_id,
    assetUrl: assetUrl(asset),
    result_title: row.result_title ?? "",
    result_text: row.result_text ?? "",
    stock_managed: row.stock_managed,
    total_stock: inventory?.total_stock != null ? String(inventory.total_stock) : "",
    remaining_stock: inventory?.remaining_stock ?? null,
  };
}

async function fetchRouletteForm(): Promise<RouletteForm | null> {
  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const [settingsRes, segmentsRes, inventoryRes] = await Promise.all([
    supabase.from("roulette_settings").select("*").eq("game_id", "roulette").maybeSingle(),
    supabase.from("roulette_segments").select("*").eq("game_id", "roulette").order("sort_order", { ascending: true }),
    supabase.from("roulette_prize_inventory").select("*"),
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (segmentsRes.error) throw segmentsRes.error;
  if (inventoryRes.error) throw inventoryRes.error;

  const inventoryBySegment = new Map((inventoryRes.data ?? []).map((row) => [row.segment_id, row as RouletteInventoryRow]));
  const segments = await Promise.all(
    ((segmentsRes.data ?? []) as RouletteSegmentRow[]).map((row) => segmentFromRow(row, inventoryBySegment.get(row.id))),
  );

  return {
    settings: settingsFromRow((settingsRes.data as RouletteSettingsRow | null) ?? null),
    segments: sortSegments(segments),
  };
}

function formFromConfig(config: RouletteConfigView): RouletteForm {
  return {
    settings: settingsFromView(config),
    segments: config.segments.map(toForm),
  };
}

export function RouletteEditor({ config }: { config: RouletteConfigView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromConfig(config), [config]);
  const [settings, setSettings] = useState(initialForm.settings);
  const [segments, setSegments] = useState<SegForm[]>(initialForm.segments);
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<RouletteForm | null>(null);

  const currentForm = useMemo<RouletteForm>(() => ({ settings, segments }), [segments, settings]);
  const isDirty = !sameJson(currentForm, baseline);

  const applyForm = useCallback((form: RouletteForm) => {
    setSettings(form.settings);
    setSegments(sortSegments(form.segments).map((segment) => ({ ...segment })));
    setBaseline(form);
    setPendingRemote(null);
  }, []);

  const queueRemoteSnapshot = useCallback(async () => {
    const form = await fetchRouletteForm();
    if (form) {
      setPendingRemote(form);
      toast.info("Hay cambios externos en Ruleta.");
    }
  }, []);

  const handleRemoteForm = useCallback(
    (form: RouletteForm) => {
      if (isDirty) {
        setPendingRemote(form);
        toast.info("Hay cambios externos en Ruleta.");
        return;
      }

      applyForm(form);
    },
    [applyForm, isDirty],
  );

  useSupabaseRealtime({
    channelName: "panel-cbs-roulette",
    tables: ["roulette_settings", "roulette_segments", "roulette_prize_inventory", "media_assets"],
    onChange: (table, payload) => {
      if (isDirty) {
        void queueRemoteSnapshot();
        return;
      }

      if (table === "roulette_settings") {
        const row = (payload as RealtimePayload<RouletteSettingsRow>).new;
        if (payload.eventType !== "DELETE" && row.game_id === "roulette") {
          applyForm({ ...currentForm, settings: settingsFromRow(row as RouletteSettingsRow) });
        }
        return;
      }

      if (table === "roulette_segments") {
        const segmentPayload = payload as RealtimePayload<RouletteSegmentRow>;
        const row = (segmentPayload.eventType === "DELETE" ? segmentPayload.old : segmentPayload.new) as Partial<RouletteSegmentRow>;
        if (row.game_id && row.game_id !== "roulette") {
          return;
        }

        if (segmentPayload.eventType === "DELETE") {
          applyForm({ ...currentForm, segments: currentForm.segments.filter((segment) => segment.id !== row.id) });
          return;
        }

        const inventory = currentForm.segments.find((segment) => segment.id === row.id);
        void segmentFromRow(segmentPayload.new as RouletteSegmentRow, inventory
          ? {
              segment_id: inventory.id,
              total_stock: Number(inventory.total_stock) || 0,
              remaining_stock: inventory.remaining_stock ?? 0,
              awarded_count: 0,
              reserved_stock: 0,
              updated_at: "",
            }
          : null,
        ).then((nextSegment) => {
          applyForm({
            ...currentForm,
            segments: sortSegments([
              nextSegment,
              ...currentForm.segments.filter((segment) => segment.id !== nextSegment.id),
            ]),
          });
        });
        return;
      }

      if (table === "roulette_prize_inventory") {
        const inventoryPayload = payload as RealtimePayload<RouletteInventoryRow>;
        const row = (inventoryPayload.eventType === "DELETE" ? inventoryPayload.old : inventoryPayload.new) as Partial<RouletteInventoryRow>;
        if (!row.segment_id) {
          return;
        }

        const nextSegments = currentForm.segments.map((segment) => {
          if (segment.id !== row.segment_id) {
            return segment;
          }

          if (inventoryPayload.eventType === "DELETE") {
            return { ...segment, total_stock: "", remaining_stock: null };
          }

          const nextInventory = inventoryPayload.new as RouletteInventoryRow;
          return {
            ...segment,
            total_stock: String(nextInventory.total_stock),
            remaining_stock: nextInventory.remaining_stock,
          };
        });
        applyForm({ ...currentForm, segments: nextSegments });
        return;
      }

      const mediaPayload = payload as RealtimePayload<MediaAssetRow>;
      const row = (mediaPayload.eventType === "DELETE" ? mediaPayload.old : mediaPayload.new) as Partial<MediaAssetRow>;
      if (!row.id) {
        return;
      }

      const nextSegments = currentForm.segments.map((segment) =>
        segment.asset_id === row.id
          ? { ...segment, assetUrl: mediaPayload.eventType === "DELETE" ? null : assetUrl(mediaPayload.new as MediaAssetRow) }
          : segment,
      );
      applyForm({ ...currentForm, segments: nextSegments });
    },
    onReconnect: async () => {
      const form = await fetchRouletteForm();
      if (form) {
        handleRemoteForm(form);
      }
    },
  });

  const totalWeight = useMemo(
    () =>
      segments
        .filter((segment) => segment.enabled)
        .reduce((acc, segment) => acc + (Number(segment.probability_weight) || 0), 0),
    [segments],
  );

  function updateSegment(id: string, patch: Partial<SegForm>) {
    setSegments((prev) => prev.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)));
  }

  function addSegment() {
    setSegments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        prize_type: "prize",
        probability_weight: "1",
        color: "#ffd100",
        text_color: "#17171d",
        enabled: true,
        sort_order: prev.length,
        asset_id: null,
        assetUrl: null,
        result_title: "",
        result_text: "",
        stock_managed: false,
        total_stock: "",
        remaining_stock: null,
      },
    ]);
  }

  function removeSegment(id: string) {
    setSegments((prev) => prev.filter((segment) => segment.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    setSegments((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((segment, nextIndex) => ({ ...segment, sort_order: nextIndex }));
    });
  }

  function buildInput() {
    return {
      settings: {
        ...settings,
        duration_ms: Number(settings.duration_ms) || 0,
        min_turns: Number(settings.min_turns) || 0,
      },
      segments: segments.map((segment, index) => ({
        id: segment.id,
        label: segment.label,
        prize_type: segment.prize_type,
        probability_weight: Number(segment.probability_weight) || 0,
        color: segment.color,
        text_color: segment.text_color,
        enabled: segment.enabled,
        asset_id: segment.asset_id,
        result_title: segment.result_title.trim() ? segment.result_title : null,
        result_text: segment.result_text.trim() ? segment.result_text : null,
        stock_managed: segment.stock_managed,
        total_stock: segment.stock_managed
          ? Number(segment.total_stock) || (segment.total_stock === "" ? null : 0)
          : null,
        sort_order: index,
      })),
    };
  }

  const validation = useMemo(
    () => rouletteConfigSchema.safeParse(buildInput()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [segments, settings],
  );

  function save() {
    const parsed = rouletteConfigSchema.safeParse(buildInput());
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuracion invalida.");
      return;
    }

    run(() => saveRouletteConfig(parsed.data), {
      success: "Ruleta guardada",
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
            Peso total (habilitados): <span className="font-bold text-ink">{totalWeight}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Segmentos y premios"
          description="La probabilidad de cada premio se calcula a partir de su peso."
          actions={
            <Button variant="secondary" size="sm" onClick={addSegment}>
              <Plus size={15} /> Agregar segmento
            </Button>
          }
        />
        <CardBody className="space-y-4">
          {segments.length === 0 ? <p className="py-6 text-center text-sm text-muted">No hay segmentos. Agrega el primero.</p> : null}
          {segments.map((segment, index) => {
            const weight = Number(segment.probability_weight) || 0;
            const pct = segment.enabled && totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : "0.0";
            return (
              <div key={segment.id} className="rounded-2xl border border-panel-border bg-cream/30 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                    style={{ background: segment.color, color: segment.text_color }}
                  >
                    {index + 1}
                  </span>
                  <Input
                    value={segment.label}
                    placeholder="Nombre del premio"
                    onChange={(event) => updateSegment(segment.id, { label: event.target.value })}
                    className="min-w-40 flex-1"
                  />
                  <Badge tone={segment.enabled ? "success" : "neutral"}>{pct}%</Badge>
                  <Toggle checked={segment.enabled} onChange={(value) => updateSegment(segment.id, { enabled: value })} label="Habilitado" />
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="rounded-lg p-1.5 text-muted hover:bg-black/5 disabled:opacity-30"
                      aria-label="Subir"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === segments.length - 1}
                      className="rounded-lg p-1.5 text-muted hover:bg-black/5 disabled:opacity-30"
                      aria-label="Bajar"
                    >
                      <ChevronDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSegment(segment.id)}
                      className="rounded-lg p-1.5 text-danger hover:bg-danger/10"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Tipo">
                    <Select
                      value={segment.prize_type}
                      onChange={(event) => updateSegment(segment.id, { prize_type: event.target.value as SegForm["prize_type"] })}
                    >
                      {PRIZE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {PRIZE_TYPE_LABEL[type]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Peso (probabilidad)">
                    <Input
                      type="number"
                      min={0}
                      value={segment.probability_weight}
                      onChange={(event) => updateSegment(segment.id, { probability_weight: event.target.value })}
                    />
                  </Field>
                  <Field label="Color">
                    <ColorField value={segment.color} onChange={(value) => updateSegment(segment.id, { color: value })} />
                  </Field>
                  <Field label="Color del texto">
                    <ColorField value={segment.text_color} onChange={(value) => updateSegment(segment.id, { text_color: value })} />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Imagen del premio">
                    <ImagePicker
                      label={`Imagen - ${segment.label || "segmento"}`}
                      value={segment.asset_id}
                      valueUrl={segment.assetUrl}
                      onChange={(id, url) => updateSegment(segment.id, { asset_id: id, assetUrl: url })}
                    />
                  </Field>
                  <div className="space-y-3">
                    <Field label="Titulo del resultado">
                      <Input value={segment.result_title} onChange={(event) => updateSegment(segment.id, { result_title: event.target.value })} />
                    </Field>
                    <Field label="Texto del resultado">
                      <Input value={segment.result_text} onChange={(event) => updateSegment(segment.id, { result_text: event.target.value })} />
                    </Field>
                  </div>
                </div>

                <div className="mt-3">
                  <Advanced label="Stock / inventario">
                    <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Toggle checked={segment.stock_managed} onChange={(value) => updateSegment(segment.id, { stock_managed: value })} label="Controlar stock" />
                      Controlar stock de este premio
                    </label>
                    {segment.stock_managed && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Stock total" hint="Al guardar, el stock disponible se ajusta a este maximo.">
                          <Input
                            type="number"
                            min={0}
                            value={segment.total_stock}
                            onChange={(event) => updateSegment(segment.id, { total_stock: event.target.value })}
                          />
                        </Field>
                        {segment.remaining_stock != null && (
                          <Field label="Disponible actual">
                            <Input value={segment.remaining_stock} disabled readOnly />
                          </Field>
                        )}
                      </div>
                    )}
                  </Advanced>
                </div>
              </div>
            );
          })}
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
