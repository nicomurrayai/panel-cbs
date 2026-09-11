"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dices,
  Images,
  LogOut,
  Palette,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/juegos", label: "Juegos", icon: Dices },
  { href: "/global", label: "Apariencia", icon: Palette },
  { href: "/medios", label: "Recursos", icon: Images },
  { href: "/leads", label: "Leads", icon: Users },
];
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/juegos" && ["/ruleta", "/memory", "/quiz", "/match"].some((route) => pathname.startsWith(route))) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentLabel(pathname: string): string {
  const gameLabels: Record<string, string> = {
    "/ruleta": "Juegos / Ruleta",
    "/memory": "Juegos / Memory Card",
    "/quiz": "Juegos / Quiz",
    "/match": "Juegos / Relacionar",
  };
  if (gameLabels[pathname]) return gameLabels[pathname];
  const match = [...NAV_LINKS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => isActive(pathname, l.href));
  return match?.label ?? "Panel";
}

type BrandingProps = {
  primaryName?: string;
  secondaryName?: string;
  logoUrl?: string | null;
};

export function Sidebar({ primaryName, secondaryName, logoUrl }: BrandingProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-panel-border bg-white px-3 py-5 md:flex">
      <div className="px-2 pb-7">
        <BrandMark primaryName={primaryName} secondaryName={secondaryName} logoUrl={logoUrl} />
      </div>
      <nav className="flex flex-col gap-1" aria-label="Navegación principal">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active
                  ? "bg-surface text-ink"
                  : "text-muted hover:bg-surface/70 hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-panel-border px-2 pt-4">
        <ConnectionStatus compact />
        <Button className="w-full justify-start" variant="ghost" size="sm" onClick={logout} loading={loading}>
          <LogOut size={15} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-panel-border bg-white px-3 py-2 md:hidden" aria-label="Navegación principal">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition",
              active ? "bg-surface text-ink" : "text-muted hover:bg-surface",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
