import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigation, type NavItem } from "./navigation";
import { useAdminCounts } from "@/hooks/useAdminCounts";
import { useAdminIdentity } from "@/hooks/useAdminSession";
export function Sidebar({
  open,
  onClose,
  collapsed,
  onCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapse: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { pendingOrders, reportedReviews } = useAdminCounts();
  const identity = useAdminIdentity();
  const badges: Record<string, number> = {
    "/orders": pendingOrders,
    "/reviews": reportedReviews,
  };

  const canSee = (item: NavItem) => {
    if (identity.isSuper) return true;
    if (item.staffAlways) return true;
    return item.page !== undefined && identity.pages[item.page] !== undefined;
  };
  const visibleGroups = navigation
    .map((group) => ({ ...group, items: group.items.filter(canSee) }))
    .filter((group) => group.items.length > 0);
  return (
    <>
      <div className={open ? "sidebar-scrim visible" : "sidebar-scrim"} onClick={onClose} />
      <aside
        className={`admin-sidebar ${open ? "mobile-open" : ""} ${collapsed ? "is-collapsed" : ""}`}
      >
        <Link to="/" className="brand">
          <img
            src={`${import.meta.env.BASE_URL}brand/senpaiworks-logo.png`}
            alt="SenpaiWorks"
            className="h-9 w-9 object-contain flex-shrink-0"
          />
          {!collapsed && (
            <div className="brand-text-container">
              <img
                src={`${import.meta.env.BASE_URL}brand/senpaiworks-name-logo.png`}
                alt="SenpaiWorks"
                className="brand-name-img"
              />
              <small title={identity.name ? `${identity.name} (${identity.roleLabel})` : identity.roleLabel}>
                {identity.roleLabel}
              </small>
            </div>
          )}
        </Link>
        <nav aria-label="Main navigation">
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              {!collapsed && <p>{group.label}</p>}
              <ul>
                {group.items.map((item) => {
                  const label = item.name;
                  return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`nav-item ${pathname === item.path || (item.path === "/reviews" && pathname === "/product-health") ? "nav-active" : ""}`}
                      onClick={onClose}
                      title={label}
                    >
                      <item.icon size={17} />
                      {!collapsed && (
                        <>
                          <span>{label}</span>
                          {badges[item.path] ? <span className="nav-badge">{badges[item.path]}</span> : null}
                        </>
                      )}
                    </Link>
                  </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          {!collapsed ? (
            <button
              type="button"
              className="sidebar-collapse-trigger"
              onClick={onCollapse}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={17} />
              <span>Collapse sidebar</span>
            </button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              title="Expand sidebar"
              aria-label="Expand sidebar"
              onClick={onCollapse}
              className="mx-auto"
            >
              <PanelLeftClose size={17} className="rotate-180" />
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
