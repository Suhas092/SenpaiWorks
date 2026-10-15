import { useState } from "react";
import { Printer } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/Badge";
import { patch, API_BASE } from "@/api";
import { money } from "@/lib/format";
import { ORDER_STATUSES } from "@/data/resources";
import { toast } from "sonner";
import type { AdminRecord } from "@/types";

type OrderLine = { name: string; variant: string; quantity: number; price: number };

const parseLines = (value: unknown): OrderLine[] => {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? (parsed as OrderLine[]) : [];
  } catch {
    return [];
  }
};

export function OrderDetailPanel({
  order,
  onClose,
  onUpdate,
}: {
  order: AdminRecord;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await patch(`/admin/orders/${encodeURIComponent(order.id)}/status`, { status: pending });
      toast.success("Order updated");
      setPending(null);
      onUpdate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update order");
    } finally {
      setBusy(false);
    }
  };

  const lines = parseLines(order["lines"]);
  const isDonation = order["kind"] === "Donation";
  const invoiceUrl = `${API_BASE}/admin/orders/${encodeURIComponent(order.id)}/invoice`;

  return (
    <>
      <Modal title={`Order ${order.name}`} open onClose={onClose} slideOver>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Badge>{String(order.status)}</Badge>
            <Badge>{String(order["kind"] ?? "")}</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.open(invoiceUrl, "_blank")}>
            <Printer />
            Print invoice
          </Button>
        </div>
        <div className="detail-section">
          <h3>Customer</h3>
          <p>{String(order["customer"])}</p>
          {order["email"] && <p className="text-muted-foreground">{String(order["email"])}</p>}
        </div>
        <div className="detail-section">
          <h3>{isDonation ? "Donation" : "Items"}</h3>
          {lines.length === 0 && <p className="text-muted-foreground">No items</p>}
          <ul className="flex flex-col gap-2">
            {lines.map((line, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>
                  {line.name}
                  {line.variant && <span className="block text-muted-foreground">{line.variant}</span>}
                </span>
                <span className="whitespace-nowrap">
                  {line.quantity} × {money(line.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {!isDonation && order["shipTo"] && (
          <div className="detail-section">
            <h3>Ship to</h3>
            <p>{String(order["shipTo"])}</p>
          </div>
        )}
        <div className="detail-section">
          <h3>Total</h3>
          <div className="flex justify-between">
            <span>{String(order["items"])} item(s)</span>
            <strong>{money(order["total"])}</strong>
          </div>
        </div>
        <div className="detail-section">
          <h3>Payment</h3>
          <Badge>{String(order["paymentStatus"])}</Badge>
        </div>
        <div className="detail-section">
          <h3>Update status</h3>
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUSES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === order.status ? "default" : "outline"}
                disabled={s === order.status}
                onClick={() => setPending(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
      {pending && (
        <ConfirmModal
          title={`Mark order as ${pending}?`}
          body="This updates the order status on the live store. Refunds must be processed by your payment provider."
          intent="normal"
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={confirm}
        />
      )}
    </>
  );
}
