import { AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

/** Aviso cuando Supabase no esta configurado o falla la conexion. */
export function SetupNotice({ error }: { error: string }) {
  return (
    <Card className="border-orange/40">
      <CardBody className="flex gap-4">
        <AlertTriangle className="mt-0.5 shrink-0 text-orange-deep" />
        <div className="space-y-2 text-sm">
          <p className="font-bold text-ink">No se pudo conectar con Supabase</p>
          <p className="text-muted">
            Revisa <code className="rounded bg-black/5 px-1">.env.local</code> y asegurate de tener{" "}
            <code className="rounded bg-black/5 px-1">SUPABASE_URL</code> y una clave de servidor:{" "}
            <code className="rounded bg-black/5 px-1">SUPABASE_SECRET_KEY</code> o{" "}
            <code className="rounded bg-black/5 px-1">SUPABASE_SERVICE_ROLE_KEY</code>. Si acabas de editar
            el archivo, reinicia el servidor.
          </p>
          <p className="rounded-lg bg-black/5 px-3 py-2 font-mono text-xs text-muted">
            {error}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
