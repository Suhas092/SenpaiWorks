import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/coupons/CouponsList";
export const Route = createFileRoute("/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons — SenpaiWorks" },
      { name: "description", content: "Manage Coupons in the SenpaiWorks admin console." },
      { property: "og:title", content: "Coupons — SenpaiWorks" },
      { property: "og:description", content: "Manage Coupons in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
