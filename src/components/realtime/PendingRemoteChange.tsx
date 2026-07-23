"use client";

import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PendingRemoteChange({
  onApply,
  onDismiss,
}: {
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/35 bg-accent/10 px-4 py-3 text-sm text-ink">
      <span className="font-semibold">Hay cambios externos pendientes.</span>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onApply}>
          <RefreshCw size={14} />
          Aplicar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDismiss} aria-label="Ignorar cambios externos">
          <X size={14} />
        </Button>
      </div>
    </div>
  );
}
