import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastManager } from "@/components/ui/ToastManager";
import { DEMO_MODE } from "@/api";
export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`admin-app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="admin-main">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="main-content">
          {children}
          <footer className="content-footer">
            <span>© 2026 SenpaiWorks</span>
            <span>
              <span className="connection-dot" />
              {DEMO_MODE ? "Demo workspace · sample data" : "Connected workspace"}
            </span>
          </footer>
        </main>
      </div>
      <ToastManager />
    </div>
  );
}
