import { useQuery } from "@tanstack/react-query";
import { ApiError, DEMO_MODE, get } from "@/api";

export type AdminSession = {
  success: boolean;
  adminUser: {
    username: string;
    role: string;
    name?: string;
    isSuper?: boolean;
    staffId?: number;
    avatar?: string;
    pages?: Record<string, "view" | "edit">;
  };
};

export const ADMIN_SESSION_KEY = ["admin-session"] as const;

/** "suhas_admin" -> "Suhas Admin". */
export function displayName(username: string): string {
  return username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** "suhas_admin" -> "SA". */
export function initialsFor(username: string): string {
  const parts = username.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0] ?? "";
  const second = parts[1] ?? "";
  return (first.charAt(0) + (second.charAt(0) || first.charAt(1))).toUpperCase() || "AD";
}

/**
 * Identity of the signed-in admin, with safe fallbacks while loading.
 * Super admin and admin-role staff see everything (isSuper from the server).
 * Junior admins only see the pages granted to them (view or edit).
 * In demo mode there is no session, so the full console is shown.
 */
export function useAdminIdentity() {
  const session = useAdminSession();
  const user = session.data?.adminUser;
  const username = user?.username ?? "";
  const role = user?.role ?? "";
  const isStaff = Boolean(user?.staffId);
  const isSuper = DEMO_MODE || Boolean(user?.isSuper);
  const label = user?.name?.trim() || (username ? displayName(username) : "");
  // Dynamic role title based on user permissions: SUPER ADMIN for full power, NORMAL ADMIN for restricted/junior staff
  const roleLabel = !user && !DEMO_MODE && session.isPending
    ? "ADMIN"
    : (isSuper ? "SUPER ADMIN" : "NORMAL ADMIN");

  return {
    username,
    name: label || "Admin",
    initials: label ? initialsFor(label) : "AD",
    avatar: user?.avatar ?? "",
    role: role ? role.charAt(0).toUpperCase() + role.slice(1) : "Administrator",
    roleLabel,
    isLoading: !DEMO_MODE && session.isPending,
    isSuper,
    isStaff,
    pages: user?.pages ?? {},
  };
}

/**
 * Checks the backend admin cookie via GET /api/admin/me.
 * Resolves to `null` when the session is missing or expired (401).
 * Disabled in demo mode, where no backend is available.
 */
export function useAdminSession() {
  return useQuery({
    queryKey: ADMIN_SESSION_KEY,
    queryFn: async (): Promise<AdminSession | null> => {
      try {
        return await get<AdminSession>("/admin/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    enabled: !DEMO_MODE,
    retry: false,
    staleTime: 60_000,
  });
}
