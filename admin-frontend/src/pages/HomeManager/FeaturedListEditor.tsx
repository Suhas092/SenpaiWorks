import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useFetch } from "@/hooks/useFetch";
import { useMutate } from "@/hooks/useMutate";
import type { Field } from "@/types";
import {
  ItemFormModal,
  RankedList,
  errorMessage,
  mediaUrl,
  nextOrder,
  sortByOrder,
  useRanking,
} from "./shared";

const SHOWCASE_PATH = "/admin/homepage/showcase-items";
const SECTION = "things_you_might_like";

export type ShowcaseItem = {
  id: string;
  section: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  btnText: string;
  order: number;
  published: boolean;
};

const SHOWCASE_FIELDS: Field[] = [
  { key: "title", label: "Title", required: true },
  { key: "subtitle", label: "Subtitle" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "imageUrl", label: "Image URL", required: true },
  { key: "btnText", label: "Button text" },
  { key: "linkUrl", label: "Button link" },
  { key: "order", label: "Display order", type: "number" },
];

const SHOWCASE_LINK_KEYS = ["linkUrl"];

const toValues = (item: ShowcaseItem | undefined, order: number): Record<string, string> =>
  item
    ? {
        title: item.title ?? "",
        subtitle: item.subtitle ?? "",
        description: item.description ?? "",
        imageUrl: item.imageUrl ?? "",
        btnText: item.btnText ?? "",
        linkUrl: item.linkUrl ?? "",
        order: String(item.order ?? 0),
      }
    : {
        title: "",
        subtitle: "",
        description: "",
        imageUrl: "",
        btnText: "Explore",
        linkUrl: "",
        order: String(order),
      };

export function FeaturedListEditor() {
  const items = useFetch<ShowcaseItem[]>(SHOWCASE_PATH);
  const serverRows = useMemo(
    () =>
      sortByOrder(
        (Array.isArray(items.data) ? items.data : []).filter((item) => item.section === SECTION),
      ),
    [items.data],
  );
  const ranking = useRanking(serverRows, SHOWCASE_PATH);
  const mutation = useMutate<Record<string, unknown>>(SHOWCASE_PATH);
  const [editing, setEditing] = useState<ShowcaseItem | "new" | null>(null);
  const [removing, setRemoving] = useState<ShowcaseItem | null>(null);
  const editingItem = editing && editing !== "new" ? editing : undefined;

  const saveItem = async (
    values: Record<string, string>,
    published: boolean,
    item: ShowcaseItem | undefined,
  ) => {
    const data = {
      section: SECTION,
      title: values["title"],
      subtitle: values["subtitle"],
      description: values["description"],
      imageUrl: values["imageUrl"],
      btnText: values["btnText"],
      linkUrl: values["linkUrl"],
      order: Number(values["order"]) || 0,
      published,
    };
    try {
      await mutation.mutateAsync(
        item ? { method: "PUT", id: item.id, data } : { method: "POST", data },
      );
      toast.success("Item saved");
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to save the item"));
    }
  };

  const togglePublished = async (item: ShowcaseItem) => {
    try {
      await mutation.mutateAsync({
        method: "PUT",
        id: item.id,
        data: { published: !item.published },
      });
      toast.success(item.published ? "Item hidden" : "Item visible on home page");
    } catch (err) {
      toast.error(errorMessage(err, "Unable to update the item"));
    }
  };

  const confirmDelete = async () => {
    if (!removing) return;
    try {
      await mutation.mutateAsync({ method: "DELETE", id: removing.id });
      toast.success("Item deleted");
      setRemoving(null);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete the item"));
    }
  };

  return (
    <>
      <RankedList<ShowcaseItem>
        rows={ranking.rows}
        changed={ranking.changed}
        saving={ranking.saving}
        loading={items.isLoading}
        loadError={
          items.isError
            ? "Could not load the showcase items. The server may be busy; try again."
            : undefined
        }
        onRetry={() => void items.refetch()}
        emptyText="No items in this section yet. Add one to show it on the home page."
        addLabel="Add item"
        onAdd={() => setEditing("new")}
        onMove={ranking.moveTo}
        onSaveOrder={() => void ranking.saveOrder()}
        onEdit={(row) => setEditing(row)}
        onDelete={(row) => setRemoving(row)}
        onTogglePublished={(row) => void togglePublished(row)}
        renderThumb={(item) =>
          item.imageUrl ? (
            <img
              src={mediaUrl(item.imageUrl)}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded bg-muted object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded bg-muted" />
          )
        }
        renderMeta={(item) => (
          <p className="truncate text-xs text-muted-foreground">
            {item.subtitle || "No subtitle"} · {item.btnText || "No button"}
          </p>
        )}
      />
      {editing && (
        <ItemFormModal
          title={editingItem ? "Edit showcase item" : "Add showcase item"}
          fields={SHOWCASE_FIELDS}
          initialValues={toValues(editingItem, nextOrder(ranking.rows))}
          initialPublished={editingItem ? editingItem.published : true}
          linkKeys={SHOWCASE_LINK_KEYS}
          onSubmit={(values, published) => saveItem(values, published, editingItem)}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <ConfirmModal
          title="Delete showcase item?"
          body={`"${removing.title}" will be removed from Things You Might Like. Its image is kept in trash for 14 days.`}
          confirmLabel="Delete"
          busy={mutation.isPending}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setRemoving(null)}
        />
      )}
    </>
  );
}

