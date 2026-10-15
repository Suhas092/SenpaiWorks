import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search, ArrowUpRight, ChevronDown, LogOut } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { DEMO_MODE, post } from "@/api";
import { ADMIN_SESSION_KEY, useAdminIdentity } from "@/hooks/useAdminSession";
import { navigation } from "./navigation";
import { NotificationBell } from "./NotificationBell";
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [search, setSearch] = useState("");
  const client = useQueryClient();
  const identity = useAdminIdentity();
  const handleSignOut = async () => {
    await post("/admin/logout", {}).catch(() => undefined);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    // Set the session first so the mounted gate re-renders to the login screen.
    client.setQueryData(ADMIN_SESSION_KEY, null);
    client.removeQueries({ predicate: (q) => q.queryKey[0] !== ADMIN_SESSION_KEY[0] });
  };
  return (
    <header className="admin-topbar">
      <Button
        className="mobile-menu"
        variant="ghost"
        size="icon"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu />
      </Button>
      <div className="global-search">
        <Search size={17} />
        <input
          placeholder="Search anything..."
          aria-label="Search admin pages"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
        />
        <kbd>⌘ K</kbd>
        {search && (
          <div className="global-results">
            {navigation
              .flatMap((g) => g.items)
              .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
              .map((i) => (
                <Link key={i.path} to={i.path} onClick={() => setSearch("")}>
                  <i.icon size={16} />
                  {i.name}
                </Link>
              ))}
          </div>
        )}
      </div>
      <div className="flex gap-4 items-center">
        <span className="environment">
          <span />
          Studio Engine
        </span>
        <Button variant="ghost" size="sm" asChild>
          <a href="/" target="_blank" rel="noopener noreferrer">
            View site
            <ArrowUpRight />
          </a>
        </Button>
        {!DEMO_MODE && (
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut size={16} />
            Sign out
          </Button>
        )}
        <span className="topbar-divider" />
        <NotificationBell />
        <Popover>
          <PopoverButton
            as={Button}
            variant="ghost"
            className="avatar-button"
            aria-label="Account menu"
          >
            <span className="avatar">
              {identity.avatar ? (
                <img src={identity.avatar} alt="" className="size-full rounded-full object-cover" />
              ) : (
                identity.initials
              )}
            </span>
            <ChevronDown size={14} />
          </PopoverButton>
          <PopoverPanel anchor="bottom end" className="popover-panel">
            <strong>{identity.name}</strong>
            <p className="text-muted-foreground text-xs mt-1 mb-4">
              {identity.role} · {identity.username}
            </p>
            <Link to="/my-profile" className="text-primary">
              My profile →
            </Link>
          </PopoverPanel>
        </Popover>
      </div>
    </header>
  );
}
