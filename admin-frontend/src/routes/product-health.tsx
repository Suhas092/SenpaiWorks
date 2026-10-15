import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/reviews/ProductHealth";
export const Route = createFileRoute("/product-health")({
  head: () => ({
    meta: [
      { title: "Product Health — SenpaiWorks" },
      { name: "description", content: "Manage Product Health in the SenpaiWorks admin console." },
      { property: "og:title", content: "Product Health — SenpaiWorks" },
      { property: "og:description", content: "Manage Product Health in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
