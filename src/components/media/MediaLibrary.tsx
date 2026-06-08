"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, RefreshCw, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  uploadImageAsset,
  replaceImageAsset,
  deleteImageAsset,
} from "@/actions/media";
import {
  IMAGE_ACCEPT,
  validateImageFile,
  humanFileSize,
  IMAGE_MAX_BYTES,
} from "@/lib/validation/media";
import { readImageDimensions } from "@/lib/imageClient";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { MediaAssetView } from "@/types/panel";

export function MediaLibrary({ assets }: { assets: MediaAssetView[] }) {
  const router = useRouter();
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<MediaAssetView | null>(null);

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
        router.refresh();
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
        router.refresh();
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
      router.refresh();
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
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onUpload(f);
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onReplace(f);
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {assets.length} {assets.length === 1 ? "imagen" : "imágenes"} · máx{" "}
          {humanFileSize(IMAGE_MAX_BYTES)} por archivo
        </p>
        <Button onClick={() => uploadRef.current?.click()} loading={busy}>
          <Upload size={16} /> Subir imagen
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted">
            Todavía no hay imágenes en el bucket. Subí la primera.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <Card key={a.id} className="overflow-hidden">
              <div className="grid aspect-video place-items-center overflow-hidden bg-cream">
                {a.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.url}
                    alt={a.alt}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageOff className="text-muted/60" />
                )}
              </div>
              <CardBody className="space-y-2 p-3">
                <p className="truncate text-xs font-semibold text-ink" title={a.key}>
                  {a.path?.split("/").pop() ?? a.key}
                </p>
                <p className="text-xs text-muted">
                  {a.width && a.height ? `${a.width}×${a.height}` : "—"}
                  {a.mimeType ? ` · ${a.mimeType.replace("image/", "")}` : ""}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      replaceTarget.current = a.id;
                      replaceRef.current?.click();
                    }}
                  >
                    <RefreshCw size={13} /> Reemplazar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setToDelete(a)}
                    aria-label="Eliminar"
                  >
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
        message="Se borrará el archivo del almacenamiento. Los lugares que la usaban quedarán sin imagen. ¿Continuar?"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await onDelete(toDelete);
        }}
      />
    </div>
  );
}
