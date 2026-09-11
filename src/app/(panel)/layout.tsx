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
    <div className="flex min-h-screen bg-surface">
      <Sidebar primaryName={primaryName} secondaryName={secondaryName} logoUrl={logoUrl} />
      <div className="min-w-0 flex min-h-screen flex-1 flex-col">
        <Topbar />
        <MobileNav />
        <main className="admin-page mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
