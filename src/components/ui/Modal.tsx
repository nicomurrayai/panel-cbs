"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col rounded-2xl border border-panel-border bg-white shadow-soft",
          size === "lg" ? "max-w-3xl" : "max-w-lg",
        )}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-panel-border px-5 py-3.5">
            <h3 className="text-base font-bold text-ink">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted transition hover:bg-black/5 hover:text-ink"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-panel-border px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
