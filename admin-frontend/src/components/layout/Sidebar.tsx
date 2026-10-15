import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsUpDown, PanelLeftClose, Sparkles } from "lucide-react";
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
            className="h-9 w-9 object-contain"
          />
          {!collapsed && (
            <span>
              Senpai<span className="font-normal">Works</span>
              <small>ADMIN CONSOLE</small>
            </span>
          )}
        </Link>
        <div className="workspace-switch">
          <span className="workspace-icon">
            <Sparkles size={17} />
          </span>
          {!collapsed && (
            <>
              <div>
                <strong>Senpai Studio</strong>
                <small>Workspace</small>
              </div>
              <ChevronsUpDown size={14} />
            </>
          )}
        </div>
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
          <div className="flex items-center gap-3">
            <span className="avatar">{identity.initials}</span>
            {!collapsed && (
              <div>
                <strong>{identity.name}</strong>
                <small>{identity.role}</small>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            onClick={onCollapse}
          >
            <PanelLeftClose />
          </Button>
        </div>
      </aside>
    </>
  );
}
