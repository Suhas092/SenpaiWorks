import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/payments/DonationOverview";
export const Route = createFileRoute("/donations")({
  head: () => ({
    meta: [
      { title: "Donations — SenpaiWorks" },
      { name: "description", content: "Manage Donations in the SenpaiWorks admin console." },
      { property: "og:title", content: "Donations — SenpaiWorks" },
      { property: "og:description", content: "Manage Donations in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
