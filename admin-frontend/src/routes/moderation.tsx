import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reviews/Moderation";
export const Route = createFileRoute("/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation — SenpaiWorks" },
      { name: "description", content: "Manage Moderation in the SenpaiWorks admin console." },
      { property: "og:title", content: "Moderation — SenpaiWorks" },
      { property: "og:description", content: "Manage Moderation in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { view?: "feedback" } =>
    search["view"] === "feedback" ? { view: "feedback" } : {},
  component: Page,
});
