import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/orders/OrdersList";
export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — SenpaiWorks" },
      { name: "description", content: "Manage Orders in the SenpaiWorks admin console." },
      { property: "og:title", content: "Orders — SenpaiWorks" },
      { property: "og:description", content: "Manage Orders in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
