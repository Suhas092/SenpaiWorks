import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/Badge";
import { patch } from "@/api";
import { money } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;

export type ReplacementRow = {
  id: string;
  name: string;
  orderId: string;
  orderNumber: string;
  orderTotal: number;
  deliveredAt: string;
  customer: string;
  email: string;
  phone: string;
  shipTo: string;
  product: string;
  itemsJson: string;
  reason: string;
  status: string;
  date: string;
  createdAt: string;
  newOrderId: string;
  newOrderNumber: string;
  newOrderStatus: string;
};

export type ReplacementLine = {
  name: string;
  variant: string;
  quantity: number;
  price: number;
  img: string;
};

export function parseReplacementLines(value: unknown): ReplacementLine[] {
  try {
    const parsed: unknown = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? (parsed as ReplacementLine[]) : [];
  } catch {
    return [];
  }
}

export function requestTiming(createdAt: unknown, deliveredAt: unknown): string {
  if (!deliveredAt) return "Delivery date missing";
  const created = new Date(String(createdAt)).getTime();
  const delivered = new Date(String(deliveredAt)).getTime();
  if (Number.isNaN(created) || Number.isNaN(delivered)) return "Delivery date missing";
  const days = Math.floor((created - delivered) / DAY_MS);
  if (days < 0) return "Requested before delivery";
  if (days === 0) return "Requested on delivery day";
  return `Requested ${days} day(s) after delivery`;
}

export function outcomeLabel(replacement: ReplacementRow): string {
  if (replacement.status === "Requested") return "Awaiting review";
  if (replacement.status === "Rejected") return "Rejected";
  if (replacement.newOrderStatus === "Delivered") return "Replacement delivered";
  if (replacement.newOrderStatus === "Cancelled") return "Replacement order cancelled";
  return "In replacement queue";
}

export function ReplacementReviewPanel({
  replacement,
  siblings,
  onClose,
  onDecided,
}: {
  replacement: ReplacementRow;
  siblings: ReplacementRow[];
  onClose: () => void;
  onDecided: () => void;
}) {
  const [pending, setPending] = useState<"Approved" | "Rejected" | null>(null);
  const [busy, setBusy] = useState(false);

  const isRequested = replacement.status === "Requested";
  const lines = parseReplacementLines(replacement["itemsJson"]);
  const others = siblings.filter((s) => s.id !== replacement.id);

  const decide = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await patch(`/admin/replacements/${encodeURIComponent(replacement.id)}`, { status: pending });
      toast.success(
        pending === "Approved"
          ? "Replacement approved and added to the queue"
          : "Replacement rejected",
      );
      setPending(null);
      onDecided();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update replacement");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal title={`${replacement.name}`} open onClose={onClose} slideOver>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Badge>{String(replacement.status)}</Badge>
            <Badge>{outcomeLabel(replacement)}</Badge>
          </div>
        </div>

        <div className="detail-section">
          <h3>Reason</h3>
          <p>{String(replacement.reason)}</p>
          <p className="text-muted-foreground text-sm mt-1">
            Submitted {String(replacement.date)}
          </p>
        </div>

        <div className="detail-section">
          <h3>Item(s) to replace</h3>
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

        <div className="detail-section">
          <h3>Original order</h3>
          <div className="flex justify-between">
            <span>{String(replacement.orderNumber)}</span>
            <strong>{money(replacement["orderTotal"])}</strong>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {requestTiming(replacement["createdAt"], replacement["deliveredAt"])}
          </p>
        </div>

        <div className="detail-section">
          <h3>Customer</h3>
          <p>{String(replacement["customer"])}</p>
          <p className="text-muted-foreground">{String(replacement["email"])}</p>
          <p className="text-muted-foreground">{String(replacement["phone"])}</p>
        </div>

        <div className="detail-section">
          <h3>Ship to</h3>
          <p>{String(replacement["shipTo"] || "Not provided")}</p>
        </div>

        {others.length > 0 && (
          <div className="detail-section">
            <h3>Other requests on this order</h3>
            <ul className="flex flex-col gap-1 text-sm">
              {others.map((o) => (
                <li key={o.id} className="flex justify-between">
                  <span>{o.name}</span>
                  <span className="text-muted-foreground">{String(o.status)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isRequested ? (
          <div className="flex gap-2 justify-end mt-6">
            <Button variant="outline" onClick={() => setPending("Rejected")}>
              Reject
            </Button>
            <Button onClick={() => setPending("Approved")}>Approve and queue</Button>
          </div>
        ) : (
          <p className="text-muted-foreground mt-6">
            This request has been decided. Track the replacement order from the queue tab.
          </p>
        )}
      </Modal>

      {pending && (
        <ConfirmModal
          title={pending === "Approved" ? `Approve ${replacement.name}?` : `Reject ${replacement.name}?`}
          body={
            pending === "Approved"
              ? "A replacement order for the same item(s) will be created at no charge and added to the replacement queue."
              : "The customer will see this request as rejected and can submit a new one."
          }
          confirmLabel={pending === "Approved" ? "Approve" : "Reject"}
          intent={pending === "Approved" ? "normal" : "danger"}
          busy={busy}
          onCancel={() => setPending(null)}
          onConfirm={decide}
        />
      )}
    </>
  );
}
