import { Sidebar, MobileNav } from "@/components/layout/Navigation";
import { Topbar } from "@/components/layout/Topbar";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
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
