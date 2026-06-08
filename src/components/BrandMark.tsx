import { cn } from "@/lib/cn";

/** Logo textual CBS+CNH, consistente con la identidad de la app. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <span className="rounded-lg bg-orange px-2 py-0.5 text-white">CBS+</span>
      <span className="rounded-lg bg-cnh px-2 py-0.5 text-white">CNH</span>
    </div>
  );
}
