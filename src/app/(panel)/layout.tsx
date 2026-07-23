import { Sidebar, MobileNav } from "@/components/layout/Navigation";
import { Topbar } from "@/components/layout/Topbar";
import { getGlobalSettings } from "@/lib/data/global";
import { DEFAULT_BRANDING } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let primaryName = DEFAULT_BRANDING.primaryName;
  let secondaryName = DEFAULT_BRANDING.secondaryName;
  let logoUrl: string | null = null;

  try {
    const settings = await getGlobalSettings();
    primaryName = settings.branding.primaryName;
    secondaryName = settings.branding.secondaryName;
    logoUrl = settings.logoUrl;
  } catch {
    // Build/prerender sin env, o Supabase caído: chrome neutro por defecto.
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar primaryName={primaryName} secondaryName={secondaryName} logoUrl={logoUrl} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <MobileNav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
