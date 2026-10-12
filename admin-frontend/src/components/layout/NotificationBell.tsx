import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAlerts, useAlertActions, type AdminAlert } from "@/hooks/useAdminAlerts";

// Used for alerts created before links pointed at console routes.
const FALLBACK_ROUTES: Record<string, string> = {
  order_created: "/orders",
  replacement_requested: "/replacements",
  review_reported: "/reviews",
  donation_received: "/donations",
};

function alertTarget(alert: AdminAlert): { to: string; search: Record<string, string> } {
  if (alert.link?.startsWith("/")) {
    const url = new URL(alert.link, "http://admin.local");
    // Older alerts still link to the removed moderation page.
    const pathname = url.pathname === "/moderation" ? "/reviews" : url.pathname;
    return { to: pathname, search: Object.fromEntries(url.searchParams) };
  }
  return { to: FALLBACK_ROUTES[alert.type] ?? "/", search: {} };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useAdminAlerts();
  const { markRead, markAllRead } = useAlertActions();
  const alerts = data?.alerts ?? [];
  const unread = data?.unreadCount ?? 0;

  const openAlert = (alert: AdminAlert, close: () => void) => {
    if (!alert.isRead) markRead.mutate(alert.id);
    close();
    navigate(alertTarget(alert));
  };

  return (
    <Popover className="relative">
      <PopoverButton
        as={Button}
        variant="ghost"
        size="icon"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="notification-button"
      >
        <Bell />
        {unread > 0 && <span className="notification-badge">{unread > 9 ? "9+" : unread}</span>}
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="popover-panel notification-panel">
        {({ close }) => (
          <>
            <div className="notification-header">
              <h3>
                Notifications
                {unread > 0 && <span className="notification-count">{unread} unread</span>}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                disabled={unread === 0 || markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
              >
                Mark all read
              </Button>
            </div>

            {isPending && <p className="notification-empty">Loading notifications…</p>}
            {isError && (
              <div className="notification-empty">
                <p>Unable to load notifications.</p>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}
            {!isPending && !isError && alerts.length === 0 && (
              <p className="notification-empty">No notifications yet.</p>
            )}

            {!isPending && !isError && alerts.length > 0 && (
              <ul className="notification-list">
                {alerts.map((alert) => (
                  <li key={alert.id} className={`notification-item${alert.isRead ? "" : " is-unread"}`}>
                    <button
                      type="button"
                      className="notification-item-main"
                      onClick={() => openAlert(alert, close)}
                    >
                      {!alert.isRead && <span className="notification-dot" aria-hidden="true" />}
                      <span className="notification-item-text">
                        <strong>{alert.title}</strong>
                        <span>{alert.message}</span>
                        <time dateTime={alert.createdAt}>{formatTime(alert.createdAt)}</time>
                      </span>
                    </button>
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Mark "${alert.title}" as read`}
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(alert.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
