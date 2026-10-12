import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/motion/RigsLibrary";
export const Route = createFileRoute("/rigs")({
  head: () => ({
    meta: [
      { title: "Rigs — SenpaiWorks" },
      { name: "description", content: "Manage Rigs in the SenpaiWorks admin console." },
      { property: "og:title", content: "Rigs — SenpaiWorks" },
      { property: "og:description", content: "Manage Rigs in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
