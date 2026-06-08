import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase con una clave de servidor. SOLO se ejecuta en el servidor
 * (el import "server-only" rompe el build si se importa desde el navegador).
 * Bypassea RLS: puede leer filas ocultas/inactivas y escribir cualquier tabla.
 */
let cached: SupabaseClient<Database> | null = null;

type AdminEnv = {
  url: string;
  key: string;
  keyName: "SUPABASE_SECRET_KEY" | "SUPABASE_SERVICE_ROLE_KEY";
};

function looksLikeLegacyJwt(value: string): boolean {
  return value.split(".").length === 3;
}

function readAdminEnv(): AdminEnv {
  const url = process.env.SUPABASE_URL?.trim() ?? "";
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim() ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const key = secretKey || serviceRoleKey;
  const keyName = secretKey ? "SUPABASE_SECRET_KEY" : "SUPABASE_SERVICE_ROLE_KEY";

  if (!url) {
    throw new Error("Falta SUPABASE_URL en .env.local.");
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".supabase.co") && !parsed.hostname.endsWith(".supabase.in")) {
      throw new Error("host");
    }
  } catch {
    throw new Error("SUPABASE_URL no tiene un formato valido de proyecto Supabase.");
  }

  if (!key) {
    throw new Error(
      "Falta una clave de servidor en .env.local: SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (!key.startsWith("sb_secret_") && !looksLikeLegacyJwt(key)) {
    throw new Error(
      "La clave de Supabase no tiene un formato valido. Usa SUPABASE_SECRET_KEY o la legacy SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, key, keyName };
}

export function getAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const { url, key, keyName } = readAdminEnv();

  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": `panel-cbs-admin:${keyName.toLowerCase()}` } },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  try {
    readAdminEnv();
    return true;
  } catch {
    return false;
  }
}

/** Bucket publico de Storage para imagenes de los juegos. */
export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "game-assets";
