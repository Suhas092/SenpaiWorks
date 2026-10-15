import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/replacements/Replacements";
export const Route = createFileRoute("/replacements")({
  head: () => ({
    meta: [
      { title: "Replacements — SenpaiWorks" },
      { name: "description", content: "Manage Replacements in the SenpaiWorks admin console." },
      { property: "og:title", content: "Replacements — SenpaiWorks" },
      { property: "og:description", content: "Manage Replacements in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
