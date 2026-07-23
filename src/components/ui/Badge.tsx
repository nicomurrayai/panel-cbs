import { cn } from "@/lib/cn";

type Tone = "success" | "danger" | "neutral" | "warning" | "info";

const tones: Record<Tone, string> = {
  success: "bg-success/12 text-success",
  danger: "bg-danger/12 text-danger",
  warning: "bg-accent/15 text-accent-deep",
  info: "bg-inverse/10 text-inverse",
  neutral: "bg-black/6 text-muted",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
