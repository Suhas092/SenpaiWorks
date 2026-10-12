import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/feedback/CustomerFeedback";
export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Community feedback — SenpaiWorks" },
      { name: "description", content: "Manage community feedback in the SenpaiWorks admin console." },
      { property: "og:title", content: "Community feedback — SenpaiWorks" },
      { property: "og:description", content: "Manage community feedback in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
