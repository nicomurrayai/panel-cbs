"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Envuelve una Server Action: maneja loading, toasts de éxito/error y refresh.
 * La action debe devolver { ok: true } o { ok: false, error }.
 */
export function useAsyncAction() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (
      action: () => Promise<ActionResult>,
      opts?: { success?: string; onSuccess?: () => void },
    ) => {
      setError(null);
      startTransition(async () => {
        const result = await action();
        if (result.ok) {
          if (opts?.success) toast.success(opts.success);
          opts?.onSuccess?.();
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      });
    },
    [],
  );

  return { run, isPending, error };
}
