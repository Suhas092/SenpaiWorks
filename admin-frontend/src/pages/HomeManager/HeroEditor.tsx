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

export const HERO_PATH = "/admin/homepage/hero-slides";


export type HeroSlide = {
  id: string;
  spotlight: string;
  title: string;
  description: string;
  bgType: string;
  bgUrl: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  order: number;
  published: boolean;
};

const HERO_FIELDS: Field[] = [
  { key: "spotlight", label: "Spotlight label" },
  { key: "title", label: "Banner title", required: true },
  { key: "description", label: "Subtitle", type: "textarea" },
  { key: "bgType", label: "Background type", type: "select", options: ["image", "video"] },
  { key: "bgUrl", label: "Background URL (image or video)", required: true },
  { key: "primaryBtnText", label: "Button 1 text" },
  { key: "primaryBtnLink", label: "Button 1 link" },
  { key: "secondaryBtnText", label: "Button 2 text" },
  { key: "secondaryBtnLink", label: "Button 2 link" },
  { key: "order", label: "Display order", type: "number" },
];

const HERO_LINK_KEYS = ["primaryBtnLink", "secondaryBtnLink"];

const toValues = (slide: HeroSlide | undefined, order: number): Record<string, string> =>
  slide
    ? {
        spotlight: slide.spotlight ?? "",
        title: slide.title ?? "",
        description: slide.description ?? "",
        bgType: slide.bgType || "image",
        bgUrl: slide.bgUrl ?? "",
        primaryBtnText: slide.primaryBtnText ?? "",
        primaryBtnLink: slide.primaryBtnLink ?? "",
        secondaryBtnText: slide.secondaryBtnText ?? "",
        secondaryBtnLink: slide.secondaryBtnLink ?? "",
        order: String(slide.order ?? 0),
      }
    : {
        spotlight: "#1 Spotlight",
        title: "",
        description: "",
        bgType: "image",
        bgUrl: "",
        primaryBtnText: "Watch Now",
        primaryBtnLink: "",
        secondaryBtnText: "Details",
        secondaryBtnLink: "",
        order: String(order),
      };

export function HeroEditor() {
  const slides = useFetch<HeroSlide[]>(HERO_PATH);
  const serverRows = useMemo(
    () => (Array.isArray(slides.data) ? sortByOrder(slides.data) : []),
    [slides.data],
  );
  const ranking = useRanking(serverRows, HERO_PATH);
  const mutation = useMutate<Record<string, unknown>>(HERO_PATH);
  const [editing, setEditing] = useState<HeroSlide | "new" | null>(null);
  const [removing, setRemoving] = useState<HeroSlide | null>(null);
  const editingSlide = editing && editing !== "new" ? editing : undefined;

  const saveSlide = async (
    values: Record<string, string>,
    published: boolean,
    slide: HeroSlide | undefined,
  ) => {
    const data = {
      spotlight: values["spotlight"],
      title: values["title"],
      description: values["description"],
      bgType: values["bgType"],
      bgUrl: values["bgUrl"],
      primaryBtnText: values["primaryBtnText"],
      primaryBtnLink: values["primaryBtnLink"],
      secondaryBtnText: values["secondaryBtnText"],
      secondaryBtnLink: values["secondaryBtnLink"],
      order: Number(values["order"]) || 0,
      published,
    };
    try {
      await mutation.mutateAsync(
        slide ? { method: "PUT", id: slide.id, data } : { method: "POST", data },
      );
      toast.success("Hero banner saved");
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to save hero banner"));
    }
  };

  const togglePublished = async (slide: HeroSlide) => {
    try {
      await mutation.mutateAsync({
        method: "PUT",
        id: slide.id,
        data: { published: !slide.published },
      });
      toast.success(slide.published ? "Banner hidden from home page" : "Banner visible on home page");
    } catch (err) {
      toast.error(errorMessage(err, "Unable to update the banner"));
    }
  };

  const confirmDelete = async () => {
    if (!removing) return;
    try {
      await mutation.mutateAsync({ method: "DELETE", id: removing.id });
      toast.success("Banner deleted");
      setRemoving(null);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to delete the banner"));
    }
  };

  return (
    <>
      <RankedList<HeroSlide>
        rows={ranking.rows}
        changed={ranking.changed}
        saving={ranking.saving}
        loading={slides.isLoading}
        loadError={
          slides.isError
            ? "Could not load the hero banners. The server may be busy; try again."
            : undefined
        }
        onRetry={() => void slides.refetch()}
        emptyText="No hero banners yet. Add one to show it on the home page."
        addLabel="Add banner"
        onAdd={() => setEditing("new")}
        onMove={ranking.moveTo}
        onSaveOrder={() => void ranking.saveOrder()}
        onEdit={(row) => setEditing(row)}
        onDelete={(row) => setRemoving(row)}
        onTogglePublished={(row) => void togglePublished(row)}
        renderThumb={(slide) =>
          slide.bgType === "video" ? (
            <video
              src={mediaUrl(slide.bgUrl)}
              className="h-12 w-20 shrink-0 rounded bg-muted object-cover"
              muted
            />
          ) : (
            <img
              src={mediaUrl(slide.bgUrl)}
              alt=""
              loading="lazy"
              className="h-12 w-20 shrink-0 rounded bg-muted object-cover"
            />
          )
        }
        renderMeta={(slide) => (
          <p className="truncate text-xs text-muted-foreground">
            {slide.spotlight} · {slide.primaryBtnText || "No button"}
          </p>
        )}
      />
      {editing && (
        <ItemFormModal
          title={editingSlide ? "Edit hero banner" : "Add hero banner"}
          fields={HERO_FIELDS}
          initialValues={toValues(editingSlide, nextOrder(ranking.rows))}
          initialPublished={editingSlide ? editingSlide.published : true}
          linkKeys={HERO_LINK_KEYS}
          onSubmit={(values, published) => saveSlide(values, published, editingSlide)}
          onClose={() => setEditing(null)}
        />
      )}
      {removing && (
        <ConfirmModal
          title="Delete hero banner?"
          body={`"${removing.title}" will be removed from the home page. Its media is kept in trash for 14 days.`}
          confirmLabel="Delete"
          busy={mutation.isPending}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setRemoving(null)}
        />
      )}
    </>
  );
}
