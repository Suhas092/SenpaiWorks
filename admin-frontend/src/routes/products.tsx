import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/products/ProductsList";
export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — SenpaiWorks" },
      { name: "description", content: "Manage Products in the SenpaiWorks admin console." },
      { property: "og:title", content: "Products — SenpaiWorks" },
      { property: "og:description", content: "Manage Products in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
