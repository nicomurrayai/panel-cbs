"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  RouletteConfigView,
  RouletteSegmentView,
} from "@/lib/data/roulette";
import {
  PRIZE_TYPES,
  PRIZE_TYPE_LABEL,
  rouletteConfigSchema,
} from "@/lib/validation/roulette";
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
import { useAsyncAction } from "@/hooks/useAsyncAction";

type SegForm = {
  id: string;
  label: string;
  prize_type: "prize" | "thanks" | "retry";
  probability_weight: string;
  color: string;
  text_color: string;
  enabled: boolean;
  asset_id: string | null;
  assetUrl: string | null;
  result_title: string;
  result_text: string;
  stock_managed: boolean;
  total_stock: string;
  remaining_stock: number | null;
};

function toForm(s: RouletteSegmentView): SegForm {
  return {
    id: s.id,
    label: s.label,
    prize_type: s.prize_type,
    probability_weight: String(s.probability_weight),
    color: s.color,
    text_color: s.text_color,
    enabled: s.enabled,
    asset_id: s.asset_id,
    assetUrl: s.assetUrl,
    result_title: s.result_title ?? "",
    result_text: s.result_text ?? "",
    stock_managed: s.stock_managed,
    total_stock: s.total_stock != null ? String(s.total_stock) : "",
    remaining_stock: s.remaining_stock,
  };
}

export function RouletteEditor({ config }: { config: RouletteConfigView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();

  const [settings, setSettings] = useState({
    instruction_title: config.settings.instruction_title,
    instruction_text: config.settings.instruction_text,
    spin_label: config.settings.spin_label,
    winner_title: config.settings.winner_title,
    thanks_title: config.settings.thanks_title,
    offline_title: config.settings.offline_title,
    offline_text: config.settings.offline_text,
    duration_ms: String(config.settings.duration_ms),
    min_turns: String(config.settings.min_turns),
  });
  const [segments, setSegments] = useState<SegForm[]>(
    config.segments.map(toForm),
  );

  const totalWeight = useMemo(
    () =>
      segments
        .filter((s) => s.enabled)
        .reduce((acc, s) => acc + (Number(s.probability_weight) || 0), 0),
    [segments],
  );

  function setS(field: keyof typeof settings, value: string) {
    setSettings((prev) => ({ ...prev, [field]: value }));
  }

  function updateSegment(id: string, patch: Partial<SegForm>) {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
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
    setSegments((prev) => prev.filter((s) => s.id !== id));
  }

  function move(index: number, dir: -1 | 1) {
    setSegments((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function buildInput() {
    return {
      settings: {
        ...settings,
        duration_ms: Number(settings.duration_ms) || 0,
        min_turns: Number(settings.min_turns) || 0,
      },
      segments: segments.map((s) => ({
        id: s.id,
        label: s.label,
        prize_type: s.prize_type,
        probability_weight: Number(s.probability_weight) || 0,
        color: s.color,
        text_color: s.text_color,
        enabled: s.enabled,
        asset_id: s.asset_id,
        result_title: s.result_title.trim() ? s.result_title : null,
        result_text: s.result_text.trim() ? s.result_text : null,
        stock_managed: s.stock_managed,
        total_stock: s.stock_managed
          ? Number(s.total_stock) || (s.total_stock === "" ? null : 0)
          : null,
      })),
    };
  }

  const validation = useMemo(
    () => rouletteConfigSchema.safeParse(buildInput()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, segments],
  );

  function save() {
    const input = buildInput();
    const parsed = rouletteConfigSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Configuración inválida.");
      return;
    }
    run(() => saveRouletteConfig(parsed.data), {
      success: "Ruleta guardada",
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <div className="space-y-5">
      {/* Estado de validación */}
      <Card
        className={
          validation.success ? "border-success/40" : "border-danger/40"
        }
      >
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
            Peso total (habilitados):{" "}
            <span className="font-bold text-ink">{totalWeight}</span>
          </div>
        </CardBody>
      </Card>

      {/* Segmentos */}
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
          {segments.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">
              No hay segmentos. Agregá el primero.
            </p>
          )}
          {segments.map((seg, index) => {
            const weight = Number(seg.probability_weight) || 0;
            const pct =
              seg.enabled && totalWeight > 0
                ? ((weight / totalWeight) * 100).toFixed(1)
                : "0.0";
            return (
              <div
                key={seg.id}
                className="rounded-2xl border border-panel-border bg-cream/30 p-4"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold"
                    style={{ background: seg.color, color: seg.text_color }}
                  >
                    {index + 1}
                  </span>
                  <Input
                    value={seg.label}
                    placeholder="Nombre del premio"
                    onChange={(e) =>
                      updateSegment(seg.id, { label: e.target.value })
                    }
                    className="min-w-40 flex-1"
                  />
                  <Badge tone={seg.enabled ? "success" : "neutral"}>
                    {pct}%
                  </Badge>
                  <Toggle
                    checked={seg.enabled}
                    onChange={(v) => updateSegment(seg.id, { enabled: v })}
                    label="Habilitado"
                  />
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
                      onClick={() => removeSegment(seg.id)}
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
                      value={seg.prize_type}
                      onChange={(e) =>
                        updateSegment(seg.id, {
                          prize_type: e.target.value as SegForm["prize_type"],
                        })
                      }
                    >
                      {PRIZE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {PRIZE_TYPE_LABEL[t]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Peso (probabilidad)">
                    <Input
                      type="number"
                      min={0}
                      value={seg.probability_weight}
                      onChange={(e) =>
                        updateSegment(seg.id, {
                          probability_weight: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field label="Color">
                    <ColorField
                      value={seg.color}
                      onChange={(v) => updateSegment(seg.id, { color: v })}
                    />
                  </Field>
                  <Field label="Color del texto">
                    <ColorField
                      value={seg.text_color}
                      onChange={(v) => updateSegment(seg.id, { text_color: v })}
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="Imagen del premio">
                    <ImagePicker
                      label={`Imagen · ${seg.label || "segmento"}`}
                      value={seg.asset_id}
                      valueUrl={seg.assetUrl}
                      onChange={(id, url) =>
                        updateSegment(seg.id, { asset_id: id, assetUrl: url })
                      }
                    />
                  </Field>
                  <div className="space-y-3">
                    <Field label="Título del resultado">
                      <Input
                        value={seg.result_title}
                        onChange={(e) =>
                          updateSegment(seg.id, { result_title: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="Texto del resultado">
                      <Input
                        value={seg.result_text}
                        onChange={(e) =>
                          updateSegment(seg.id, { result_text: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div className="mt-3">
                  <Advanced label="Stock / inventario">
                    <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <Toggle
                        checked={seg.stock_managed}
                        onChange={(v) =>
                          updateSegment(seg.id, { stock_managed: v })
                        }
                        label="Controlar stock"
                      />
                      Controlar stock de este premio
                    </label>
                    {seg.stock_managed && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Stock total"
                          hint="Al guardar, el stock disponible se ajusta a este máximo."
                        >
                          <Input
                            type="number"
                            min={0}
                            value={seg.total_stock}
                            onChange={(e) =>
                              updateSegment(seg.id, {
                                total_stock: e.target.value,
                              })
                            }
                          />
                        </Field>
                        {seg.remaining_stock != null && (
                          <Field label="Disponible actual">
                            <Input value={seg.remaining_stock} disabled readOnly />
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
