"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImageOff, ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadImageAsset } from "@/actions/media";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, humanFileSize, validateImageFile } from "@/lib/validation/media";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { readImageDimensions } from "@/lib/imageClient";
import { cn } from "@/lib/cn";
import type { MediaAssetView } from "@/types/panel";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import {
  fetchImageAssetRows,
  isVisibleImageAsset,
  mediaAssetToView,
  type MediaAssetRow,
} from "@/lib/realtime/mediaAssets";

export function Thumb({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-panel-border bg-cream",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt ?? ""} className="h-full w-full object-contain" />
      ) : (
        <ImageOff size={20} className="text-muted/60" />
      )}
    </div>
  );
}

export function ImagePicker({
  value,
  valueUrl,
  onChange,
  label = "Imagen",
}: {
  value: string | null;
  valueUrl: string | null;
  onChange: (assetId: string | null, url: string | null) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAssetView[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const applyAssetPayload = useCallback((payload: RealtimePayload<MediaAssetRow>) => {
    const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Partial<MediaAssetRow>;
    const id = row.id;
    if (!id) {
      return;
    }

    setAssets((current) => {
      if (payload.eventType === "DELETE" || !isVisibleImageAsset(row)) {
        return current.filter((asset) => asset.id !== id);
      }

      const nextAsset = mediaAssetToView(payload.new as MediaAssetRow);
      return [nextAsset, ...current.filter((asset) => asset.id !== id)];
    });
  }, []);

  useSupabaseRealtime({
    channelName: "panel-cbs-image-picker",
    tables: ["media_assets"],
    enabled: open,
    onChange: (_table, payload) => applyAssetPayload(payload as RealtimePayload<MediaAssetRow>),
    onReconnect: async () => {
      const rows = await fetchImageAssetRows();
      setAssets(rows.map(mediaAssetToView));
    },
  });

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchImageAssetRows()
      .then((rows) => {
        if (active) {
          setAssets(rows.map(mediaAssetToView));
        }
      })
      .catch((cause) => {
        if (active) {
          toast.error(cause instanceof Error ? cause.message : "No se pudo leer la biblioteca.");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  async function handleFile(file: File) {
    const dims = await readImageDimensions(file);
    const err = validateImageFile({ type: file.type, size: file.size }, dims);
    if (err) {
      toast.error(err);
      return;
    }

    const form = new FormData();
    form.set("file", file);
    form.set("alt", file.name);
    if (dims) {
      form.set("width", String(dims.width));
      form.set("height", String(dims.height));
    }

    setUploading(true);
    try {
      const res = await uploadImageAsset(form);
      if (res.ok && res.data) {
        toast.success("Imagen subida");
        setAssets((prev) => [res.data!, ...prev.filter((asset) => asset.id !== res.data!.id)]);
        onChange(res.data.id, res.data.url);
        setOpen(false);
      } else if (!res.ok) {
        toast.error(res.error);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Thumb url={valueUrl} alt={label} />
      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setLoading(true);
            setOpen(true);
          }}
        >
          <ImagePlus size={15} />
          {valueUrl ? "Cambiar" : "Elegir imagen"}
        </Button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline"
          >
            <Trash2 size={12} /> Quitar
          </button>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={label} size="lg">
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-panel-border bg-cream/40 px-4 py-6 text-sm text-muted transition hover:border-orange hover:bg-cream-strong disabled:opacity-60"
          >
            {uploading ? <Spinner /> : <Upload size={22} className="text-orange-deep" />}
            <span className="font-semibold text-ink">{uploading ? "Subiendo..." : "Subir nueva imagen"}</span>
            <span className="text-xs">PNG, JPG, WEBP o SVG - max {humanFileSize(IMAGE_MAX_BYTES)}</span>
          </button>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Biblioteca</p>
            {loading ? (
              <div className="grid place-items-center py-8 text-muted">
                <Spinner />
              </div>
            ) : assets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Todavia no hay imagenes. Subi la primera arriba.</p>
            ) : (
              <div className="grid max-h-72 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {assets.map((asset) => {
                  const selected = asset.id === value;
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => {
                        onChange(asset.id, asset.url);
                        setOpen(false);
                      }}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-xl border bg-cream transition",
                        selected ? "border-orange ring-2 ring-orange/40" : "border-panel-border hover:border-orange",
                      )}
                      title={asset.alt || asset.key}
                    >
                      {asset.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.url} alt={asset.alt} className="h-full w-full object-contain" />
                      ) : (
                        <ImageOff size={18} className="m-auto text-muted/60" />
                      )}
                      {selected && (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-orange text-white">
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
