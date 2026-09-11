import Link from "next/link";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import type { GameEditView } from "@/lib/data/games";
import { GAME_META, gameLabel } from "@/lib/games";
import { Badge } from "@/components/ui/Badge";

export function GamesCatalog({ games }: { games: GameEditView[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-panel-border bg-white">
      <div className="hidden grid-cols-[76px_minmax(0,1fr)_150px_130px] gap-5 border-b border-panel-border px-5 py-3 text-xs font-medium uppercase tracking-[0.1em] text-muted sm:grid">
        <span>Portada</span>
        <span>Experiencia</span>
        <span>Estado</span>
        <span className="sr-only">Acciones</span>
      </div>
      <div className="divide-y divide-panel-border">
        {games.map((game) => {
          const href = GAME_META[game.id]?.configHref;
          const unavailable = !game.enabled || game.maintenance_mode;
          return (
            <div
              key={game.id}
              className="grid gap-4 px-4 py-4 transition hover:bg-surface/45 sm:grid-cols-[76px_minmax(0,1fr)_150px_130px] sm:items-center sm:gap-5 sm:px-5"
            >
              <div className="relative hidden h-14 w-[76px] overflow-hidden rounded-lg bg-surface sm:grid sm:place-items-center">
                {game.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={game.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={19} className="text-muted" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{gameLabel(game.id)}</p>
                <p className="mt-1 truncate text-sm text-muted">{game.title || game.description}</p>
              </div>
              <div>
                {game.maintenance_mode ? (
                  <Badge tone="warning">Mantenimiento</Badge>
                ) : game.enabled && game.visible ? (
                  <Badge tone="success">Activo</Badge>
                ) : game.visible ? (
                  <Badge tone="neutral">Bloqueado</Badge>
                ) : (
                  <Badge tone="neutral">Oculto</Badge>
                )}
                {unavailable ? <span className="sr-only">No disponible para jugar</span> : null}
              </div>
              {href ? (
                <Link
                  href={href}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-panel-border bg-white px-3 text-sm font-semibold text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                >
                  Configurar
                  <ArrowUpRight size={15} />
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
