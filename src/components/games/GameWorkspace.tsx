"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { GameEditView } from "@/lib/data/games";
import { cn } from "@/lib/cn";
import { GameEditorCard, type GamePreviewDraft } from "@/components/games/GameEditorCard";
import {
  LiveTotemPreview,
  type PreviewScreen,
  type TotemPreviewPayload,
} from "@/components/preview/LiveTotemPreview";

type WorkspaceContextValue = {
  activeTab: string;
  updatePreview: (draft: Partial<TotemPreviewPayload>) => void;
  updateEditorState: (state: { dirty: boolean; valid: boolean }) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useGameWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useGameWorkspace debe usarse dentro de GameWorkspace.");
  return context;
}

function initialGameDraft(game: GameEditView): GamePreviewDraft {
  return {
    id: game.id,
    title: game.title,
    description: game.description,
    ctaLabel: game.cta_label,
    imageSrc: game.coverUrl ?? "",
    visible: game.visible,
    enabled: game.enabled,
    sortOrder: game.sort_order,
    accentColor: game.accent_color,
    themeOverride: game.theme_config,
  };
}

export function GameWorkspace({
  game,
  screen,
  tabs,
  children,
}: {
  game: GameEditView;
  screen: Exclude<PreviewScreen, "home" | "attract">;
  tabs: Array<{ id: string; label: string }>;
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [gameDraft, setGameDraft] = useState(() => initialGameDraft(game));
  const [domainDraft, setDomainDraft] = useState<Partial<TotemPreviewPayload>>({});
  const [commonDirty, setCommonDirty] = useState(false);
  const [commonValid, setCommonValid] = useState(true);
  const [domainState, setDomainState] = useState({ dirty: false, valid: true });

  const updatePreview = useCallback((draft: Partial<TotemPreviewPayload>) => {
    setDomainDraft(draft);
  }, []);
  const updateEditorState = useCallback((state: { dirty: boolean; valid: boolean }) => {
    setDomainState(state);
  }, []);
  const context = useMemo(
    () => ({ activeTab, updatePreview, updateEditorState }),
    [activeTab, updateEditorState, updatePreview],
  );
  const previewPayload = useMemo<TotemPreviewPayload>(
    () => {
      const domainGames = (domainDraft.config?.games as Record<string, Record<string, unknown>> | undefined) ?? {};
      const domainGame = domainGames[game.id] ?? {};
      const domainTheme = (domainGame.themeOverride as Record<string, unknown> | undefined) ?? {};
      return {
        ...domainDraft,
        screen,
        config: {
          ...(domainDraft.config ?? {}),
          games: {
            ...domainGames,
            [game.id]: {
              ...gameDraft,
              ...domainGame,
              themeOverride: { ...gameDraft.themeOverride, ...domainTheme },
            },
          },
        },
      };
    },
    [domainDraft, game.id, gameDraft, screen],
  );
  const dirty = activeTab === "design" ? commonDirty : commonDirty || domainState.dirty;
  const valid = activeTab === "design" ? commonValid : commonValid && domainState.valid;

  return (
    <WorkspaceContext.Provider value={context}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="workspace-tabs" role="tablist" aria-label="Secciones del juego">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className="workspace-tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            !valid ? "bg-danger/10 text-danger" : dirty ? "bg-black/6 text-muted" : "text-muted",
          )}
        >
          {!valid ? "Revisá los campos" : dirty ? "Cambios sin guardar" : "Todo guardado"}
        </span>
      </div>

      <div className="editor-workspace">
        <div className="min-w-0">
          <div className={cn(activeTab !== "general" && activeTab !== "design" && "hidden")}>
            <GameEditorCard
              game={game}
              section={activeTab === "design" ? "design" : "general"}
              onDraftChange={setGameDraft}
              onDirtyChange={setCommonDirty}
              onValidationChange={setCommonValid}
            />
          </div>
          <div>{children}</div>
        </div>
        <div className="editor-workspace__preview">
          <LiveTotemPreview payload={previewPayload} title={`Preview · ${game.title}`} />
        </div>
      </div>
    </WorkspaceContext.Provider>
  );
}
