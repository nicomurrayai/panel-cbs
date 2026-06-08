"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Disc3,
  Brain,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/cn";

export const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/ruleta", label: "Ruleta", icon: Disc3 },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function currentLabel(pathname: string): string {
  const match = [...NAV_LINKS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((l) => isActive(pathname, l.href));
  return match?.label ?? "Panel";
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r border-panel-border bg-white/70 px-3 py-5 backdrop-blur md:flex">
      <div className="px-2 pb-5">
        <BrandMark />
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                active
                  ? "bg-orange text-white shadow-tight"
                  : "text-ink hover:bg-cream-strong",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto px-2 text-xs text-muted">CBS+CNH · Admin</p>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-panel-border bg-white/80 px-2 py-2 md:hidden">
      {NAV_LINKS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              active ? "bg-orange text-white" : "text-ink hover:bg-cream-strong",
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
