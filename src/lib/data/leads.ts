import "server-only";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type LeadsPage = {
  rows: LeadRow[];
  total: number;
};

export const LEADS_PAGE_SIZE = 20;

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
    query = query.ilike("legajo", `%${term}%`);
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
    query = query.ilike("legajo", `%${term}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) {
    throw error;
  }

  return data ?? [];
}
