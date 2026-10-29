import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Search, ArrowUpRight, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_MODE, post } from "@/api";
import { ADMIN_SESSION_KEY } from "@/hooks/useAdminSession";
import { useTheme } from "@/hooks/useTheme";
import { navigation } from "./navigation";
import { NotificationBell } from "./NotificationBell";
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const [search, setSearch] = useState("");
  const client = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const handleSignOut = async () => {
    await post("/admin/logout", {}).catch(() => undefined);
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
      </div>
    </header>
  );
}
