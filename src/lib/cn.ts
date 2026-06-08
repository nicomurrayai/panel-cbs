/** Une clases condicionalmente (mini clsx, sin dependencias). */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
