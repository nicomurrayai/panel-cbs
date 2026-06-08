import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase con la clave service_role. SOLO se ejecuta en el servidor
 * (el import "server-only" rompe el build si se importa desde el navegador).
 * Bypassea RLS: puede leer filas ocultas/inactivas y escribir cualquier tabla.
 */
let cached: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase no está configurado. Definí SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }

  cached = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-client-info": "panel-cbs-admin" } },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Bucket público de Storage para imágenes de los juegos. */
export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "game-assets";
