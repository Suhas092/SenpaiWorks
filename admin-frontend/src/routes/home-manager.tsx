import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/HomeManager/HomeManager";
export const Route = createFileRoute("/home-manager")({
  head: () => ({
    meta: [
      { title: "Home page manager — SenpaiWorks" },
      {
        name: "description",
        content: "Manage Home page manager in the SenpaiWorks admin console.",
      },
      { property: "og:title", content: "Home page manager — SenpaiWorks" },
      { property: "og:description", content: "Manage Home page manager in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
