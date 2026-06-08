"use client";

import { useCallback, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { GlobalSettingsView } from "@/lib/data/global";
import { THEME_FIELDS, globalSettingsSchema, type BrandingConfig, type ThemeConfig } from "@/lib/validation/global";
import { saveGlobalSettings } from "@/actions/global";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
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

type GlobalSettingsRow = Database["public"]["Tables"]["global_settings"]["Row"];

type GlobalForm = {
  home_eyebrow: string;
  home_title: string;
  home_subtitle: string;
  home_background_asset_id: string | null;
  backgroundUrl: string | null;
  theme: ThemeConfig;
  branding: BrandingConfig;
};

const DEFAULT_THEME: ThemeConfig = {
  cream: "#fff3dc",
  creamStrong: "#fff8ec",
  orange: "#f5a400",
  orangeDeep: "#df8800",
  yellow: "#ffd100",
  ink: "#1f1f25",
  muted: "#6f6255",
  cnhBlack: "#17171d",
  success: "#34785f",
};

const DEFAULT_BRANDING: BrandingConfig = {
  primaryName: "CBS+",
  secondaryName: "CNH",
  footer: "Because I Care",
};

function formFromSettings(settings: GlobalSettingsView): GlobalForm {
  return {
    home_eyebrow: settings.home_eyebrow,
    home_title: settings.home_title,
    home_subtitle: settings.home_subtitle,
    home_background_asset_id: settings.home_background_asset_id,
    backgroundUrl: settings.backgroundUrl,
    theme: settings.theme,
    branding: settings.branding,
  };
}

async function formFromRow(row: GlobalSettingsRow): Promise<GlobalForm> {
  const background = await fetchMediaAssetById(row.home_background_asset_id);
  return {
    home_eyebrow: row.home_eyebrow,
    home_title: row.home_title,
    home_subtitle: row.home_subtitle,
    home_background_asset_id: row.home_background_asset_id,
    backgroundUrl: assetUrl(background),
    theme: { ...DEFAULT_THEME, ...((row.theme as Partial<ThemeConfig>) ?? {}) },
    branding: { ...DEFAULT_BRANDING, ...((row.branding as Partial<BrandingConfig>) ?? {}) },
  };
}

async function fetchGlobalForm() {
  const supabase = getBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("global_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? formFromRow(data) : null;
}

export function GlobalEditor({ settings }: { settings: GlobalSettingsView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromSettings(settings), [settings]);

  const [eyebrow, setEyebrow] = useState(initialForm.home_eyebrow);
  const [title, setTitle] = useState(initialForm.home_title);
  const [subtitle, setSubtitle] = useState(initialForm.home_subtitle);
  const [bgId, setBgId] = useState(initialForm.home_background_asset_id);
  const [bgUrl, setBgUrl] = useState(initialForm.backgroundUrl);
  const [theme, setTheme] = useState<ThemeConfig>(initialForm.theme);
  const [branding, setBranding] = useState<BrandingConfig>(initialForm.branding);
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<GlobalForm | null>(null);

  const currentForm = useMemo<GlobalForm>(
    () => ({
      home_eyebrow: eyebrow,
      home_title: title,
      home_subtitle: subtitle,
      home_background_asset_id: bgId,
      backgroundUrl: bgUrl,
      theme,
      branding,
    }),
    [bgId, bgUrl, branding, eyebrow, subtitle, theme, title],
  );
  const isDirty = !sameJson(currentForm, baseline);

  const applyForm = useCallback((form: GlobalForm) => {
    setEyebrow(form.home_eyebrow);
    setTitle(form.home_title);
    setSubtitle(form.home_subtitle);
    setBgId(form.home_background_asset_id);
    setBgUrl(form.backgroundUrl);
    setTheme(form.theme);
    setBranding(form.branding);
    setBaseline(form);
    setPendingRemote(null);
  }, []);

  const handleRemoteForm = useCallback(
    (form: GlobalForm) => {
      if (isDirty) {
        setPendingRemote(form);
        toast.info("Hay cambios externos en ajustes globales.");
        return;
      }

      applyForm(form);
    },
    [applyForm, isDirty],
  );

  useSupabaseRealtime({
    channelName: "panel-cbs-global",
    tables: ["global_settings", "media_assets"],
    onChange: (_table, payload) => {
      if (_table === "global_settings") {
        const row = (payload as RealtimePayload<GlobalSettingsRow>).new;
        if (payload.eventType !== "DELETE" && row.id === "default") {
          void formFromRow(row as GlobalSettingsRow).then(handleRemoteForm);
        }
        return;
      }

      const mediaPayload = payload as RealtimePayload<MediaAssetRow>;
      const row = (mediaPayload.eventType === "DELETE" ? mediaPayload.old : mediaPayload.new) as Partial<MediaAssetRow>;
      if (row.id && row.id === bgId) {
        setBgUrl(mediaPayload.eventType === "DELETE" ? null : assetUrl(mediaPayload.new as MediaAssetRow));
      }
    },
    onReconnect: async () => {
      const form = await fetchGlobalForm();
      if (form) {
        handleRemoteForm(form);
      }
    },
  });

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
      toast.error(parsed.error.issues[0]?.message ?? "Datos invalidos.");
      return;
    }

    run(() => saveGlobalSettings(parsed.data), {
      success: "Ajustes guardados",
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
        <CardHeader title="Pantalla principal" />
        <CardBody className="grid gap-4 md:grid-cols-2">
          <Field label="Eyebrow (texto superior)">
            <Input value={eyebrow} onChange={(event) => setEyebrow(event.target.value)} />
          </Field>
          <Field label="Titulo">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Subtitulo" className="md:col-span-2">
            <Textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} rows={2} />
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
        <CardHeader title="Marca" description="Nombres y pie de pagina de la identidad." />
        <CardBody className="grid gap-4 md:grid-cols-3">
          <Field label="Nombre principal">
            <Input
              value={branding.primaryName}
              onChange={(event) => setBranding((value) => ({ ...value, primaryName: event.target.value }))}
            />
          </Field>
          <Field label="Nombre secundario">
            <Input
              value={branding.secondaryName}
              onChange={(event) => setBranding((value) => ({ ...value, secondaryName: event.target.value }))}
            />
          </Field>
          <Field label="Pie de pagina">
            <Input
              value={branding.footer}
              onChange={(event) => setBranding((value) => ({ ...value, footer: event.target.value }))}
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Paleta de colores" description="Estos colores se aplican al tema de la app." />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <ColorField value={theme[key]} onChange={(value) => setThemeKey(key, value)} />
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
