import { getLeadsFormConfig, getLeadsPage, LEADS_PAGE_SIZE } from "@/lib/data/leads";
import { PageIntro } from "@/components/ui/PageIntro";
import { SetupNotice } from "@/components/SetupNotice";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsFormEditor } from "@/components/leads/LeadsFormEditor";
import { LeadsWorkspace } from "@/components/leads/LeadsWorkspace";

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
        description="Revisá los registros capturados o ajustá por separado el formulario que ve cada visitante."
      />
      {error || !initial || !formConfig ? (
        <SetupNotice error={error ?? "Sin datos"} />
      ) : (
        <LeadsWorkspace
          records={<LeadsTable initial={initial} pageSize={LEADS_PAGE_SIZE} formConfig={formConfig} />}
          form={<LeadsFormEditor initial={formConfig} />}
        />
      )}
    </>
  );
}
