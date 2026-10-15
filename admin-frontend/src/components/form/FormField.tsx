import { useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { post } from "@/api";
import type { Field } from "@/types";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function ImageInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 10 MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Could not read that file.");
    reader.onload = async () => {
      setUploading(true);
      try {
        const res = await post<{ success: boolean; url: string }>("/upload", {
          imageBase64: String(reader.result),
          fileName: file.name,
        });
        onChange(res.url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex gap-2">
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input flex-1"
      />
      <Button type="button" variant="outline" disabled={uploading} asChild>
        <label className="cursor-pointer">
          <Upload />
          {uploading ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
        </label>
      </Button>
    </div>
  );
}

export function FormField({
  field,
  value,
  error,
  onChange,
}: {
  field: Field;
  value: string | number | boolean;
  error?: string | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <label htmlFor={field.key} className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
        <input
          id={field.key}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="size-4 accent-primary"
        />
        {field.label}
      </label>
    );
  }
  const props = {
    id: field.key,
    value: String(value),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(e.target.value),
    className: "admin-input",
    "aria-invalid": !!error,
    "aria-describedby": error ? `${field.key}-error` : undefined,
  };
  return (
    <div className={field.type === "textarea" || field.type === "image" ? "col-span-full" : ""}>
      <label htmlFor={field.key} className="field-label">
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </label>
      {field.type === "image" ? (
        <ImageInput id={field.key} value={String(value)} onChange={onChange} />
      ) : field.type === "textarea" ? (
        <textarea {...props} rows={4} maxLength={10000} />
      ) : field.type === "select" ? (
        <select {...props}>
          {field.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input
          {...props}
          type={field.type || "text"}
          maxLength={255}
          step={field.type === "number" ? "any" : undefined}
        />
      )}
      {error && (
        <p id={`${field.key}-error`} className="text-xs text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
