import { useState } from "react";
import { UploadCloud } from "lucide-react";
export function UploadImage({ onChange }: { onChange: (files: File[]) => void }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const add = (files: File[]) => {
    if (
      files.some(
        (f) =>
          !["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 5 * 1024 * 1024,
      )
    ) {
      setError("Choose JPG, PNG or WebP images smaller than 5 MB.");
      return;
    }
    previews.forEach(URL.revokeObjectURL);
    setError("");
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    onChange(files);
  };
  return (
    <div className="col-span-full">
      <span className="field-label">Images</span>
      <label
        className="upload-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          add(Array.from(e.dataTransfer.files));
        }}
      >
        <UploadCloud size={24} />
        <span>Drop images here, or browse</span>
        <small>JPG, PNG, WebP · up to 5 MB</small>
        <input
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => add(Array.from(e.target.files || []))}
        />
      </label>
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex gap-2 mt-2">
        {previews.map((url) => (
          <img
            key={url}
            src={url}
            alt="Upload preview"
            className="size-16 object-cover rounded-md"
          />
        ))}
      </div>
    </div>
  );
}
