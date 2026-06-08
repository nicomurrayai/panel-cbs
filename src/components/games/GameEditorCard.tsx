"use client";

import { useCallback, useMemo, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import type { GameEditView } from "@/lib/data/games";
import { gameLabel } from "@/lib/games";
import { updateGame } from "@/actions/games";
import { gameUpdateSchema } from "@/lib/validation/games";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Advanced } from "@/components/ui/Advanced";
import { ImagePicker } from "@/components/media/ImagePicker";
import { ColorField } from "@/components/forms/ColorField";
import { PendingRemoteChange } from "@/components/realtime/PendingRemoteChange";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import { sameJson } from "@/lib/realtime/compare";
import { fetchMediaAssetById, type MediaAssetRow } from "@/lib/realtime/mediaAssets";
import type { Database } from "@/types/database.types";

type GameRow = Database["public"]["Tables"]["games"]["Row"];

type GameForm = {
  title: string;
  description: string;
  cta_label: string;
  sort_order: string;
  visible: boolean;
  enabled: boolean;
  accent_color: string;
  maintenance_mode: boolean;
  maintenance_title: string;
  maintenance_text: string;
  cover_asset_id: string | null;
  coverUrl: string | null;
};

function formFromView(game: GameEditView): GameForm {
  return {
    title: game.title,
    description: game.description,
    cta_label: game.cta_label,
    sort_order: String(game.sort_order),
    visible: game.visible,
    enabled: game.enabled,
    accent_color: game.accent_color ?? "#f5a400",
    maintenance_mode: game.maintenance_mode,
    maintenance_title: game.maintenance_title ?? "",
    maintenance_text: game.maintenance_text ?? "",
    cover_asset_id: game.cover_asset_id,
    coverUrl: game.coverUrl,
  };
}

async function formFromRow(row: GameRow): Promise<GameForm> {
  const cover = await fetchMediaAssetById(row.cover_asset_id);
  return {
    title: row.title,
    description: row.description,
    cta_label: row.cta_label,
    sort_order: String(row.sort_order),
    visible: row.visible,
    enabled: row.enabled,
    accent_color: row.accent_color ?? "#f5a400",
    maintenance_mode: row.maintenance_mode,
    maintenance_title: row.maintenance_title ?? "",
    maintenance_text: row.maintenance_text ?? "",
    cover_asset_id: row.cover_asset_id,
    coverUrl: assetUrl(cover),
  };
}

async function fetchGameForm(id: string) {
  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (error) {
    throw error;
  }

  return data ? formFromRow(data) : null;
}

export function GameEditorCard({ game }: { game: GameEditView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromView(game), [game]);

  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description);
  const [ctaLabel, setCtaLabel] = useState(initialForm.cta_label);
  const [sortOrder, setSortOrder] = useState(initialForm.sort_order);
  const [visible, setVisible] = useState(initialForm.visible);
  const [enabled, setEnabled] = useState(initialForm.enabled);
  const [accent, setAccent] = useState(initialForm.accent_color);
  const [maintenance, setMaintenance] = useState(initialForm.maintenance_mode);
  const [mTitle, setMTitle] = useState(initialForm.maintenance_title);
  const [mText, setMText] = useState(initialForm.maintenance_text);
  const [coverId, setCoverId] = useState(initialForm.cover_asset_id);
  const [coverUrl, setCoverUrl] = useState(initialForm.coverUrl);
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<GameForm | null>(null);

  const currentForm = useMemo<GameForm>(
    () => ({
      title,
      description,
      cta_label: ctaLabel,
      sort_order: sortOrder,
      visible,
      enabled,
      accent_color: accent,
      maintenance_mode: maintenance,
      maintenance_title: mTitle,
      maintenance_text: mText,
      cover_asset_id: coverId,
      coverUrl,
    }),
    [accent, coverId, coverUrl, ctaLabel, description, enabled, mText, mTitle, maintenance, sortOrder, title, visible],
  );
  const isDirty = !sameJson(currentForm, baseline);

  const applyForm = useCallback((form: GameForm) => {
    setTitle(form.title);
    setDescription(form.description);
    setCtaLabel(form.cta_label);
    setSortOrder(form.sort_order);
    setVisible(form.visible);
    setEnabled(form.enabled);
    setAccent(form.accent_color);
    setMaintenance(form.maintenance_mode);
    setMTitle(form.maintenance_title);
    setMText(form.maintenance_text);
    setCoverId(form.cover_asset_id);
    setCoverUrl(form.coverUrl);
    setBaseline(form);
    setPendingRemote(null);
  }, []);

  const handleRemoteForm = useCallback(
    (form: GameForm) => {
      if (isDirty) {
        setPendingRemote(form);
        toast.info(`Hay cambios externos en ${gameLabel(game.id)}.`);
        return;
      }

      applyForm(form);
    },
    [applyForm, game.id, isDirty],
  );

  useSupabaseRealtime({
    channelName: `panel-cbs-game-${game.id}`,
    tables: ["games", "media_assets"],
    onChange: (table, payload) => {
      if (table === "games") {
        const row = (payload as RealtimePayload<GameRow>).new;
        if (payload.eventType !== "DELETE" && row.id === game.id) {
          void formFromRow(row as GameRow).then(handleRemoteForm);
        }
        return;
      }

      const mediaPayload = payload as RealtimePayload<MediaAssetRow>;
      const row = (mediaPayload.eventType === "DELETE" ? mediaPayload.old : mediaPayload.new) as Partial<MediaAssetRow>;
      if (row.id && row.id === coverId) {
        setCoverUrl(mediaPayload.eventType === "DELETE" ? null : assetUrl(mediaPayload.new as MediaAssetRow));
      }
    },
    onReconnect: async () => {
      const form = await fetchGameForm(game.id);
      if (form) {
        handleRemoteForm(form);
      }
    },
  });

  function save() {
    const input = {
      title,
      description,
      cta_label: ctaLabel,
      visible,
      enabled,
      sort_order: Number(sortOrder),
      cover_asset_id: coverId,
      accent_color: accent || null,
      maintenance_mode: maintenance,
      maintenance_title: maintenance ? mTitle : null,
      maintenance_text: maintenance ? mText : null,
    };
    const parsed = gameUpdateSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
      return;
    }

    run(() => updateGame(game.id, parsed.data), {
      success: "Juego actualizado",
      onSuccess: () => {
        setBaseline(currentForm);
        setPendingRemote(null);
      },
    });
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        {pendingRemote ? (
          <PendingRemoteChange onApply={() => applyForm(pendingRemote)} onDismiss={() => setPendingRemote(null)} />
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-ink">{gameLabel(game.id)}</h3>
            {visible ? (
              <Badge tone="success">
                <Eye size={12} /> Visible en la home
              </Badge>
            ) : (
              <Badge tone="neutral">
                <EyeOff size={12} /> Oculto
              </Badge>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            Mostrar en la home
            <Toggle checked={visible} onChange={setVisible} label="Visible" />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Titulo" htmlFor={`title-${game.id}`} required>
            <Input id={`title-${game.id}`} value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Texto del boton" htmlFor={`cta-${game.id}`} required>
            <Input id={`cta-${game.id}`} value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} />
          </Field>
        </div>

        <Field label="Descripcion" htmlFor={`desc-${game.id}`}>
          <Textarea id={`desc-${game.id}`} value={description} onChange={(event) => setDescription(event.target.value)} rows={2} />
        </Field>

        <Field label="Imagen de portada">
          <ImagePicker
            label="Portada del juego"
            value={coverId}
            valueUrl={coverUrl}
            onChange={(id, url) => {
              setCoverId(id);
              setCoverUrl(url);
            }}
          />
        </Field>

        <Advanced>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Orden en la home" htmlFor={`sort-${game.id}`} hint="Numero menor aparece primero.">
              <Input id={`sort-${game.id}`} type="number" min={0} value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
            </Field>
            <Field label="Color de acento">
              <ColorField value={accent} onChange={setAccent} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Toggle checked={enabled} onChange={setEnabled} label="Habilitado" />
            Juego jugable (si se desactiva, la card aparece bloqueada)
          </label>

          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Toggle checked={maintenance} onChange={setMaintenance} label="Mantenimiento" />
            Modo mantenimiento
          </label>
          {maintenance && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Titulo de mantenimiento">
                <Input value={mTitle} onChange={(event) => setMTitle(event.target.value)} />
              </Field>
              <Field label="Mensaje de mantenimiento">
                <Input value={mText} onChange={(event) => setMText(event.target.value)} />
              </Field>
            </div>
          )}
        </Advanced>

        <div className="flex justify-end">
          <Button onClick={save} loading={isPending}>
            <Save size={16} />
            Guardar cambios
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
