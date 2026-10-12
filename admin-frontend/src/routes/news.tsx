import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/news/ArticlesList";
export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — SenpaiWorks" },
      { name: "description", content: "Manage News in the SenpaiWorks admin console." },
      { property: "og:title", content: "News — SenpaiWorks" },
      { property: "og:description", content: "Manage News in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
