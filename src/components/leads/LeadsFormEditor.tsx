"use client";

import { useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveLeadsForm } from "@/actions/leadsForm";
import {
  DEFAULT_LEADS_FORM,
  LEADS_FORM_MAX_FIELDS,
  leadsFormSchema,
  type LeadsFormConfig,
  type LeadsFormField,
  type LeadsFieldType,
} from "@/lib/validation/leadsForm";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { useAsyncAction } from "@/hooks/useAsyncAction";

function newField(index: number): LeadsFormField {
  return {
    id: `campo_${Date.now()}_${index}`,
    key: `campo_${index + 1}`,
    label: `Campo ${index + 1}`,
    type: "text",
    required: true,
    placeholder: "",
  };
}

function slugifyKey(label: string, fallback: string): string {
  const cleaned = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return /^[a-z][a-z0-9_]*$/.test(cleaned) ? cleaned.slice(0, 40) : fallback;
}

export function LeadsFormEditor({ initial }: { initial: LeadsFormConfig }) {
  const { run, isPending } = useAsyncAction();
  const [form, setForm] = useState<LeadsFormConfig>(initial);

  const canAdd = form.fields.length < LEADS_FORM_MAX_FIELDS;

  const previewFields = useMemo(() => form.fields, [form.fields]);

  function updateField(index: number, patch: Partial<LeadsFormField>) {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    }));
  }

  function addField() {
    if (!canAdd) return;
    setForm((prev) => ({
      ...prev,
      fields: [...prev.fields, newField(prev.fields.length)],
    }));
  }

  function removeField(index: number) {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  }

  function save() {
    const parsed = leadsFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
      return;
    }
    run(() => saveLeadsForm(parsed.data), {
      success: "Formulario de leads guardado",
    });
  }

  return (
    <Card>
      <CardHeader
        title="Formulario del tótem"
        description="Activá o desactivá la captura de leads y configurá hasta 5 campos."
      />
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-panel-border bg-surface/40 px-4 py-3">
          <div>
            <p className="text-sm font-bold text-ink">Formulario activo</p>
            <p className="text-xs text-muted">
              Si está apagado, los juegos arrancan sin pedir datos.
            </p>
          </div>
          <Toggle
            checked={form.enabled}
            onChange={(enabled) => setForm((prev) => ({ ...prev, enabled }))}
            label="Formulario activo"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Título">
            <Input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </Field>
          <Field label="Texto del botón">
            <Input
              value={form.submitLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, submitLabel: event.target.value }))}
            />
          </Field>
          <Field label="Subtítulo / eyebrow" className="md:col-span-2">
            <Input
              value={form.subtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
            />
          </Field>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">
              Campos ({form.fields.length}/{LEADS_FORM_MAX_FIELDS})
            </p>
            <Button type="button" size="sm" variant="secondary" onClick={addField} disabled={!canAdd}>
              <Plus size={14} />
              Agregar campo
            </Button>
          </div>

          {previewFields.length === 0 ? (
            <p className="rounded-xl border border-dashed border-panel-border px-4 py-6 text-center text-sm text-muted">
              No hay campos. Agregá al menos uno si el formulario está activo.
            </p>
          ) : (
            previewFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-2xl border border-panel-border bg-white p-4 md:grid-cols-[1.2fr_1fr_8rem_auto_auto]"
              >
                <Field label="Label">
                  <Input
                    value={field.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      const shouldSyncKey =
                        field.key === slugifyKey(field.label, field.key) ||
                        /^campo_\d+$/.test(field.key);
                      updateField(index, {
                        label,
                        ...(shouldSyncKey
                          ? { key: slugifyKey(label, `campo_${index + 1}`) }
                          : {}),
                      });
                    }}
                  />
                </Field>
                <Field label="Clave (export/API)">
                  <Input
                    value={field.key}
                    onChange={(event) =>
                      updateField(index, {
                        key: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "")
                          .slice(0, 40),
                      })
                    }
                  />
                </Field>
                <Field label="Tipo">
                  <select
                    className="h-10 w-full rounded-xl border border-panel-border bg-white px-3 text-sm"
                    value={field.type}
                    onChange={(event) =>
                      updateField(index, { type: event.target.value as LeadsFieldType })
                    }
                  >
                    <option value="text">Texto</option>
                    <option value="number">Número</option>
                    <option value="email">Email</option>
                    <option value="tel">Teléfono</option>
                  </select>
                </Field>
                <Field label="Obligatorio">
                  <div className="flex h-10 items-center">
                    <Toggle
                      checked={field.required}
                      onChange={(required) => updateField(index, { required })}
                      label={`Obligatorio ${field.label}`}
                    />
                  </div>
                </Field>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeField(index)}
                    disabled={form.fields.length <= 1 && form.enabled}
                    aria-label="Eliminar campo"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
                <Field label="Placeholder" className="md:col-span-full">
                  <Input
                    value={field.placeholder}
                    onChange={(event) => updateField(index, { placeholder: event.target.value })}
                  />
                </Field>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setForm({ ...DEFAULT_LEADS_FORM, fields: DEFAULT_LEADS_FORM.fields.map((f) => ({ ...f })) })}
          >
            Restaurar default (legajo)
          </Button>
          <Button onClick={save} loading={isPending}>
            <Save size={16} />
            Guardar formulario
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
