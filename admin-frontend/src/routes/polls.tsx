import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/polls/Polls";
export const Route = createFileRoute("/polls")({
  head: () => ({
    meta: [
      { title: "Polls — SenpaiWorks" },
      { name: "description", content: "Manage Polls in the SenpaiWorks admin console." },
      { property: "og:title", content: "Polls — SenpaiWorks" },
      { property: "og:description", content: "Manage Polls in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
