import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  primaryName?: string;
  secondaryName?: string;
  logoUrl?: string | null;
};

/** Marca textual/logo configurable (sin identidad hardcodeada). */
export function BrandMark({
  className,
  primaryName = "Juegos",
  secondaryName = "",
  logoUrl = null,
}: BrandMarkProps) {
  const primary = primaryName.trim();
  const secondary = secondaryName.trim();

  return (
    <div className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={primary || "Logo"} className="h-7 w-auto max-w-[7rem] object-contain" />
      ) : null}
      {primary ? (
        <span className="rounded-lg bg-accent px-2 py-0.5 text-white">{primary}</span>
      ) : null}
      {secondary ? (
        <span className="rounded-lg bg-inverse px-2 py-0.5 text-white">{secondary}</span>
      ) : null}
    </div>
  );
}
