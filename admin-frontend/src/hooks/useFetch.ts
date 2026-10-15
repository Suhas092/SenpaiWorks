import { useQuery, type QueryClient } from "@tanstack/react-query";
import { get } from "@/api";

/** Strips the query string so all variants of a list share one invalidation target. */
export const resourceBase = (path: string) => path.split("?")[0] ?? path;

export function useFetch<T = unknown>(
  endpoint: string,
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => get<T>(endpoint),
    retry: 1,
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? false,
  });
}

/** Invalidates every cached list that shares the same base path (including query-string variants). */
export function invalidateResource(client: QueryClient, endpoint: string) {
  const base = resourceBase(endpoint);
  return client.invalidateQueries({
    predicate: (query) => resourceBase(String(query.queryKey[0] ?? "")) === base,
  });
}
