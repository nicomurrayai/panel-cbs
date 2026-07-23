"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { loadLeads, exportLeads } from "@/actions/leads";
import type { LeadsPage } from "@/lib/data/leads";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadsTable({ initial, pageSize }: { initial: LeadsPage; pageSize: number }) {
  const [rows, setRows] = useState(initial.rows);
  const [total, setTotal] = useState(initial.total);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Refs para que Realtime y el debounce lean los valores vigentes sin re-suscribir.
  const pageRef = useRef(page);
  const searchRef = useRef(search);
  pageRef.current = page;
  searchRef.current = search;

  const fetchPage = useCallback(
    async (nextPage: number, nextSearch: string) => {
      setLoading(true);
      const res = await loadLeads({ page: nextPage, pageSize, search: nextSearch });
      setLoading(false);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setRows(res.data?.rows ?? []);
      setTotal(res.data?.total ?? 0);
    },
    [pageSize],
  );

  // Busqueda con debounce: cada cambio reinicia a la primera pagina.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const handle = setTimeout(() => {
      setPage(0);
      void fetchPage(0, search);
    }, 300);
    return () => clearTimeout(handle);
  }, [search, fetchPage]);

  // Realtime: ante cualquier cambio en `leads`, refrescamos la pagina actual.
  const realtimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRefresh = useCallback(() => {
    if (realtimeTimer.current) {
      clearTimeout(realtimeTimer.current);
    }
    realtimeTimer.current = setTimeout(() => {
      void fetchPage(pageRef.current, searchRef.current);
    }, 400);
  }, [fetchPage]);

  useSupabaseRealtime({
    channelName: "panel-cbs-leads",
    tables: ["leads"],
    onChange: scheduleRefresh,
    onReconnect: scheduleRefresh,
  });

  function goToPage(nextPage: number) {
    setPage(nextPage);
    void fetchPage(nextPage, searchRef.current);
  }

  async function handleExport() {
    setExporting(true);
    const res = await exportLeads(searchRef.current);
    setExporting(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const data = (res.data ?? []).map((lead) => ({
      "Numero de Legajo": lead.legajo,
      "Fecha y hora de creacion": formatDate(lead.created_at),
    }));
    if (data.length === 0) {
      toast.error("No hay leads para exportar.");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet["!cols"] = [{ wch: 20 }, { wch: 24 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `leads-${stamp}.xlsx`);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeFrom = total === 0 ? 0 : page * pageSize + 1;
  const rangeTo = page * pageSize + rows.length;
  const canPrev = page > 0 && !loading;
  const canNext = (page + 1) * pageSize < total && !loading;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-panel-border px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-ink">Registros</h2>
          <Badge tone="warning">{total} en total</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por legajo"
              className="w-56 pl-9"
              aria-label="Buscar por numero de legajo"
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={exporting}
            disabled={total === 0}
          >
            <Download size={16} />
            Exportar XLSX
          </Button>
        </div>
      </div>

      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-panel-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-semibold">Numero de Legajo</th>
                <th className="px-5 py-3 font-semibold">Fecha y hora de creacion</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-5 py-10 text-center text-muted">
                    {search.trim()
                      ? "No hay leads que coincidan con la busqueda."
                      : "Todavia no hay leads registrados."}
                  </td>
                </tr>
              ) : (
                rows.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-panel-border/60 transition hover:bg-surface-strong/60"
                  >
                    <td className="px-5 py-3 font-semibold text-ink">{lead.legajo}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(lead.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardBody>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-panel-border px-5 py-3 text-sm text-muted">
        <span>
          {total === 0 ? "Sin registros" : `Mostrando ${rangeFrom}-${rangeTo} de ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs">
            Pagina {page + 1} de {totalPages}
          </span>
          <Button variant="ghost" size="sm" onClick={() => goToPage(page - 1)} disabled={!canPrev}>
            <ChevronLeft size={16} />
            Anterior
          </Button>
          <Button variant="ghost" size="sm" onClick={() => goToPage(page + 1)} disabled={!canNext}>
            Siguiente
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
