import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_LEADS_FORM, normalizeLeadsForm, type LeadsFormConfig } from "@/lib/validation/leadsForm";
import {
  LEADS_PAGE_SIZE,
  type LeadRow,
  type LeadsPage,
} from "@/lib/leads/shared";

export type { LeadRow, LeadsPage };
export { LEADS_PAGE_SIZE };
export { leadPayloadRecord, leadMatchesSearch } from "@/lib/leads/shared";

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
