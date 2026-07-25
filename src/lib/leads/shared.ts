import type { Database, Json } from "@/types/database.types";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export type LeadsPage = {
  rows: LeadRow[];
  total: number;
};

export const LEADS_PAGE_SIZE = 20;

function payloadText(payload: Json | null | undefined): string {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";
  return Object.values(payload)
    .filter((value): value is string => typeof value === "string")
    .join(" ");
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
