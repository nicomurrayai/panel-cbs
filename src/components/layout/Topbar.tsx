"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConnectionStatus } from "./ConnectionStatus";
import { currentLabel } from "./Navigation";

export function Topbar() {
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-panel-border bg-white/90 px-4 backdrop-blur lg:px-10">
      <h1 className="text-sm font-semibold text-ink">{currentLabel(pathname)}</h1>
      <div className="flex items-center gap-3 md:hidden">
        <ConnectionStatus />
        <Button variant="secondary" size="sm" onClick={logout} loading={loading}>
          <LogOut size={15} />
          Salir
        </Button>
      </div>
    </header>
  );
}
