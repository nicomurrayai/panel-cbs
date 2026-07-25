import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database.types";
import { DEFAULT_LEADS_FORM, normalizeLeadsForm, type LeadsFormConfig } from "@/lib/validation/leadsForm";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type LeadsPage = {
  rows: LeadRow[];
  total: number;
};

export const LEADS_PAGE_SIZE = 20;

export async function getLeadsFormConfig(): Promise<LeadsFormConfig> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("global_settings")
    .select("leads_form")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw error;
  return normalizeLeadsForm(data?.leads_form ?? DEFAULT_LEADS_FORM);
}

function payloadText(payload: Json | null | undefined): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  return Object.values(payload)
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

/** Pagina de leads ordenada por fecha de creacion descendente, con total exacto. */
export async function getLeadsPage(opts: {
  page: number;
  pageSize?: number;
  search?: string;
}): Promise<LeadsPage> {
  const pageSize = opts.pageSize ?? LEADS_PAGE_SIZE;
  const page = Math.max(0, opts.page);
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const term = opts.search?.trim();

  const supabase = getAdminClient();
  let query = supabase.from("leads").select("*", { count: "exact" });
  if (term) {
    // Busca en legajo legado y también en valores del payload como texto.
    query = query.or(`legajo.ilike.%${term}%,payload::text.ilike.%${term}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) {
    throw error;
  }

  return { rows: data ?? [], total: count ?? 0 };
}

/** Todos los leads que coinciden con la busqueda (para exportar a XLSX). */
export async function getAllLeads(search?: string): Promise<LeadRow[]> {
  const term = search?.trim();

  const supabase = getAdminClient();
  let query = supabase.from("leads").select("*");
  if (term) {
    query = query.or(`legajo.ilike.%${term}%,payload::text.ilike.%${term}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw error;
  }

  return data ?? [];
}

export function leadPayloadRecord(lead: LeadRow): Record<string, string> {
  const payload = lead.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return lead.legajo ? { legajo: lead.legajo } : {};
  }
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "string" || typeof value === "number") {
      record[key] = String(value);
    }
  }
  if (!record.legajo && lead.legajo) {
    record.legajo = lead.legajo;
  }
  return record;
}

export function leadMatchesSearch(lead: LeadRow, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const haystack = `${lead.legajo} ${payloadText(lead.payload)}`.toLowerCase();
  return haystack.includes(needle);
}
