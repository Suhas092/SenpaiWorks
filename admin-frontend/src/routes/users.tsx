import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/settings/Users";
export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users — SenpaiWorks" },
      { name: "description", content: "Manage Users in the SenpaiWorks admin console." },
      { property: "og:title", content: "Users — SenpaiWorks" },
      { property: "og:description", content: "Manage Users in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
