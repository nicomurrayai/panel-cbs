import { z } from "zod";

export const LEADS_FORM_MAX_FIELDS = 5;

export const leadsFieldTypeSchema = z.enum(["text", "number", "email", "tel"]);

export const leadsFormFieldSchema = z.object({
  id: z.string().trim().min(1).max(40),
  key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z][a-z0-9_]*$/, "La clave debe ser snake_case (ej. legajo, email)"),
  label: z.string().trim().min(1, "El label es obligatorio").max(80),
  type: leadsFieldTypeSchema,
  required: z.boolean(),
  placeholder: z.string().trim().max(120).default(""),
});

export const leadsFormSchema = z
  .object({
    enabled: z.boolean(),
    title: z.string().trim().min(1).max(120),
    subtitle: z.string().trim().max(160),
    submitLabel: z.string().trim().min(1).max(40),
    fields: z.array(leadsFormFieldSchema).max(LEADS_FORM_MAX_FIELDS),
  })
  .superRefine((value, ctx) => {
    if (value.enabled && value.fields.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Con el formulario activo necesitás al menos 1 campo.",
        path: ["fields"],
      });
    }

    const keys = value.fields.map((field) => field.key);
    const unique = new Set(keys);
    if (unique.size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las claves de los campos deben ser únicas.",
        path: ["fields"],
      });
    }
  });

export type LeadsFieldType = z.infer<typeof leadsFieldTypeSchema>;
export type LeadsFormField = z.infer<typeof leadsFormFieldSchema>;
export type LeadsFormConfig = z.infer<typeof leadsFormSchema>;

export const DEFAULT_LEADS_FORM: LeadsFormConfig = {
  enabled: true,
  title: "Ingresa tus datos",
  subtitle: "Antes de comenzar",
  submitLabel: "Comenzar",
  fields: [
    {
      id: "legajo",
      key: "legajo",
      label: "Numero de Legajo",
      type: "text",
      required: true,
      placeholder: "Ej. 12345",
    },
  ],
};

const FIELD_TYPES = new Set<LeadsFieldType>(["text", "number", "email", "tel"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function slugKey(value: string, fallback: string): string {
  const cleaned = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (/^[a-z][a-z0-9_]*$/.test(cleaned)) return cleaned.slice(0, 40);
  return fallback;
}

export function normalizeLeadsForm(raw: unknown): LeadsFormConfig {
  const source = isRecord(raw) ? raw : {};
  const fieldsRaw = Array.isArray(source.fields) ? source.fields : DEFAULT_LEADS_FORM.fields;
  const fields: LeadsFormField[] = [];

  for (const [index, item] of fieldsRaw.slice(0, LEADS_FORM_MAX_FIELDS).entries()) {
    if (!isRecord(item)) continue;
    const fallbackKey = `campo_${index + 1}`;
    const key =
      typeof item.key === "string" && /^[a-z][a-z0-9_]*$/.test(item.key.trim())
        ? item.key.trim()
        : slugKey(typeof item.label === "string" ? item.label : fallbackKey, fallbackKey);
    const type = FIELD_TYPES.has(item.type as LeadsFieldType) ? (item.type as LeadsFieldType) : "text";
    fields.push({
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : key,
      key,
      label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : `Campo ${index + 1}`,
      type,
      required: typeof item.required === "boolean" ? item.required : true,
      placeholder: typeof item.placeholder === "string" ? item.placeholder : "",
    });
  }

  const uniqueFields: LeadsFormField[] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);
    uniqueFields.push(field);
  }

  const normalized: LeadsFormConfig = {
    enabled: typeof source.enabled === "boolean" ? source.enabled : DEFAULT_LEADS_FORM.enabled,
    title:
      typeof source.title === "string" && source.title.trim()
        ? source.title.trim()
        : DEFAULT_LEADS_FORM.title,
    subtitle:
      typeof source.subtitle === "string" ? source.subtitle.trim() : DEFAULT_LEADS_FORM.subtitle,
    submitLabel:
      typeof source.submitLabel === "string" && source.submitLabel.trim()
        ? source.submitLabel.trim()
        : DEFAULT_LEADS_FORM.submitLabel,
    fields: uniqueFields.length > 0 ? uniqueFields : DEFAULT_LEADS_FORM.fields,
  };

  return normalized;
}
