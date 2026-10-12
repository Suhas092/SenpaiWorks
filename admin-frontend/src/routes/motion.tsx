import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/motion/MotionLibrary";
export const Route = createFileRoute("/motion")({
  head: () => ({
    meta: [
      { title: "Motion — SenpaiWorks" },
      { name: "description", content: "Manage Motion in the SenpaiWorks admin console." },
      { property: "og:title", content: "Motion — SenpaiWorks" },
      { property: "og:description", content: "Manage Motion in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
