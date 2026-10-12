import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/settings/SiteSettings";
export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SenpaiWorks" },
      { name: "description", content: "Manage Settings in the SenpaiWorks admin console." },
      { property: "og:title", content: "Settings — SenpaiWorks" },
      { property: "og:description", content: "Manage Settings in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
