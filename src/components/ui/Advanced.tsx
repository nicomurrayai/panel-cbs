"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export function Advanced({
  label = "Opciones avanzadas",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-dashed border-panel-border bg-cream/30">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-semibold text-muted"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={15} />
          {label}
        </span>
        <ChevronDown
          size={16}
          className={cn("transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-dashed border-panel-border p-3">
          {children}
        </div>
      )}
    </div>
  );
}
