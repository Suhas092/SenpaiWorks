import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reviews/AllReviews";
export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Reviews — SenpaiWorks" },
      { name: "description", content: "Manage Reviews in the SenpaiWorks admin console." },
      { property: "og:title", content: "Reviews — SenpaiWorks" },
      { property: "og:description", content: "Manage Reviews in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { product?: string; review?: string; view?: string } => ({
    ...(typeof search["product"] === "string" ? { product: search["product"].slice(0, 255) } : {}),
    ...(typeof search["review"] === "string" ? { review: search["review"].slice(0, 255) } : {}),
    ...(typeof search["view"] === "string" ? { view: search["view"].slice(0, 50) } : {}),
  }),
  component: Page,
});
