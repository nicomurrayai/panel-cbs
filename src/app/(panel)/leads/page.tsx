import { getLeadsFormConfig, getLeadsPage, LEADS_PAGE_SIZE } from "@/lib/data/leads";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsFormEditor } from "@/components/leads/LeadsFormEditor";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  let initial: Awaited<ReturnType<typeof getLeadsPage>> | null = null;
  let formConfig: Awaited<ReturnType<typeof getLeadsFormConfig>> | null = null;
  let error: string | null = null;

  try {
    [initial, formConfig] = await Promise.all([
      getLeadsPage({ page: 0, pageSize: LEADS_PAGE_SIZE }),
      getLeadsFormConfig(),
    ]);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Error desconocido";
  }

  return (
    <>
      <PageIntro
        title="Leads"
        description="Configurá el formulario del tótem (hasta 5 campos) y revisá los registros en tiempo real."
      />
      {error || !initial || !formConfig ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <div className="space-y-5">
          <LeadsFormEditor initial={formConfig} />
          <LeadsTable initial={initial} pageSize={LEADS_PAGE_SIZE} formConfig={formConfig} />
        </div>
      )}
    </>
  );
}
