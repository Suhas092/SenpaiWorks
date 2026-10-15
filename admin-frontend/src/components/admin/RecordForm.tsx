import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/form/FormField";
import { validateFields } from "@/lib/validation";
import type { AdminRecord, FormValues, ResourceConfig } from "@/types";

export function RecordForm({
  config,
  record,
  onClose,
  onSave,
  busy,
}: {
  config: ResourceConfig;
  record?: AdminRecord | undefined;
  onClose: () => void;
  onSave: (values: FormValues) => void;
  busy: boolean;
}) {
  const fields = record && config.fieldsFor ? config.fieldsFor(record) : config.fields;
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(
      fields.map((f) => {
        if (record) {
          const current = record[f.key];
          if (f.type === "checkbox") return [f.key, current === true];
          return [f.key, f.type === "number" ? Number(current) || 0 : String(current ?? "")];
        }
        if (f.type === "checkbox") return [f.key, false];
        if (f.type === "select") return [f.key, f.options?.[0] ?? ""];
        if (f.type === "number") return [f.key, 0];
        return [f.key, ""];
      }),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateFields(fields, values);
    if (!result.success) {
      setErrors(
        Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message])),
      );
      return;
    }
    setErrors({});
    onSave(result.data as FormValues);
  };

  return (
    <Modal title={`${record ? "Edit" : "Add"} ${config.singular}`} open onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          {record && (
            <div className="col-span-full text-xs text-muted-foreground">ID: {record.id}</div>
          )}
          {fields.map((f) => (
            <FormField
              key={f.key}
              field={f}
              value={values[f.key] ?? ""}
              error={errors[f.key]}
              onChange={(v) => setValues({ ...values, [f.key]: v })}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
