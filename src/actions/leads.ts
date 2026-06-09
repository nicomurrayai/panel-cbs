"use server";

import { getLeadsPage, getAllLeads, type LeadsPage, type LeadRow } from "@/lib/data/leads";
import { type ActionResult, ok, fail, toMessage } from "@/lib/actions";

export async function loadLeads(input: {
  page: number;
  pageSize?: number;
  search?: string;
}): Promise<ActionResult<LeadsPage>> {
  try {
    const data = await getLeadsPage(input);
    return ok(data);
  } catch (error) {
    return fail(toMessage(error));
  }
}

export async function exportLeads(search?: string): Promise<ActionResult<LeadRow[]>> {
  try {
    const rows = await getAllLeads(search);
    return ok(rows);
  } catch (error) {
    return fail(toMessage(error));
  }
}
