import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/team/TeamPage";
export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Team & roles — SenpaiWorks" },
      { name: "description", content: "Manage team members and roles in the SenpaiWorks admin console." },
      { property: "og:title", content: "Team & roles — SenpaiWorks" },
      { property: "og:description", content: "Manage team members and roles in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
