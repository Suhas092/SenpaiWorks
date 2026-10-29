import { useEffect, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/form/FormField";
import { useMutate } from "@/hooks/useMutate";
import { validateFields } from "@/lib/validation";
import type { Field } from "@/types";

export type Rankable = { id: string; order: number };
export type ListRow = Rankable & { title: string; published: boolean };

export const LINK_ERROR = "Use a page such as news.html or /store, an # anchor, or a secure https:// link.";

export const isSafeLink = (value: string) =>
  !value ||
  (!value.startsWith("//") &&
    (/^https:\/\//i.test(value) || !/^[a-z][a-z0-9+.-]*:/i.test(value)));

/** Stored media paths such as "assets/..." are resolved against the site root so they load inside the console. */
export function mediaUrl(url: string) {
  if (!url) return "";
  return /^(https?:|data:|blob:|\/)/i.test(url) ? url : `/${url}`;
}

export const sortByOrder = <T extends Rankable>(rows: T[]) =>
  [...rows].sort((a, b) => a.order - b.order);

export const nextOrder = (rows: Rankable[]) =>
  rows.reduce((max, row) => Math.max(max, row.order), -1) + 1;

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * Local ranking state for a list. A move updates the local order. With `autoSave` each moved row
 * is written immediately; otherwise `saveOrder` writes the positions that differ from the server.
 */
export function useRanking<T extends Rankable>(
  serverRows: T[],
  path: string,
  { autoSave = false }: { autoSave?: boolean } = {},
) {
  const [rows, setRows] = useState<T[]>(serverRows);
  const mutation = useMutate<{ order: number }>(path);

  useEffect(() => {
    setRows(serverRows);
  }, [serverRows]);

  // Only the sequence of ids matters here.
  const changed = rows.some((row, i) => serverRows[i]?.id !== row.id);

  const writeOrders = (updates: Rankable[]) =>
    Promise.all(
      updates.map((u) =>
        mutation.mutateAsync({ method: "PUT", id: u.id, data: { order: u.order } }),
      ),
    );

  const moveTo = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) return;
    const moved = [...rows];
    const [item] = moved.splice(from, 1);
    if (!item) return;
    moved.splice(to, 0, item);
    const next = moved.map((row, i) => ({ ...row, order: i }));
    const before = new Map(rows.map((row) => [row.id, row.order]));
    setRows(next);
    if (!autoSave) return;
    const updates = next.filter((row) => before.get(row.id) !== row.order);
    writeOrders(updates).catch((err) => {
      setRows(rows);
      toast.error(errorMessage(err, "Unable to save the order"));
    });
  };

  const saveOrder = async () => {
    const updates = rows.flatMap((row, i) => {
      const saved = serverRows.find((s) => s.id === row.id);
      return saved?.order === i ? [] : [{ id: row.id, order: i }];
    });
    try {
      await writeOrders(updates);
      toast.success("Order saved");
    } catch (err) {
      toast.error(errorMessage(err, "Unable to save the order"));
    }
  };

  return { rows, changed, moveTo, saveOrder, saving: mutation.isPending };
}

type RankedListProps<T extends ListRow> = {
  rows: T[];
  changed: boolean;
  arrowsOnly?: boolean;
  autoSave?: boolean;
  saving: boolean;
  loading: boolean;
  loadError: string | undefined;
  onRetry: () => void;
  emptyText: string;
  addLabel: string;
  onAdd: () => void;
  onMove: (from: number, to: number) => void;
  onSaveOrder: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onTogglePublished: (row: T) => void;
  renderThumb: (row: T) => ReactNode;
  renderMeta: (row: T) => ReactNode;
};

export function RankedList<T extends ListRow>({
  rows,
  changed,
  arrowsOnly = false,
  autoSave = false,
  saving,
  loading,
  loadError,
  onRetry,
  emptyText,
  addLabel,
  onAdd,
  onMove,
  onSaveOrder,
  onEdit,
  onDelete,
  onTogglePublished,
  renderThumb,
  renderMeta,
}: RankedListProps<T>) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {autoSave
            ? `${arrowsOnly ? "Use the arrows" : "Drag rows or use the arrows"} to change the order. Changes save automatically.`
            : "Drag rows or use the arrows to change the order, then save the order."}
        </p>
        <Button onClick={onAdd}>
          <Plus /> {addLabel}
        </Button>
      </div>
      {loadError && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && !loadError && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
      {rows.map((row, i) => (
        <div
          key={row.id}
          className="featured-row flex items-center gap-3"
          {...(arrowsOnly
            ? {}
            : {
                draggable: true,
                onDragStart: (e: DragEvent<HTMLDivElement>) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(i));
                },
                onDragOver: (e: DragEvent<HTMLDivElement>) => e.preventDefault(),
                onDrop: (e: DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  onMove(Number(e.dataTransfer.getData("text/plain")), i);
                },
              })}
        >
          {!arrowsOnly && <GripVertical size={17} aria-hidden="true" />}
          {renderThumb(row)}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{row.title}</p>
            {renderMeta(row)}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTogglePublished(row)}
            aria-label={`${row.published ? "Hide" : "Show"} ${row.title}`}
          >
            {row.published ? <Eye /> : <EyeOff />}
            {row.published ? "Visible" : "Hidden"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Move ${row.title} up`}
            disabled={saving || i === 0}
            onClick={() => onMove(i, i - 1)}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Move ${row.title} down`}
            disabled={saving || i === rows.length - 1}
            onClick={() => onMove(i, i + 1)}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${row.title}`}
            onClick={() => onEdit(row)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${row.title}`}
            onClick={() => onDelete(row)}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      {!autoSave && (
        <Button className="mt-5" disabled={!changed || saving} onClick={onSaveOrder}>
          Save order
        </Button>
      )}
    </div>
  );
}

type ItemFormModalProps = {
  title: string;
  fields: Field[];
  initialValues: Record<string, string>;
  initialPublished: boolean;
  linkKeys: string[];
  /** Read-only position text kept in sync with the list (arrows and drag update it live). */
  positionLabel?: string | undefined;
  onSubmit: (values: Record<string, string>, published: boolean) => Promise<void>;
  onClose: () => void;
};

export function ItemFormModal({
  title,
  fields,
  initialValues,
  initialPublished,
  linkKeys,
  positionLabel,
  onSubmit,
  onClose,
}: ItemFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [published, setPublished] = useState(initialPublished);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = validateFields(fields, values);
    if (!result.success) {
      setErrors(
        Object.fromEntries(result.error.issues.map((i) => [String(i.path[0]), i.message])),
      );
      return;
    }
    const linkErrors = Object.fromEntries(
      linkKeys.filter((k) => !isSafeLink(values[k] ?? "")).map((k) => [k, LINK_ERROR]),
    );
    if (Object.keys(linkErrors).length > 0) {
      setErrors(linkErrors);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSubmit(values, published);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={title} open onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {positionLabel && (
          <div className="mb-4 rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Position: </span>
            <span className="font-medium">{positionLabel}</span>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <FormField
              key={f.key}
              field={f}
              value={values[f.key] ?? ""}
              error={errors[f.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: String(v) }))}
            />
          ))}
        </div>
        <label className="mt-5 flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Visible on home page
        </label>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
