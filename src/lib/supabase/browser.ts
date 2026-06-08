"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
  "";

let cached: SupabaseClient<Database> | null = null;

export function isBrowserSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseKey);
}

export function getBrowserClient(): SupabaseClient<Database> | null {
  if (!isBrowserSupabaseConfigured()) {
    return null;
  }

  cached ??= createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        "x-client-info": "panel-cbs-browser",
      },
    },
  });

  return cached;
}
