import { createFileRoute } from "@tanstack/react-router";
import { StaffProfileForm } from "@/pages/settings/StaffProfileForm";

export const Route = createFileRoute("/my-profile")({
  head: () => ({
    meta: [
      { title: "My profile — SenpaiWorks" },
      { name: "description", content: "Manage your profile in the SenpaiWorks admin console." },
      { property: "og:title", content: "My profile — SenpaiWorks" },
      { property: "og:description", content: "Manage your profile in SenpaiWorks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StaffProfileForm,
});
