"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Film, Trash2, Upload, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { uploadVideoAsset } from "@/actions/media";
import { VIDEO_ACCEPT, VIDEO_MAX_BYTES, humanFileSize, validateVideoFile } from "@/lib/validation/media";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { MediaAssetView } from "@/types/panel";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import {
  fetchVideoAssetRows,
  isVisibleVideoAsset,
  mediaAssetToView,
  type MediaAssetRow,
} from "@/lib/realtime/mediaAssets";

export function VideoPicker({
  value,
  valueUrl,
  onChange,
  label = "Video",
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
    if (!id) return;

    setAssets((current) => {
      if (payload.eventType === "DELETE" || !isVisibleVideoAsset(row)) {
        return current.filter((asset) => asset.id !== id);
      }
      const nextAsset = mediaAssetToView(payload.new as MediaAssetRow);
      return [nextAsset, ...current.filter((asset) => asset.id !== id)];
    });
  }, []);

  useSupabaseRealtime({
    channelName: "panel-cbs-video-picker",
    tables: ["media_assets"],
    enabled: open,
    onChange: (_table, payload) => applyAssetPayload(payload as RealtimePayload<MediaAssetRow>),
    onReconnect: async () => {
      const rows = await fetchVideoAssetRows();
      setAssets(rows.map(mediaAssetToView));
    },
  });

  useEffect(() => {
    if (!open) return;
    let active = true;
    fetchVideoAssetRows()
      .then((rows) => {
        if (active) setAssets(rows.map(mediaAssetToView));
      })
      .catch((cause) => {
        if (active) toast.error(cause instanceof Error ? cause.message : "No se pudo leer videos.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  async function handleFile(file: File) {
    const err = validateVideoFile({ type: file.type, size: file.size });
    if (err) {
      toast.error(err);
      return;
    }

    const form = new FormData();
    form.set("file", file);
    form.set("alt", file.name);
    setUploading(true);
    try {
      const res = await uploadVideoAsset(form);
      if (res.ok && res.data) {
        toast.success("Video subido");
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
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-panel-border bg-surface">
        {valueUrl ? <Film size={22} className="text-accent-deep" /> : <VideoOff size={20} className="text-muted/60" />}
      </div>
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
          <Film size={15} />
          {valueUrl ? "Cambiar video" : "Elegir video"}
        </Button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-danger hover:underline"
          >
            <Trash2 size={12} /> Quitar
          </button>
        ) : null}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={label} size="lg">
        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept={VIDEO_ACCEPT}
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
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-panel-border bg-surface/40 px-4 py-6 text-sm text-muted transition hover:border-accent hover:bg-surface-strong disabled:opacity-60"
          >
            {uploading ? <Spinner /> : <Upload size={22} className="text-accent-deep" />}
            <span className="font-semibold text-ink">{uploading ? "Subiendo..." : "Subir nuevo video"}</span>
            <span className="text-xs">MP4 o WEBM - max {humanFileSize(VIDEO_MAX_BYTES)}</span>
          </button>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Biblioteca</p>
            {loading ? (
              <div className="grid place-items-center py-8 text-muted">
                <Spinner />
              </div>
            ) : assets.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Todavía no hay videos.</p>
            ) : (
              <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
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
                        "relative flex aspect-video flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border bg-surface p-2 text-xs transition",
                        selected ? "border-accent ring-2 ring-accent/40" : "border-panel-border hover:border-accent",
                      )}
                      title={asset.alt || asset.key}
                    >
                      <Film size={18} />
                      <span className="line-clamp-2 px-1 text-center font-medium text-ink">{asset.alt || asset.key}</span>
                      {selected ? (
                        <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-accent text-white">
                          <Check size={12} />
                        </span>
                      ) : null}
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
