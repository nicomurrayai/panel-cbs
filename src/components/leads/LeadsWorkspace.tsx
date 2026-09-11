"use client";

import { useState } from "react";

export function LeadsWorkspace({ records, form }: { records: React.ReactNode; form: React.ReactNode }) {
  const [tab, setTab] = useState<"records" | "form">("records");

  return (
    <div>
      <div className="workspace-tabs mb-6 w-fit" role="tablist" aria-label="Secciones de leads">
        <button type="button" role="tab" className="workspace-tab" aria-selected={tab === "records"} onClick={() => setTab("records")}>
          Registros
        </button>
        <button type="button" role="tab" className="workspace-tab" aria-selected={tab === "form"} onClick={() => setTab("form")}>
          Formulario
        </button>
      </div>
      <div role="tabpanel">{tab === "records" ? records : form}</div>
    </div>
  );
}
