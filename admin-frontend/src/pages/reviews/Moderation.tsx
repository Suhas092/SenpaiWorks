import { useSearch } from "@tanstack/react-router";
import { ResourcePage } from "@/components/admin/ResourcePage";

export default function ReviewsModeration() {
  const { view } = useSearch({ from: "/moderation" });
  return <ResourcePage resource={view === "feedback" ? "feedback" : "moderation"} />;
}
