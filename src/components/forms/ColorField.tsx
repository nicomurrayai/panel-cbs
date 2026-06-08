"use client";

import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

export function ColorField({
  value,
  onChange,
  id,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  id?: string;
  className?: string;
}) {
  const safe = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : "#000000";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        type="color"
        aria-label="Selector de color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-panel-border bg-white p-0.5"
      />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        spellCheck={false}
        className="w-28 font-mono uppercase"
      />
    </div>
  );
}
