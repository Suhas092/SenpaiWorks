import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NEWS_PLACEMENTS } from "@/data/resources";
import { useFetch } from "@/hooks/useFetch";
import { useMutate } from "@/hooks/useMutate";
import { errorMessage, mediaUrl } from "./shared";

const NEWS_PATH = "/admin/news";

export type NewsRow = {
  id: string;
  title: string;
  category: string;
  date: string;
  img: string;
  placement: string;
};

/** How many articles the home page shows per placement. `standard` is not shown on the home page. */
const PLACEMENT_SLOTS: Record<string, number> = { main_feature: 1, recommended: 1, list: 3 };
const PLACEMENT_ORDER = NEWS_PLACEMENTS.map((p) => p.value);

const placementLabel = (value: string) =>
  NEWS_PLACEMENTS.find((p) => p.value === value)?.label ?? "Standard story";

const placementRank = (value: string) => {
  const index = PLACEMENT_ORDER.indexOf(value);
  return index === -1 ? PLACEMENT_ORDER.length : index;
};

export function FeaturedNewsEditor() {
  const news = useFetch<NewsRow[]>(NEWS_PATH);
  const mutation = useMutate<{ placement: string }>(NEWS_PATH);

  const rows = useMemo(() => {
    const list = Array.isArray(news.data) ? news.data : [];
    // Home page slots first, then the rest. Stable sort keeps the server's newest-first order inside each group.
    return [...list].sort((a, b) => placementRank(a.placement) - placementRank(b.placement));
  }, [news.data]);

  const warnings = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of rows) counts[row.placement] = (counts[row.placement] ?? 0) + 1;
    return Object.entries(PLACEMENT_SLOTS).flatMap(([placement, slots]) => {
      const count = counts[placement] ?? 0;
      if (count <= slots) return [];
      return [
        `${count} articles are set as ${placementLabel(placement)}, but the home page shows ${slots}. Move ${count - slots} to another placement.`,
      ];
    });
  }, [rows]);

  const changePlacement = async (article: NewsRow, placement: string) => {
    if (placement === article.placement) return;
    try {
      await mutation.mutateAsync({ method: "PUT", id: article.id, data: { placement } });
      toast.success(`"${article.title}" set to ${placementLabel(placement)}`);
    } catch (err) {
      toast.error(errorMessage(err, "Unable to update the placement"));
    }
  };

  return (
    <>
      <p className="mb-4 text-sm text-muted-foreground">
        Choose which articles fill the Featured News block on the home page. Changes save as soon as
        you pick a placement.
      </p>
      {news.isError && (
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-destructive">
            Could not load articles. The server may be busy; try again.
          </p>
          <Button variant="outline" size="sm" onClick={() => void news.refetch()}>
            Retry
          </Button>
        </div>
      )}
      {news.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {warnings.map((warning) => (
        <p key={warning} className="mb-2 text-sm text-destructive">
          {warning}
        </p>
      ))}
      {!news.isLoading && !news.isError && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No articles yet. Add one under News &amp; articles.
        </p>
      )}
      {rows.map((article) => (
        <div key={article.id} className="featured-row flex items-center gap-3">
          {article.img ? (
            <img
              src={mediaUrl(article.img)}
              alt=""
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded bg-muted object-cover"
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded bg-muted" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{article.title}</p>
            <p className="truncate text-xs text-muted-foreground">
              {article.category} · {article.date || "No date"}
            </p>
          </div>
          <select
            aria-label={`Home page placement for ${article.title}`}
            className="admin-input w-auto"
            value={article.placement}
            disabled={mutation.isPending}
            onChange={(e) => void changePlacement(article, e.target.value)}
          >
            {NEWS_PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </>
  );
}
