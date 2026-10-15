import { useSearch } from "@tanstack/react-router";
import { ResourcePage } from "@/components/admin/ResourcePage";

export default function ReviewsAll() {
  const { view } = useSearch({ strict: false }) as { view?: string };
  return <ResourcePage resource={view === "queries" ? "profile-feedback" : "reviews"} />;
}
