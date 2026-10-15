import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Globe } from "lucide-react";
import { toast } from "sonner";
import { put } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { invalidateResource, useFetch } from "@/hooks/useFetch";
import { ALERTS_ENDPOINT } from "@/hooks/useAdminAlerts";

const SETTINGS_ENDPOINT = "/admin/settings";

type AlertKey = "orderCreated" | "replacementRequested" | "reviewReported";

export type SiteSettingsValues = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  alerts: Record<AlertKey, boolean>;
};

const ALERT_OPTIONS: { key: AlertKey; label: string; hint: string }[] = [
  { key: "orderCreated", label: "New orders", hint: "Shown in the bell when a customer places an order." },
  {
    key: "replacementRequested",
    label: "Replacement requests",
    hint: "Shown in the bell when a customer requests a replacement.",
  },
  { key: "reviewReported", label: "Reported reviews", hint: "Shown in the bell when a review is reported." },
];

type Tab = "general" | "notifications";

const TABS: { id: Tab; label: string; icon: typeof Globe }[] = [
  { id: "general", label: "General", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export function SiteSettingsForm() {
  const client = useQueryClient();
  const query = useFetch<SiteSettingsValues>(SETTINGS_ENDPOINT);
  const [tab, setTab] = useState<Tab>("general");
  const [draft, setDraft] = useState<SiteSettingsValues | null>(null);

  const saved = query.data;
  const current = draft ?? saved;
  const dirty = Boolean(draft && saved && JSON.stringify(draft) !== JSON.stringify(saved));

  const save = useMutation({
    mutationFn: (values: SiteSettingsValues) => put<SiteSettingsValues>(SETTINGS_ENDPOINT, values),
    onSuccess: (data) => {
      client.setQueryData([SETTINGS_ENDPOINT], data);
      setDraft(null);
      invalidateResource(client, ALERTS_ENDPOINT);
      toast.success("Settings saved");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unable to save settings");
    },
  });

  if (query.isPending) {
    return <p className="text-muted-foreground text-sm">Loading settings…</p>;
  }

  if (query.isError || !current) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm">Unable to load settings.</p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const update = (patch: Partial<SiteSettingsValues>) => setDraft({ ...current, ...patch });

  const updateAlert = (key: AlertKey, enabled: boolean) =>
    setDraft({ ...current, alerts: { ...current.alerts, [key]: enabled } });

  const handleSave = () => {
    if (dirty) save.mutate(current);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex gap-2 border-b" role="tablist" aria-label="Settings sections">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 -mb-px ${
              tab === id ? "border-primary text-primary font-medium" : "border-transparent text-muted-foreground"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="storeName">Store name</Label>
            <Input
              id="storeName"
              maxLength={80}
              value={current.storeName}
              onChange={(e) => update({ storeName: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supportEmail">Support email</Label>
            <Input
              id="supportEmail"
              type="email"
              maxLength={254}
              value={current.supportEmail}
              onChange={(e) => update({ supportEmail: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supportPhone">Support phone</Label>
            <Input
              id="supportPhone"
              maxLength={30}
              value={current.supportPhone}
              onChange={(e) => update({ supportPhone: e.target.value })}
            />
          </div>
        </div>
      )}


      {tab === "notifications" && (
        <fieldset className="grid gap-4">
          <legend className="text-sm text-muted-foreground mb-2">
            Choose which events appear in the notification bell.
          </legend>
          {ALERT_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={current.alerts[opt.key]}
                onChange={(e) => updateAlert(opt.key, e.target.checked)}
              />
              <span>
                <strong className="font-medium">{opt.label}</strong>
                <span className="block text-muted-foreground">{opt.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {dirty && <span className="text-sm text-muted-foreground mr-auto">Unsaved changes</span>}
        <Button type="button" variant="outline" disabled={!dirty || save.isPending} onClick={() => setDraft(null)}>
          Discard
        </Button>
        <Button type="button" onClick={handleSave} disabled={!dirty || save.isPending}>
          {save.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
