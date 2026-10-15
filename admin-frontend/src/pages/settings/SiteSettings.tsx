import { Navigate } from "@tanstack/react-router";
import { useAdminIdentity } from "@/hooks/useAdminSession";
import { SiteSettingsForm } from "@/pages/settings/SiteSettingsForm";

export default function Page() {
  const identity = useAdminIdentity();

  if (identity.isLoading) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  // Only the super administrator and admin-role staff manage site settings. Others use My profile.
  if (!identity.isSuper) {
    return <Navigate to="/my-profile" />;
  }

  return <SiteSettingsForm />;
}
