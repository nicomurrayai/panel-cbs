 "use client";

import { useRef, useState } from "react";
import { RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { replaceImageAsset, uploadImageAsset } from "@/actions/media";
import { IMAGE_ACCEPT, IMAGE_MAX_BYTES, humanFileSize } from "@/lib/validation/media";
import { readImageDimensions } from "@/lib/imageClient";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Thumb } from "@/components/media/ImagePicker";

type DirectImageUploadProps = {
  label?: string;
  value: string | null;
  valueUrl: string | null;
  onChange: (assetId: string | null, url: string | null) => void;
};

export function DirectImageUpload({
  label = "Imagen",
  value,
  valueUrl,
  onChange,
}: DirectImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    const dims = await readImageDimensions(file);
    const form = new FormData();
    form.set("file", file);
    form.set("alt", file.name);
    if (dims) {
      form.set("width", String(dims.width));
      form.set("height", String(dims.height));
    }

    setUploading(true);
    try {
      const res = value
        ? await replaceImageAsset(value, form)
        : await uploadImageAsset(form);

      if (res.ok && res.data) {
        onChange(res.data.id, res.data.url);
        toast.success(value ? "Imagen reemplazada" : "Imagen subida");
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

      <Thumb url={valueUrl} alt={label} />

      <div className="flex flex-col items-start gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Spinner /> : value ? <RefreshCw size={15} /> : <Upload size={15} />}
          {uploading ? "Subiendo..." : value ? "Reemplazar imagen" : "Subir imagen"}
        </Button>
        <span className="text-xs text-muted">PNG, JPG, WEBP o SVG · max {humanFileSize(IMAGE_MAX_BYTES)}</span>
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
    </div>
  );
}
