import { Globe, ShieldCheck, CreditCard, Bell } from "lucide-react";

export function SettingsForm({ payments = false }: { payments?: boolean }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / SETTINGS</div>
          <h1>{payments ? "Payments & gateway" : "Site settings"}</h1>
          <p>
            {payments
              ? "Payment configuration is not connected to the admin API yet."
              : "Site settings are not connected to the admin API yet."}
          </p>
        </div>
      </div>
      <div className="settings-layout">
        <aside className="settings-nav">
          <strong>
            {payments ? <CreditCard size={17} /> : <Globe size={17} />}{" "}
            {payments ? "Payment configuration" : "General settings"}
          </strong>
          <p>
            <ShieldCheck size={17} />
            Security
          </p>
          <p>
            <Bell size={17} />
            Notifications
          </p>
        </aside>
        <div className="empty-state">
          <h3>Not connected</h3>
          <p>
            The backend does not expose a{" "}
            {payments ? "payments" : "settings"} endpoint yet, so changes cannot be saved here.
          </p>
        </div>
      </div>
    </>
  );
}
