"use client";

import { useCallback, useRef, useState } from "react";
import { ImageOff, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { deleteImageAsset, replaceImageAsset, uploadImageAsset } from "@/actions/media";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, humanFileSize, validateImageFile } from "@/lib/validation/media";
import { readImageDimensions } from "@/lib/imageClient";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { MediaAssetView } from "@/types/panel";
import { useSupabaseRealtime, type RealtimePayload } from "@/hooks/useSupabaseRealtime";
import {
  fetchImageAssetRows,
  isVisibleImageAsset,
  mediaAssetToView,
  type MediaAssetRow,
} from "@/lib/realtime/mediaAssets";

export function MediaLibrary({ assets }: { assets: MediaAssetView[] }) {
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const [items, setItems] = useState(assets);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<MediaAssetView | null>(null);

  const applyAssetPayload = useCallback((payload: RealtimePayload<MediaAssetRow>) => {
    const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Partial<MediaAssetRow>;
    const id = row.id;
    if (!id) {
      return;
    }

    setItems((current) => {
      if (payload.eventType === "DELETE" || !isVisibleImageAsset(row)) {
        return current.filter((asset) => asset.id !== id);
      }

      const nextAsset = mediaAssetToView(payload.new as MediaAssetRow);
      return [nextAsset, ...current.filter((asset) => asset.id !== id)];
    });
  }, []);

  useSupabaseRealtime({
    channelName: "panel-cbs-media-library",
    tables: ["media_assets"],
    onChange: (_table, payload) => applyAssetPayload(payload as RealtimePayload<MediaAssetRow>),
    onReconnect: async () => {
      const rows = await fetchImageAssetRows();
      setItems(rows.map(mediaAssetToView));
    },
  });

  async function buildForm(file: File) {
    const dims = await readImageDimensions(file);
    const err = validateImageFile({ type: file.type, size: file.size }, dims);
    if (err) {
      toast.error(err);
      return null;
    }

    const form = new FormData();
    form.set("file", file);
    form.set("alt", file.name);
    if (dims) {
      form.set("width", String(dims.width));
      form.set("height", String(dims.height));
    }
    return form;
  }

  async function onUpload(file: File) {
    const form = await buildForm(file);
    if (!form) return;
    setBusy(true);
    try {
      const res = await uploadImageAsset(form);
      if (res.ok) {
        toast.success("Imagen subida");
        if (res.data) {
          setItems((current) => [res.data!, ...current.filter((asset) => asset.id !== res.data!.id)]);
        }
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  }

  async function onReplace(file: File) {
    const id = replaceTarget.current;
    if (!id) return;
    const form = await buildForm(file);
    if (!form) return;
    setBusy(true);
    try {
      const res = await replaceImageAsset(id, form);
      if (res.ok) {
        toast.success("Imagen reemplazada");
        if (res.data) {
          setItems((current) => [res.data!, ...current.filter((asset) => asset.id !== res.data!.id)]);
        }
      } else {
        toast.error(res.error);
      }
    } finally {
      setBusy(false);
      replaceTarget.current = null;
      if (replaceRef.current) replaceRef.current.value = "";
    }
  }

  async function onDelete(asset: MediaAssetView) {
    const res = await deleteImageAsset(asset.id);
    if (res.ok) {
      toast.success("Imagen eliminada");
      setItems((current) => current.filter((item) => item.id !== asset.id));
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={uploadRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onUpload(file);
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onReplace(file);
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "imagen" : "imagenes"} - max {humanFileSize(IMAGE_MAX_BYTES)} por archivo
        </p>
        <Button onClick={() => uploadRef.current?.click()} loading={busy}>
          <Upload size={16} /> Subir imagen
        </Button>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted">
            Todavia no hay imagenes en el bucket. Subi la primera.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <div className="grid aspect-video place-items-center overflow-hidden bg-surface">
                {asset.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.url} alt={asset.alt} className="h-full w-full object-contain" />
                ) : (
                  <ImageOff className="text-muted/60" />
                )}
              </div>
              <CardBody className="space-y-2 p-3">
                <p className="truncate text-xs font-semibold text-ink" title={asset.key}>
                  {asset.path?.split("/").pop() ?? asset.key}
                </p>
                <p className="text-xs text-muted">
                  {asset.width && asset.height ? `${asset.width}x${asset.height}` : "-"}
                  {asset.mimeType ? ` - ${asset.mimeType.replace("image/", "")}` : ""}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      replaceTarget.current = asset.id;
                      replaceRef.current?.click();
                    }}
                  >
                    <RefreshCw size={13} /> Reemplazar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setToDelete(asset)} aria-label="Eliminar">
                    <Trash2 size={15} className="text-danger" />
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar imagen"
        danger
        confirmLabel="Eliminar"
        message="Se borrara el archivo del almacenamiento. Los lugares que la usaban quedaran sin imagen. Continuar?"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await onDelete(toDelete);
        }}
      />
    </div>
  );
}
