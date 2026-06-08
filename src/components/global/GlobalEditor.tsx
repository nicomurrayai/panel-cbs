"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { GlobalSettingsView } from "@/lib/data/global";
import {
  THEME_FIELDS,
  globalSettingsSchema,
  type ThemeConfig,
  type BrandingConfig,
} from "@/lib/validation/global";
import { saveGlobalSettings } from "@/actions/global";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { ColorField } from "@/components/forms/ColorField";
import { ImagePicker } from "@/components/media/ImagePicker";
import { useAsyncAction } from "@/hooks/useAsyncAction";

export function GlobalEditor({ settings }: { settings: GlobalSettingsView }) {
  const router = useRouter();
  const { run, isPending } = useAsyncAction();

  const [eyebrow, setEyebrow] = useState(settings.home_eyebrow);
  const [title, setTitle] = useState(settings.home_title);
  const [subtitle, setSubtitle] = useState(settings.home_subtitle);
  const [bgId, setBgId] = useState(settings.home_background_asset_id);
  const [bgUrl, setBgUrl] = useState(settings.backgroundUrl);
  const [theme, setTheme] = useState<ThemeConfig>(settings.theme);
  const [branding, setBranding] = useState<BrandingConfig>(settings.branding);

  function setThemeKey(key: keyof ThemeConfig, value: string) {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    const input = {
      home_eyebrow: eyebrow,
      home_title: title,
      home_subtitle: subtitle,
      home_background_asset_id: bgId,
      theme,
      branding,
    };
    const parsed = globalSettingsSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
      return;
    }
    run(() => saveGlobalSettings(parsed.data), {
      success: "Ajustes guardados",
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Pantalla principal" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow (texto superior)">
            <Input value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} />
          </Field>
          <Field label="Título">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Subtítulo" className="md:col-span-2">
            <Textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
            />
          </Field>
          <Field label="Imagen de fondo" className="md:col-span-2">
            <ImagePicker
              label="Fondo de la pantalla principal"
              value={bgId}
              valueUrl={bgUrl}
              onChange={(id, url) => {
                setBgId(id);
                setBgUrl(url);
              }}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Marca"
          description="Nombres y pie de página de la identidad."
        />
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Nombre principal">
            <Input
              value={branding.primaryName}
              onChange={(e) =>
                setBranding((b) => ({ ...b, primaryName: e.target.value }))
              }
            />
          </Field>
          <Field label="Nombre secundario">
            <Input
              value={branding.secondaryName}
              onChange={(e) =>
                setBranding((b) => ({ ...b, secondaryName: e.target.value }))
              }
            />
          </Field>
          <Field label="Pie de página">
            <Input
              value={branding.footer}
              onChange={(e) =>
                setBranding((b) => ({ ...b, footer: e.target.value }))
              }
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Paleta de colores"
          description="Estos colores se aplican al tema de la app."
        />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <ColorField
                value={theme[key]}
                onChange={(v) => setThemeKey(key, v)}
              />
            </Field>
          ))}
        </CardBody>
      </Card>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} loading={isPending} className="shadow-soft">
          <Save size={16} /> Guardar ajustes
        </Button>
      </div>
    </div>
  );
}
