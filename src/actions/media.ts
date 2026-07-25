"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { assetUrl, buildStoragePath } from "@/lib/supabase/storage";
import { validateFontFile, validateImageFile, validateVideoFile } from "@/lib/validation/media";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";
import type { MediaAssetView } from "@/types/panel";

const ASSET_COLUMNS =
  "id,key,path,public_url,bucket,fallback_src,alt_text,mime_type,width,height";

type AssetRow = {
  id: string;
  key: string;
  path: string | null;
  public_url: string | null;
  bucket: string | null;
  fallback_src: string | null;
  alt_text: string;
  mime_type: string | null;
  width: number | null;
  height: number | null;
};

function toView(r: AssetRow): MediaAssetView {
  return {
    id: r.id,
    key: r.key,
    path: r.path,
    url: assetUrl(r),
    alt: r.alt_text,
    mimeType: r.mime_type,
    width: r.width,
    height: r.height,
  };
}

export async function listImageAssets(): Promise<ActionResult<MediaAssetView[]>> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("media_assets")
      .select(ASSET_COLUMNS)
      .eq("kind", "image")
      .eq("active", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ok((data ?? []).map((r) => toView(r as AssetRow)));
  } catch (e) {
    return fail(toMessage(e));
  }
}

export async function uploadImageAsset(
  formData: FormData,
): Promise<ActionResult<MediaAssetView>> {
  try {
    const file = formData.get("file");
    const alt = (formData.get("alt") as string | null) ?? "";
    const width = Number(formData.get("width")) || null;
    const height = Number(formData.get("height")) || null;

    if (!(file instanceof File)) return fail("No se recibió ningún archivo.");

    const validationError = validateImageFile(
      { type: file.type, size: file.size },
      width && height ? { width, height } : null,
    );
    if (validationError) return fail(validationError);

    const supabase = getAdminClient();
    const path = buildStoragePath(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        key: path,
        kind: "image",
        bucket: STORAGE_BUCKET,
        path,
        alt_text: alt,
        mime_type: file.type,
        width,
        height,
        active: true,
      })
      .select(ASSET_COLUMNS)
      .single();

    if (error) {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      throw error;
    }

    revalidatePath("/medios");
    return ok(toView(data as AssetRow));
  } catch (e) {
    return fail(toMessage(e));
  }
}

export async function listVideoAssets(): Promise<ActionResult<MediaAssetView[]>> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("media_assets")
      .select(ASSET_COLUMNS)
      .eq("kind", "video")
      .eq("active", true)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return ok((data ?? []).map((r) => toView(r as AssetRow)));
  } catch (e) {
    return fail(toMessage(e));
  }
}

export async function uploadVideoAsset(
  formData: FormData,
): Promise<ActionResult<MediaAssetView>> {
  try {
    const file = formData.get("file");
    const alt = (formData.get("alt") as string | null) ?? "";
    if (!(file instanceof File)) return fail("No se recibió ningún archivo.");

    const validationError = validateVideoFile({ type: file.type, size: file.size });
    if (validationError) return fail(validationError);

    const supabase = getAdminClient();
    const path = buildStoragePath(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        key: path,
        kind: "video",
        bucket: STORAGE_BUCKET,
        path,
        alt_text: alt,
        mime_type: file.type,
        active: true,
      })
      .select(ASSET_COLUMNS)
      .single();

    if (error) {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      throw error;
    }

    revalidatePath("/medios");
    revalidatePath("/global");
    return ok(toView(data as AssetRow));
  } catch (e) {
    return fail(toMessage(e));
  }
}

export async function uploadFontAsset(
  formData: FormData,
): Promise<ActionResult<MediaAssetView>> {
  try {
    const file = formData.get("file");
    const alt = (formData.get("alt") as string | null) ?? "";
    if (!(file instanceof File)) return fail("No se recibió ningún archivo.");

    const validationError = validateFontFile({ type: file.type, size: file.size, name: file.name });
    if (validationError) return fail(validationError);

    const supabase = getAdminClient();
    const path = buildStoragePath(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "font/woff2";

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        key: path,
        kind: "other",
        bucket: STORAGE_BUCKET,
        path,
        alt_text: alt || file.name,
        mime_type: contentType,
        active: true,
      })
      .select(ASSET_COLUMNS)
      .single();

    if (error) {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      throw error;
    }

    revalidatePath("/medios");
    revalidatePath("/global");
    return ok(toView(data as AssetRow));
  } catch (e) {
    return fail(toMessage(e));
  }
}

export async function deleteImageAsset(id: string): Promise<ActionResult> {
  try {
    const supabase = getAdminClient();
    const { data: row } = await supabase
      .from("media_assets")
      .select("bucket,path")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    if (error) throw error;

    if (row?.path) {
      await supabase.storage
        .from(row.bucket ?? STORAGE_BUCKET)
        .remove([row.path]);
    }
    revalidatePath("/medios");
    return ok();
  } catch (e) {
    return fail(toMessage(e));
  }
}

export async function replaceImageAsset(
  id: string,
  formData: FormData,
): Promise<ActionResult<MediaAssetView>> {
  try {
    const file = formData.get("file");
    const width = Number(formData.get("width")) || null;
    const height = Number(formData.get("height")) || null;
    if (!(file instanceof File)) return fail("No se recibió ningún archivo.");

    const validationError = validateImageFile(
      { type: file.type, size: file.size },
      width && height ? { width, height } : null,
    );
    if (validationError) return fail(validationError);

    const supabase = getAdminClient();
    const { data: current } = await supabase
      .from("media_assets")
      .select("bucket,path")
      .eq("id", id)
      .single();

    const newPath = buildStoragePath(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(newPath, buffer, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from("media_assets")
      .update({
        bucket: STORAGE_BUCKET,
        path: newPath,
        mime_type: file.type,
        width,
        height,
      })
      .eq("id", id)
      .select(ASSET_COLUMNS)
      .single();
    if (error) {
      await supabase.storage.from(STORAGE_BUCKET).remove([newPath]);
      throw error;
    }

    // Borrar el archivo viejo (las referencias por id se mantienen).
    if (current?.path && current.path !== newPath) {
      await supabase.storage
        .from(current.bucket ?? STORAGE_BUCKET)
        .remove([current.path]);
    }

    revalidatePath("/medios");
    return ok(toView(data as AssetRow));
  } catch (e) {
    return fail(toMessage(e));
  }
}
