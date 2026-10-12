import { useFetch } from "./useFetch";

export function useAdminReviews(reportedOnly = false) {
  return useFetch(reportedOnly ? "/admin/reviews?reportedOnly=true" : "/admin/reviews");
}
