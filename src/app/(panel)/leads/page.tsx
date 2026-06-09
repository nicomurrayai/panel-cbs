import { getLeadsPage, LEADS_PAGE_SIZE } from "@/lib/data/leads";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { LeadsTable } from "@/components/leads/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  let initial: Awaited<ReturnType<typeof getLeadsPage>> | null = null;
  let error: string | null = null;

  try {
    initial = await getLeadsPage({ page: 0, pageSize: LEADS_PAGE_SIZE });
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Leads"
        description="Registros de legajo capturados antes de iniciar cada juego. Se actualizan en tiempo real."
      />
      {error || !initial ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <LeadsTable initial={initial} pageSize={LEADS_PAGE_SIZE} />
      )}
    </>
  );
}
