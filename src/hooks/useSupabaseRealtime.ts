"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getBrowserClient, isBrowserSupabaseConfigured } from "@/lib/supabase/browser";
import type { Database } from "@/types/database.types";

export type RealtimeStatus = "disabled" | "connecting" | "connected" | "disconnected";
export type RealtimeTable = keyof Database["public"]["Tables"] & string;

export type RealtimePayload<T extends object = Record<string, unknown>> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Partial<T>;
  old: Partial<T>;
};

type UseSupabaseRealtimeOptions = {
  channelName: string;
  tables: RealtimeTable[];
  onChange?: (table: RealtimeTable, payload: RealtimePayload) => void;
  onReconnect?: () => void | Promise<void>;
  enabled?: boolean;
};

const INITIAL_RECONNECT_DELAY_MS = 1200;
const MAX_RECONNECT_DELAY_MS = 12_000;

export function applyRealtimeRow<T extends object>(
  rows: T[],
  payload: RealtimePayload<T>,
  getKey: (row: Partial<T>) => string | null | undefined,
) {
  const row = payload.eventType === "DELETE" ? payload.old : payload.new;
  const key = getKey(row);
  if (!key) {
    return rows;
  }

  if (payload.eventType === "DELETE") {
    return rows.filter((item) => getKey(item) !== key);
  }

  return [...rows.filter((item) => getKey(item) !== key), payload.new as T];
}

export function useSupabaseRealtime({
  channelName,
  tables,
  onChange,
  onReconnect,
  enabled = true,
}: UseSupabaseRealtimeOptions) {
  const [status, setStatus] = useState<RealtimeStatus>(
    enabled && isBrowserSupabaseConfigured() ? "connecting" : "disabled",
  );
  const tablesKey = tables.join("|");
  const stableTables = useMemo(
    () => tablesKey.split("|").filter(Boolean) as RealtimeTable[],
    [tablesKey],
  );
  const onChangeRef = useRef(onChange);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onReconnectRef.current = onReconnect;
  }, [onReconnect]);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!enabled || !supabase) {
      queueMicrotask(() => setStatus("disabled"));
      return;
    }
    const client = supabase;

    let mounted = true;
    let channel: RealtimeChannel | null = null;
    let reconnectTimer = 0;
    let reconnectAttempt = 0;
    let shouldReconcileOnSubscribe = false;

    function clearReconnectTimer() {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = 0;
      }
    }

    function scheduleReconnect() {
      clearReconnectTimer();
      const delay = Math.min(MAX_RECONNECT_DELAY_MS, INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempt);
      reconnectAttempt += 1;
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = 0;
        void connect();
      }, delay);
    }

    async function removeCurrentChannel() {
      if (!channel) {
        return;
      }

      await client.removeChannel(channel);
      channel = null;
    }

    async function connect() {
      if (!mounted) {
        return;
      }

      await removeCurrentChannel();
      setStatus("connecting");

      let nextChannel = client.channel(`${channelName}-${Date.now()}`);
      for (const table of stableTables) {
        nextChannel = nextChannel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => onChangeRef.current?.(table, payload as RealtimePayload),
        );
      }

      channel = nextChannel.subscribe((nextStatus) => {
        if (!mounted) {
          return;
        }

        if (nextStatus === "SUBSCRIBED") {
          reconnectAttempt = 0;
          setStatus("connected");
          if (shouldReconcileOnSubscribe) {
            shouldReconcileOnSubscribe = false;
            void onReconnectRef.current?.();
          }
          return;
        }

        if (nextStatus === "CHANNEL_ERROR" || nextStatus === "TIMED_OUT" || nextStatus === "CLOSED") {
          shouldReconcileOnSubscribe = true;
          setStatus("disconnected");
          scheduleReconnect();
        }
      });
    }

    void connect();

    return () => {
      mounted = false;
      clearReconnectTimer();
      void removeCurrentChannel();
    };
  }, [channelName, enabled, stableTables]);

  return status;
}
