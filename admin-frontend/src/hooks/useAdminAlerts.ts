import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, patch } from "@/api";
import { invalidateResource } from "@/hooks/useFetch";

export const ALERTS_ENDPOINT = "/admin/alerts";

export type AdminAlert = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type AlertsResponse = {
  success: boolean;
  alerts: AdminAlert[];
  unreadCount: number;
};

export function useAdminAlerts() {
  return useQuery({
    queryKey: [ALERTS_ENDPOINT],
    queryFn: () => get<AlertsResponse>(ALERTS_ENDPOINT),
    refetchInterval: 60_000,
  });
}

export function useAlertActions() {
  const client = useQueryClient();
  const refresh = () => invalidateResource(client, ALERTS_ENDPOINT);

  const markRead = useMutation({
    mutationFn: (id: number) => patch(`${ALERTS_ENDPOINT}/${id}/read`, {}),
    onSuccess: refresh,
  });

  const markAllRead = useMutation({
    mutationFn: () => patch(`${ALERTS_ENDPOINT}/read-all`, {}),
    onSuccess: refresh,
  });

  return { markRead, markAllRead };
}
