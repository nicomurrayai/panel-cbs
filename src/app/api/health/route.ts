import { NextResponse } from "next/server";
import { getAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: false,
      error: "Supabase sin configurar (.env.local)",
    });
  }

  const started = Date.now();
  try {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, latencyMs: Date.now() - started });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : "Error desconocido",
    });
  }
}
