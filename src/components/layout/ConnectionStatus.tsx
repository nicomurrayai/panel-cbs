"use client";

import { Loader2, Radio, RadioTower, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSupabaseRealtime, type RealtimeStatus } from "@/hooks/useSupabaseRealtime";

const statusConfig: Record<
  RealtimeStatus,
  { icon: typeof Radio; text: string; cls: string; spin?: boolean }
> = {
  disabled: { icon: WifiOff, text: "Realtime sin configurar", cls: "text-danger" },
  connecting: { icon: Loader2, text: "Conectando Realtime...", cls: "text-muted", spin: true },
  connected: { icon: RadioTower, text: "Realtime activo", cls: "text-success" },
  disconnected: { icon: WifiOff, text: "Reconectando Realtime", cls: "text-danger" },
};

export function ConnectionStatus({ compact = false }: { compact?: boolean }) {
  const status = useSupabaseRealtime({
    channelName: "panel-cbs-connection",
    tables: ["global_settings"],
  });
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        !compact && "rounded-full border border-panel-border bg-white px-2.5 py-1",
        config.cls,
      )}
      title="Estado de Supabase Realtime"
    >
      <Icon size={14} className={config.spin ? "animate-spin" : undefined} />
      {compact && status === "connected" ? "Sistema conectado" : config.text}
    </span>
  );
}
