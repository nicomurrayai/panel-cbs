"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ExternalLink, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/cn";

const PREVIEW_MESSAGE_VERSION = 1;
const LOGICAL_WIDTH = 1080;
const LOGICAL_HEIGHT = 1920;

export type PreviewScreen = "attract" | "home" | "memory" | "roulette" | "quiz" | "match";

export type TotemPreviewPayload = {
  screen: PreviewScreen;
  scenario?: string;
  config?: Record<string, unknown>;
  quizQuestions?: unknown[];
  matchItems?: unknown[];
};

const PATH_BY_SCREEN: Record<PreviewScreen, string> = {
  attract: "/attract",
  home: "/",
  memory: "/memory",
  roulette: "/roulette",
  quiz: "/quiz",
  match: "/match",
};

export function LiveTotemPreview({
  payload,
  title = "Vista previa del tótem",
}: {
  payload: TotemPreviewPayload;
  title?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.34);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_TOTEM_PREVIEW_URL ?? "http://localhost:5173";
  const target = useMemo(() => {
    const url = new URL(PATH_BY_SCREEN[payload.screen], baseUrl);
    url.searchParams.set("preview", "1");
    return url;
  }, [baseUrl, payload.screen]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const updateScale = () => setScale(node.clientWidth / LOGICAL_WIDTH);
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 5000);

    function onMessage(event: MessageEvent) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.origin !== target.origin ||
        event.data?.type !== "totem-preview:ready" ||
        event.data?.version !== PREVIEW_MESSAGE_VERSION
      ) {
        return;
      }
      setReady(true);
      setTimedOut(false);
    }

    window.addEventListener("message", onMessage);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", onMessage);
    };
  }, [target.origin, target.href]);

  useEffect(() => {
    if (!ready || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "totem-preview:update",
        version: PREVIEW_MESSAGE_VERSION,
        ...payload,
      },
      target.origin,
    );
  }, [payload, ready, target.origin]);

  return (
    <section className="overflow-hidden rounded-xl border border-panel-border bg-white" aria-label={title}>
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-panel-border px-4">
        <div className="flex min-w-0 items-center gap-2">
          <MonitorSmartphone size={16} className="shrink-0 text-muted" />
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
          <span className={cn("h-1.5 w-1.5 rounded-full", ready ? "bg-success" : "bg-black/20")} aria-hidden="true" />
        </div>
        <div className="flex items-center gap-1">
          <a
            href={target.href}
            target="_blank"
            rel="noreferrer"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            aria-label="Abrir vista previa en otra pestaña"
          >
            <ExternalLink size={15} />
          </a>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink xl:hidden"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar vista previa" : "Mostrar vista previa"}
          >
            <ChevronDown size={16} className={cn("transition", expanded && "rotate-180")} />
          </button>
        </div>
      </div>

      <div className={cn("bg-[#deddd8] p-4", !expanded && "hidden xl:block")}>
        <div
          ref={viewportRef}
          className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-lg bg-white shadow-tight"
        >
          <iframe
            ref={iframeRef}
            src={target.href}
            title={title}
            className="absolute left-0 top-0 border-0"
            style={{
              width: LOGICAL_WIDTH,
              height: LOGICAL_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            sandbox="allow-scripts allow-same-origin"
          />
          {timedOut && !ready ? (
            <div className="absolute inset-0 grid place-items-center bg-white/92 p-8 text-center">
              <div>
                <MonitorSmartphone size={28} className="mx-auto text-muted" />
                <p className="mt-3 text-sm font-semibold text-ink">Vista previa no disponible</p>
                <p className="mt-1 text-xs leading-5 text-muted">Podés continuar editando y guardar normalmente.</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
