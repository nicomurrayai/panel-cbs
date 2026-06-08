"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-6 p-7">
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandMark className="text-lg" />
            <div>
              <h1 className="text-xl font-bold text-ink">Panel de administración</h1>
              <p className="text-sm text-muted">Ingresá para configurar los juegos</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Field label="Usuario" htmlFor="username">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </Field>
            <Field label="Contraseña" htmlFor="password" error={error ?? undefined}>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </Field>
            <Button type="submit" loading={loading} className="mt-1 w-full">
              <LogIn size={16} />
              Ingresar
            </Button>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
