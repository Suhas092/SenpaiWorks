import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/art/ArtLibrary";
export const Route = createFileRoute("/art")({
  head: () => ({
    meta: [
      { title: "Art — SenpaiWorks" },
      { name: "description", content: "Manage Art in the SenpaiWorks admin console." },
      { property: "og:title", content: "Art — SenpaiWorks" },
      { property: "og:description", content: "Manage Art in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
