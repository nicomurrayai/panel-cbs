"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type State = "checking" | "ok" | "down";

export function ConnectionStatus() {
  const [state, setState] = useState<State>("checking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const data = (await res.json()) as { ok: boolean; latencyMs?: number };
        if (!active) return;
        setState(data.ok ? "ok" : "down");
        setLatency(data.latencyMs ?? null);
      } catch {
        if (active) setState("down");
      }
    }
    check();
    const id = setInterval(check, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const config = {
    checking: { icon: Loader2, text: "Verificando…", cls: "text-muted", spin: true },
    ok: {
      icon: Wifi,
      text: latency != null ? `Conectado · ${latency} ms` : "Conectado",
      cls: "text-success",
      spin: false,
    },
    down: { icon: WifiOff, text: "Sin conexión", cls: "text-danger", spin: false },
  }[state];

  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold",
        config.cls,
      )}
      title="Estado de conexión con Supabase"
    >
      <Icon size={14} className={config.spin ? "animate-spin" : undefined} />
      {config.text}
    </span>
  );
}
