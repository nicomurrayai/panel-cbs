/** Convierte un texto a slug (minúsculas, sin acentos, separado por guiones). */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "item"
  );
}

/** Garantiza unicidad agregando sufijos -2, -3, … si hace falta. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  let slug = base;
  let n = 2;
  while (taken.has(slug)) {
    slug = `${base}-${n++}`;
  }
  taken.add(slug);
  return slug;
}
