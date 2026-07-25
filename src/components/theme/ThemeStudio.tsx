"use client";

import { useCallback, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { GlobalSettingsView } from "@/lib/data/global";
import { THEME_FIELDS, globalSettingsSchema, type BrandingConfig, type ThemeConfig } from "@/lib/validation/global";
import {
  CURATED_BODY_FONTS,
  CURATED_DISPLAY_FONTS,
  DEFAULT_HOME_CHROME,
  DEFAULT_TYPOGRAPHY,
  type HomeChromeConfig,
  type SurfaceConfig,
  type TypographyConfig,
} from "@/lib/validation/themeEngine";
import {
  DEFAULT_BRANDING,
  DEFAULT_THEME,
  normalizeBranding,
  normalizeHomeChrome,
  normalizeSurfaceConfig,
  normalizeTheme,
  normalizeTypography,
} from "@/lib/theme";
import { THEME_PRESETS } from "@/lib/theme/presets";
import { contrastHint } from "@/lib/theme/contrast";
import { saveGlobalSettings } from "@/actions/global";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { ColorField } from "@/components/forms/ColorField";
import { ImagePicker } from "@/components/media/ImagePicker";
import { VideoPicker } from "@/components/media/VideoPicker";
import { PendingRemoteChange } from "@/components/realtime/PendingRemoteChange";
import { TotemPreviewFrame, type PreviewMode } from "@/components/theme/TotemPreviewFrame";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import { getBrowserClient } from "@/lib/supabase/browser";
import { assetUrl } from "@/lib/supabase/publicStorage";
import { sameJson } from "@/lib/realtime/compare";
import { fetchMediaAssetById, type MediaAssetRow } from "@/lib/realtime/mediaAssets";
import type { Database } from "@/types/database.types";
import { cn } from "@/lib/cn";

type GlobalSettingsRow = Database["public"]["Tables"]["global_settings"]["Row"];

type StudioTab = "palette" | "typography" | "home" | "cards" | "resources";

type GlobalForm = {
  home_eyebrow: string;
  home_title: string;
  home_subtitle: string;
  home_background_asset_id: string | null;
  attract_media_asset_id: string | null;
  idle_timeout_seconds: number | null;
  auto_reset_seconds: number | null;
  backgroundUrl: string | null;
  attractMediaUrl: string | null;
  patternUrl: string | null;
  theme: ThemeConfig;
  branding: BrandingConfig;
  typography: TypographyConfig;
  home_chrome: HomeChromeConfig;
  surface_config: SurfaceConfig;
  logoUrl: string | null;
};

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: "palette", label: "Paleta" },
  { id: "typography", label: "Tipografía" },
  { id: "home", label: "Home / Attract" },
  { id: "cards", label: "Cards / CTA" },
  { id: "resources", label: "Recursos" },
];

const PREVIEW_GAMES = [
  {
    id: "roulette",
    title: "Ruleta de Premios",
    description: "Girá una vez y descubrí tu premio al instante.",
    cta: "Jugar",
    accent: null as string | null,
  },
  {
    id: "memory",
    title: "Memory Card",
    description: "Encontrá los pares antes de que termine el tiempo.",
    cta: "Jugar",
    accent: null,
  },
  {
    id: "quiz",
    title: "Quiz Test",
    description: "Respondé verdadero o falso y avanzá.",
    cta: "Responder",
    accent: null,
  },
];

function formFromSettings(settings: GlobalSettingsView): GlobalForm {
  return {
    home_eyebrow: settings.home_eyebrow,
    home_title: settings.home_title,
    home_subtitle: settings.home_subtitle,
    home_background_asset_id: settings.home_background_asset_id,
    attract_media_asset_id: settings.attract_media_asset_id,
    idle_timeout_seconds: settings.idle_timeout_seconds,
    auto_reset_seconds: settings.auto_reset_seconds,
    backgroundUrl: settings.backgroundUrl,
    attractMediaUrl: settings.attractMediaUrl,
    patternUrl: settings.patternUrl,
    theme: settings.theme,
    branding: settings.branding,
    typography: settings.typography,
    home_chrome: settings.home_chrome,
    surface_config: settings.surface_config,
    logoUrl: settings.logoUrl,
  };
}

async function formFromRow(row: GlobalSettingsRow): Promise<GlobalForm> {
  const background = await fetchMediaAssetById(row.home_background_asset_id);
  const attract = await fetchMediaAssetById(row.attract_media_asset_id);
  const branding = normalizeBranding(row.branding);
  const surface = normalizeSurfaceConfig(row.surface_config);
  const logo = branding.logoAssetId ? await fetchMediaAssetById(branding.logoAssetId) : null;
  const pattern = surface.patternAssetId ? await fetchMediaAssetById(surface.patternAssetId) : null;
  const attractKind =
    attract?.kind === "video" || (attract?.mime_type ?? "").startsWith("video/")
      ? "video"
      : attract
        ? "image"
        : surface.attractMediaKind;

  return {
    home_eyebrow: row.home_eyebrow,
    home_title: row.home_title,
    home_subtitle: row.home_subtitle,
    home_background_asset_id: row.home_background_asset_id,
    attract_media_asset_id: row.attract_media_asset_id,
    idle_timeout_seconds: row.idle_timeout_seconds,
    auto_reset_seconds: row.auto_reset_seconds,
    backgroundUrl: assetUrl(background),
    attractMediaUrl: assetUrl(attract),
    patternUrl: assetUrl(pattern),
    theme: normalizeTheme(row.theme),
    branding,
    typography: normalizeTypography(row.typography),
    home_chrome: normalizeHomeChrome(row.home_chrome),
    surface_config: { ...surface, attractMediaKind: attractKind },
    logoUrl: assetUrl(logo),
  };
}

async function fetchGlobalForm() {
  const supabase = getBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("global_settings").select("*").eq("id", "default").maybeSingle();
  if (error) throw error;
  return data ? formFromRow(data) : null;
}

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (next: string) => void;
  options: readonly string[] | Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-xl border border-panel-border bg-white px-3 text-sm font-medium text-ink"
    >
      {options.map((option) => {
        const val = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={val} value={val}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function ThemeStudio({ settings }: { settings: GlobalSettingsView }) {
  const { run, isPending } = useAsyncAction();
  const initialForm = useMemo(() => formFromSettings(settings), [settings]);
  const [tab, setTab] = useState<StudioTab>("palette");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("home");
  const [form, setForm] = useState<GlobalForm>(initialForm);
  const [baseline, setBaseline] = useState(initialForm);
  const [pendingRemote, setPendingRemote] = useState<GlobalForm | null>(null);

  const isDirty = !sameJson(form, baseline);
  const attractIsVideo = form.surface_config.attractMediaKind === "video";

  const applyForm = useCallback((next: GlobalForm) => {
    setForm(next);
    setBaseline(next);
    setPendingRemote(null);
  }, []);

  const handleRemoteForm = useCallback(
    (next: GlobalForm) => {
      if (isDirty) {
        setPendingRemote(next);
        toast.info("Hay cambios externos en ajustes globales.");
        return;
      }
      applyForm(next);
    },
    [applyForm, isDirty],
  );

  useSupabaseRealtime({
    channelName: "panel-cbs-theme-studio",
    tables: ["global_settings", "media_assets"],
    onChange: (_table, payload) => {
      if (_table === "global_settings") {
        const row = (payload as RealtimePayload<GlobalSettingsRow>).new;
        if (payload.eventType !== "DELETE" && row.id === "default") {
          void formFromRow(row as GlobalSettingsRow).then(handleRemoteForm);
        }
      }
    },
    onReconnect: async () => {
      const next = await fetchGlobalForm();
      if (next) handleRemoteForm(next);
    },
  });

  function patch<K extends keyof GlobalForm>(key: K, value: GlobalForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function save() {
    const input = {
      home_eyebrow: form.home_eyebrow,
      home_title: form.home_title,
      home_subtitle: form.home_subtitle,
      home_background_asset_id: form.home_background_asset_id,
      attract_media_asset_id: form.attract_media_asset_id,
      idle_timeout_seconds: form.idle_timeout_seconds,
      auto_reset_seconds: form.auto_reset_seconds,
      theme: form.theme,
      branding: {
        ...form.branding,
        equipmentTitle: form.branding.equipmentTitle ?? "",
        logoAssetId: form.branding.logoAssetId ?? null,
      },
      typography: form.typography,
      home_chrome: form.home_chrome,
      surface_config: form.surface_config,
    };
    const parsed = globalSettingsSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
      return;
    }
    run(() => saveGlobalSettings(parsed.data), {
      success: "Tema guardado",
      onSuccess: () => {
        setBaseline(form);
        setPendingRemote(null);
      },
    });
  }

  return (
    <div className="space-y-4">
      {pendingRemote ? (
        <PendingRemoteChange onApply={() => applyForm(pendingRemote)} onDismiss={() => setPendingRemote(null)} />
      ) : null}

      <Card>
        <CardBody className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-xs font-bold uppercase tracking-wide text-muted">Presets</p>
          {THEME_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  theme: preset.theme,
                  typography: preset.typography,
                  home_chrome: preset.homeChrome,
                }))
              }
              title={preset.description}
            >
              {preset.name}
            </Button>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-panel-border bg-surface/50 p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm font-semibold transition",
                  tab === item.id ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === "palette" ? (
            <Card>
              <CardHeader title="Paleta de colores" description="Tokens semánticos del tótem." />
              <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {THEME_FIELDS.map(({ key, label }) => (
                  <Field key={key} label={label}>
                    <ColorField
                      value={form.theme[key] ?? DEFAULT_THEME[key]}
                      onChange={(value) => patch("theme", { ...form.theme, [key]: value })}
                    />
                  </Field>
                ))}
                {(() => {
                  const hint = contrastHint(form.theme.ink, form.theme.surface);
                  return (
                    <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-panel-border bg-surface/50 px-3 py-2 text-sm">
                      <span className="font-semibold text-ink">Contraste texto / fondo: </span>
                      <span className={hint.level === "fail" ? "font-bold text-danger" : "font-bold text-success"}>
                        {hint.label}
                      </span>
                      <span className="text-muted"> — objetivo AA ≥ 4.5:1 para lectura a distancia.</span>
                    </div>
                  );
                })()}
              </CardBody>
            </Card>
          ) : null}

          {tab === "typography" ? (
            <Card>
              <CardHeader title="Tipografía" description="Fuentes optimizadas para lectura a distancia." />
              <CardBody className="grid gap-4 md:grid-cols-2">
                <Field label="Fuente display">
                  <SelectField
                    value={form.typography.displayFont}
                    onChange={(value) => patch("typography", { ...form.typography, displayFont: value })}
                    options={CURATED_DISPLAY_FONTS}
                  />
                </Field>
                <Field label="Fuente cuerpo">
                  <SelectField
                    value={form.typography.bodyFont}
                    onChange={(value) => patch("typography", { ...form.typography, bodyFont: value })}
                    options={CURATED_BODY_FONTS}
                  />
                </Field>
                <Field label="Escala tipográfica">
                  <SelectField
                    value={form.typography.scale}
                    onChange={(value) =>
                      patch("typography", {
                        ...form.typography,
                        scale: value as TypographyConfig["scale"],
                      })
                    }
                    options={[
                      { value: "compact", label: "Compacta" },
                      { value: "standard", label: "Estándar" },
                      { value: "large", label: "Grande (kiosk)" },
                    ]}
                  />
                </Field>
                <div className="rounded-xl border border-panel-border bg-surface/40 p-3 md:col-span-2">
                  <p
                    className="text-2xl font-black"
                    style={{ fontFamily: `"${form.typography.displayFont}", system-ui` }}
                  >
                    {form.home_title || "Título de ejemplo"}
                  </p>
                  <p className="mt-1 text-sm" style={{ fontFamily: `"${form.typography.bodyFont}", system-ui` }}>
                    {form.home_subtitle || "Texto de instrucciones a distancia."}
                  </p>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {tab === "home" ? (
            <Card>
              <CardHeader title="Pantalla de inicio y Attract Loop" />
              <CardBody className="grid gap-4 md:grid-cols-2">
                <Field label="Eyebrow">
                  <Input value={form.home_eyebrow} onChange={(e) => patch("home_eyebrow", e.target.value)} />
                </Field>
                <Field label="Claim / título">
                  <Input value={form.home_title} onChange={(e) => patch("home_title", e.target.value)} />
                </Field>
                <Field label="Instrucciones / subtítulo" className="md:col-span-2">
                  <Textarea value={form.home_subtitle} onChange={(e) => patch("home_subtitle", e.target.value)} rows={2} />
                </Field>
                <Field label="Fondo home (imagen)" className="md:col-span-2">
                  <ImagePicker
                    label="Fondo home"
                    value={form.home_background_asset_id}
                    valueUrl={form.backgroundUrl}
                    onChange={(id, url) => {
                      patch("home_background_asset_id", id);
                      patch("backgroundUrl", url);
                    }}
                  />
                </Field>
                <Field label="Attract: imagen" className="md:col-span-2">
                  <ImagePicker
                    label="Attract imagen"
                    value={
                      form.surface_config.attractMediaKind === "image" ? form.attract_media_asset_id : null
                    }
                    valueUrl={form.surface_config.attractMediaKind === "image" ? form.attractMediaUrl : null}
                    onChange={(id, url) => {
                      patch("attract_media_asset_id", id);
                      patch("attractMediaUrl", url);
                      patch("surface_config", {
                        ...form.surface_config,
                        attractMediaKind: id ? "image" : null,
                      });
                    }}
                  />
                </Field>
                <Field label="Attract: video" className="md:col-span-2">
                  <VideoPicker
                    label="Attract video"
                    value={form.surface_config.attractMediaKind === "video" ? form.attract_media_asset_id : null}
                    valueUrl={form.surface_config.attractMediaKind === "video" ? form.attractMediaUrl : null}
                    onChange={(id, url) => {
                      patch("attract_media_asset_id", id);
                      patch("attractMediaUrl", url);
                      patch("surface_config", {
                        ...form.surface_config,
                        attractMediaKind: id ? "video" : null,
                      });
                    }}
                  />
                </Field>
                <Field label="Idle timeout (seg)">
                  <Input
                    type="number"
                    min={10}
                    max={600}
                    value={form.idle_timeout_seconds ?? 45}
                    onChange={(e) => patch("idle_timeout_seconds", Number(e.target.value) || 45)}
                  />
                </Field>
                <Field label="Auto-reset (seg)">
                  <Input
                    type="number"
                    min={15}
                    max={900}
                    value={form.auto_reset_seconds ?? 90}
                    onChange={(e) => patch("auto_reset_seconds", Number(e.target.value) || 90)}
                  />
                </Field>
              </CardBody>
            </Card>
          ) : null}

          {tab === "cards" ? (
            <Card>
              <CardHeader title="Estilo de cards y CTA" description="Ergonomía táctil para tótems verticales." />
              <CardBody className="grid gap-4 md:grid-cols-2">
                <Field label="Radio de cards">
                  <SelectField
                    value={form.home_chrome.cardStyle.radius}
                    onChange={(value) =>
                      patch("home_chrome", {
                        ...form.home_chrome,
                        cardStyle: {
                          ...form.home_chrome.cardStyle,
                          radius: value as HomeChromeConfig["cardStyle"]["radius"],
                        },
                      })
                    }
                    options={[
                      { value: "sm", label: "Chico" },
                      { value: "md", label: "Medio" },
                      { value: "lg", label: "Grande" },
                    ]}
                  />
                </Field>
                <Field label="Elevación / sombra">
                  <SelectField
                    value={form.home_chrome.cardStyle.elevation}
                    onChange={(value) =>
                      patch("home_chrome", {
                        ...form.home_chrome,
                        cardStyle: {
                          ...form.home_chrome.cardStyle,
                          elevation: value as HomeChromeConfig["cardStyle"]["elevation"],
                        },
                      })
                    }
                    options={[
                      { value: "none", label: "Sin sombra" },
                      { value: "soft", label: "Suave" },
                      { value: "strong", label: "Fuerte" },
                    ]}
                  />
                </Field>
                <Field label="Borde">
                  <SelectField
                    value={String(form.home_chrome.cardStyle.borderWidth)}
                    onChange={(value) =>
                      patch("home_chrome", {
                        ...form.home_chrome,
                        cardStyle: {
                          ...form.home_chrome.cardStyle,
                          borderWidth: Number(value) as 0 | 1 | 2,
                        },
                      })
                    }
                    options={[
                      { value: "0", label: "0 px" },
                      { value: "1", label: "1 px" },
                      { value: "2", label: "2 px" },
                    ]}
                  />
                </Field>
                <Field label="Badge">
                  <SelectField
                    value={form.home_chrome.cardStyle.badgeStyle}
                    onChange={(value) =>
                      patch("home_chrome", {
                        ...form.home_chrome,
                        cardStyle: {
                          ...form.home_chrome.cardStyle,
                          badgeStyle: value as HomeChromeConfig["cardStyle"]["badgeStyle"],
                        },
                      })
                    }
                    options={[
                      { value: "pill", label: "Pill" },
                      { value: "tag", label: "Tag" },
                      { value: "none", label: "Oculto" },
                    ]}
                  />
                </Field>
                <Field label="Tamaño CTA táctil">
                  <SelectField
                    value={form.home_chrome.ctaSize}
                    onChange={(value) =>
                      patch("home_chrome", {
                        ...form.home_chrome,
                        ctaSize: value as HomeChromeConfig["ctaSize"],
                      })
                    }
                    options={[
                      { value: "md", label: "Medio" },
                      { value: "lg", label: "Grande" },
                      { value: "xl", label: "Extra grande" },
                    ]}
                  />
                </Field>
                <Field label="Mostrar cover en cards">
                  <div className="flex h-10 items-center">
                    <Toggle
                      checked={form.home_chrome.cardStyle.showCoverImage}
                      onChange={(checked) =>
                        patch("home_chrome", {
                          ...form.home_chrome,
                          cardStyle: { ...form.home_chrome.cardStyle, showCoverImage: checked },
                        })
                      }
                      label="Mostrar cover"
                    />
                  </div>
                </Field>
                <Field label="Mostrar cabecera de marca">
                  <div className="flex h-10 items-center">
                    <Toggle
                      checked={form.home_chrome.showBrandHeader}
                      onChange={(checked) => patch("home_chrome", { ...form.home_chrome, showBrandHeader: checked })}
                      label="Mostrar brand header"
                    />
                  </div>
                </Field>
              </CardBody>
            </Card>
          ) : null}

          {tab === "resources" ? (
            <Card>
              <CardHeader title="Marca y recursos" description="Logo, nombres y patrón de fondo." />
              <CardBody className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre principal">
                  <Input
                    value={form.branding.primaryName}
                    onChange={(e) => patch("branding", { ...form.branding, primaryName: e.target.value })}
                  />
                </Field>
                <Field label="Nombre secundario">
                  <Input
                    value={form.branding.secondaryName}
                    onChange={(e) => patch("branding", { ...form.branding, secondaryName: e.target.value })}
                  />
                </Field>
                <Field label="Pie de página">
                  <Input
                    value={form.branding.footer}
                    onChange={(e) => patch("branding", { ...form.branding, footer: e.target.value })}
                  />
                </Field>
                <Field label="Título de equipo">
                  <Input
                    value={form.branding.equipmentTitle ?? ""}
                    onChange={(e) => patch("branding", { ...form.branding, equipmentTitle: e.target.value })}
                  />
                </Field>
                <Field label="Logo" className="md:col-span-2">
                  <ImagePicker
                    label="Logo"
                    value={form.branding.logoAssetId ?? null}
                    valueUrl={form.logoUrl}
                    onChange={(id, url) => {
                      patch("branding", { ...form.branding, logoAssetId: id });
                      patch("logoUrl", url);
                    }}
                  />
                </Field>
                <Field label="Patrón de fondo" className="md:col-span-2">
                  <ImagePicker
                    label="Patrón"
                    value={form.surface_config.patternAssetId}
                    valueUrl={form.patternUrl}
                    onChange={(id, url) => {
                      patch("surface_config", { ...form.surface_config, patternAssetId: id });
                      patch("patternUrl", url);
                    }}
                  />
                </Field>
                <Field label="Opacidad del patrón">
                  <Input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.surface_config.patternOpacity}
                    onChange={(e) =>
                      patch("surface_config", {
                        ...form.surface_config,
                        patternOpacity: Math.min(1, Math.max(0, Number(e.target.value) || 0)),
                      })
                    }
                  />
                </Field>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <aside className="xl:sticky xl:top-4 xl:self-start">
          <Card>
            <CardHeader title="Vista previa tótem" description="Simulación vertical 9:16." />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ["home", "Home"],
                    ["attract", "Attract"],
                    ["cards", "Cards"],
                  ] as Array<[PreviewMode, string]>
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPreviewMode(id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold",
                      previewMode === id ? "bg-ink text-white" : "bg-surface text-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <TotemPreviewFrame
                mode={previewMode === "cards" ? "home" : previewMode}
                theme={form.theme}
                branding={{ ...DEFAULT_BRANDING, ...form.branding }}
                typography={form.typography ?? DEFAULT_TYPOGRAPHY}
                homeChrome={form.home_chrome ?? DEFAULT_HOME_CHROME}
                logoUrl={form.logoUrl}
                backgroundUrl={form.backgroundUrl}
                attractMediaUrl={form.attractMediaUrl}
                attractIsVideo={attractIsVideo}
                title={form.home_title}
                subtitle={form.home_subtitle}
                eyebrow={form.home_eyebrow}
                games={PREVIEW_GAMES}
              />
            </CardBody>
          </Card>
        </aside>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={save} loading={isPending} className="shadow-soft">
          <Save size={16} /> Guardar tema
        </Button>
      </div>
    </div>
  );
}
