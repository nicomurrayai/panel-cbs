"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Eye, EyeOff } from "lucide-react";
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
import { useAsyncAction } from "@/hooks/useAsyncAction";

export function GameEditorCard({ game }: { game: GameEditView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();

  const [title, setTitle] = useState(game.title);
  const [description, setDescription] = useState(game.description);
  const [ctaLabel, setCtaLabel] = useState(game.cta_label);
  const [sortOrder, setSortOrder] = useState(String(game.sort_order));
  const [visible, setVisible] = useState(game.visible);
  const [enabled, setEnabled] = useState(game.enabled);
  const [accent, setAccent] = useState(game.accent_color ?? "#f5a400");
  const [maintenance, setMaintenance] = useState(game.maintenance_mode);
  const [mTitle, setMTitle] = useState(game.maintenance_title ?? "");
  const [mText, setMText] = useState(game.maintenance_text ?? "");
  const [coverId, setCoverId] = useState(game.cover_asset_id);
  const [coverUrl, setCoverUrl] = useState(game.coverUrl);

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
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
      return;
    }
    run(() => updateGame(game.id, parsed.data), {
      success: "Juego actualizado",
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <Card>
      <CardBody className="space-y-4">
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
          <Field label="Título" htmlFor={`title-${game.id}`} required>
            <Input
              id={`title-${game.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="Texto del botón" htmlFor={`cta-${game.id}`} required>
            <Input
              id={`cta-${game.id}`}
              value={ctaLabel}
              onChange={(e) => setCtaLabel(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Descripción" htmlFor={`desc-${game.id}`}>
          <Textarea
            id={`desc-${game.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
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
            <Field
              label="Orden en la home"
              htmlFor={`sort-${game.id}`}
              hint="Número menor aparece primero."
            >
              <Input
                id={`sort-${game.id}`}
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
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
            <Toggle
              checked={maintenance}
              onChange={setMaintenance}
              label="Mantenimiento"
            />
            Modo mantenimiento
          </label>
          {maintenance && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Título de mantenimiento">
                <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
              </Field>
              <Field label="Mensaje de mantenimiento">
                <Input value={mText} onChange={(e) => setMText(e.target.value)} />
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
