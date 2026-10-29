import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search, ArrowUpRight, ChevronDown, LogOut, User, Settings, Moon, Sun } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { DEMO_MODE, post } from "@/api";
import { ADMIN_SESSION_KEY, useAdminIdentity } from "@/hooks/useAdminSession";
import { useTheme } from "@/hooks/useTheme";
import { navigation } from "./navigation";
import { NotificationBell } from "./NotificationBell";
import { SystemStatus } from "./SystemStatus";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const client = useQueryClient();
  const identity = useAdminIdentity();
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcut: Cmd+K / Ctrl+K focuses global search, Escape closes it
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && search) {
        setSearch("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [search]);

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
          ref={searchInputRef}
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
      <div className="flex gap-3 items-center">
        <SystemStatus />
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <span>View site</span>
            <ArrowUpRight size={14} />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
        <span className="topbar-divider" />
        <NotificationBell />
        <Popover className="relative">
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
            <span className="profile-btn-name">
              {identity.name}
            </span>
            <ChevronDown size={13} className="text-muted-foreground" />
          </PopoverButton>
          <PopoverPanel anchor="bottom end" className="popover-panel profile-menu-panel">
            {({ close }) => (
              <div className="profile-menu">
                <div className="profile-menu-header">
                  <div className="flex items-center gap-3">
                    <span className="avatar size-9 text-xs font-bold">
                      {identity.avatar ? (
                        <img src={identity.avatar} alt="" className="size-full rounded-full object-cover" />
                      ) : (
                        identity.initials
                      )}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <strong className="truncate font-semibold text-sm leading-tight text-foreground">
                        {identity.name}
                      </strong>
                      <span className="text-xs text-muted-foreground truncate">
                        @{identity.username || "admin"}
                      </span>
                      <span className="profile-menu-badge mt-1.5">
                        {identity.roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-menu-divider" />

                <div className="profile-menu-links">
                  <Link
                    to="/my-profile"
                    className="profile-menu-item"
                    onClick={() => close()}
                  >
                    <User size={15} />
                    <span>My profile</span>
                  </Link>

                  {identity.isSuper && (
                    <Link
                      to="/settings"
                      className="profile-menu-item"
                      onClick={() => close()}
                    >
                      <Settings size={15} />
                      <span>Site settings</span>
                    </Link>
                  )}
                </div>

                {!DEMO_MODE && (
                  <>
                    <div className="profile-menu-divider" />
                    <div className="p-1">
                      <button
                        type="button"
                        className="profile-menu-item profile-menu-logout"
                        onClick={async () => {
                          close();
                          await handleSignOut();
                        }}
                      >
                        <LogOut size={15} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </PopoverPanel>
        </Popover>
      </div>
    </header>
  );
}
