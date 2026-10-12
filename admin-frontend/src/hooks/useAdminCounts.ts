import { useAdminIdentity } from "@/hooks/useAdminSession";
import { useFetch } from "./useFetch";

type OrderLite = { status?: string };
type ReportedReviews = { reviews?: unknown[]; totalCount?: number };

/**
 * Live counts for sidebar badges, topbar notifications, and the dashboard.
 * Pending orders are those still in the "Processing" status.
 * Each count is only fetched when the signed-in admin can see that page.
 */
export function useAdminCounts() {
  const identity = useAdminIdentity();
  const canSeeOrders = identity.isSuper || identity.pages["orders"] !== undefined;
  const canSeeReviews = identity.isSuper || identity.pages["reviews"] !== undefined;
  const orders = useFetch<OrderLite[]>("/admin/orders", { enabled: canSeeOrders });
  const reviews = useFetch<ReportedReviews>("/admin/reviews?reportedOnly=true", { enabled: canSeeReviews });

  const pendingOrders = (orders.data ?? []).filter((o) => o.status === "Processing").length;
  const reportedReviews = reviews.data?.totalCount ?? reviews.data?.reviews?.length ?? 0;

  return { pendingOrders, reportedReviews };
}
