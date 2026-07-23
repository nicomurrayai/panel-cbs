import { forwardRef } from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-xl border border-panel-border bg-white px-3 py-2 text-sm text-ink " +
  "placeholder:text-muted/60 transition focus:border-accent focus:outline-none " +
  "focus:ring-2 focus:ring-accent/30 disabled:opacity-60 aria-[invalid=true]:border-danger " +
  "aria-[invalid=true]:ring-danger/25";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, "h-10", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(fieldBase, "min-h-20 resize-y py-2", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, "h-10", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";
