/** Normaliza un recurso embebido de Supabase (puede venir como objeto o array). */
export function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
