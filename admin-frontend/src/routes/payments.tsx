import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/payments/PaymentsSettings";
export const Route = createFileRoute("/payments")({
  head: () => ({
    meta: [
      { title: "Payments — SenpaiWorks" },
      { name: "description", content: "Manage Payments in the SenpaiWorks admin console." },
      { property: "og:title", content: "Payments — SenpaiWorks" },
      { property: "og:description", content: "Manage Payments in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
