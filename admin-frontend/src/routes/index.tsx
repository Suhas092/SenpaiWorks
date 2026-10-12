import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/dashboard/Dashboard";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — SenpaiWorks Admin" },
      {
        name: "description",
        content: "Your SenpaiWorks studio overview: revenue, orders, products and community.",
      },
      { property: "og:title", content: "Overview — SenpaiWorks Admin" },
      { property: "og:description", content: "Manage your SenpaiWorks studio in one workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});
