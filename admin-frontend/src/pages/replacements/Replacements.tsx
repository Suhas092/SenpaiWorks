import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable, type Column } from "@/components/table/DataTable";
import { TableSearch } from "@/components/table/TableSearch";
import { useFetch, invalidateResource } from "@/hooks/useFetch";
import { patch } from "@/api";
import { replacements } from "@/data/resources";
import {
  ReplacementReviewPanel,
  outcomeLabel,
  parseReplacementLines,
  requestTiming,
  type ReplacementRow,
} from "./ReplacementReview";

type Tab = "review" | "queue" | "closed";

const TABS: { key: Tab; label: string }[] = [
  { key: "review", label: "Review" },
  { key: "queue", label: "Replacement queue" },
  { key: "closed", label: "Closed" },
];

const QUEUE_DONE = ["Delivered", "Cancelled"];

function tabOf(r: ReplacementRow): Tab {
  if (r.status === "Requested") return "review";
  if (r.status === "Approved" && !QUEUE_DONE.includes(String(r.newOrderStatus))) return "queue";
  return "closed";
}

function nextQueueStatus(r: ReplacementRow): string {
  return r.newOrderStatus === "Shipped" ? "Delivered" : "Shipped";
}

export default function ReplacementsPage() {
  const client = useQueryClient();
  const query = useFetch(replacements.listPath, {
    refetchInterval: replacements.refetchInterval ?? false,
  });
  const rows = useMemo(
    () => replacements.toRows(query.data) as ReplacementRow[],
    [query.data],
  );

  const [tab, setTab] = useState<Tab>("review");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<ReplacementRow | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = () => invalidateResource(client, replacements.listPath);

  const counts = useMemo(
    () => ({
      review: rows.filter((r) => tabOf(r) === "review").length,
      queue: rows.filter((r) => tabOf(r) === "queue").length,
      closed: rows.filter((r) => tabOf(r) === "closed").length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        tabOf(r) === tab &&
        (!term ||
          [r.name, r.customer, r.email, r.orderNumber, r.product, r.reason, r.newOrderNumber]
            .map(String)
            .join(" ")
            .toLowerCase()
            .includes(term)),
    );
  }, [rows, tab, search]);

  const openRow = openId ? (rows.find((r) => r.id === openId) ?? null) : null;

  const advanceQueue = async () => {
    if (!advancing) return;
    const next = nextQueueStatus(advancing);
    setWorking(true);
    try {
      await patch(`/admin/orders/${encodeURIComponent(String(advancing["newOrderId"]))}/status`, {
        status: next,
      });
      toast.success(`${String(advancing["newOrderNumber"])} marked ${next.toLowerCase()}`);
      setAdvancing(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to update replacement order");
    } finally {
      setWorking(false);
    }
  };

  const requestColumn: Column<ReplacementRow> = {
    key: "request",
    label: "Request",
    render: (r) => (
      <div>
        <span className="font-medium text-foreground">{String(r.name)}</span>
        <p className="text-xs text-muted-foreground mt-1">{String(r.date)}</p>
      </div>
    ),
  };
  const orderColumn: Column<ReplacementRow> = {
    key: "order",
    label: "Order",
    render: (r) => (
      <div>
        {String(r.orderNumber)}
        <p className="text-xs text-muted-foreground mt-1">{String(r.customer)}</p>
      </div>
    ),
  };
  const productColumn: Column<ReplacementRow> = {
    key: "product",
    label: "Product",
    render: (r) => {
      const count = parseReplacementLines(r["itemsJson"]).length;
      return (
        <div>
          {String(r.product)}
          {r.product === "Entire order" && count > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{count} item(s)</p>
          )}
        </div>
      );
    },
  };
  const reasonColumn: Column<ReplacementRow> = {
    key: "reason",
    label: "Reason",
    render: (r) => String(r.reason),
  };

  const columnsFor = (current: Tab): Column<ReplacementRow>[] => {
    const actionColumn: Column<ReplacementRow> = {
      key: "actions",
      label: "Action",
      render: (r) => {
        if (current === "queue") {
          return (
            <Button variant="outline" size="sm" onClick={() => setAdvancing(r)}>
              Mark {nextQueueStatus(r).toLowerCase()}
            </Button>
          );
        }
        return (
          <Button
            variant={current === "review" ? "default" : "ghost"}
            size="sm"
            onClick={() => setOpenId(r.id)}
          >
            {current === "review" ? "Review" : "View"}
          </Button>
        );
      },
    };

    if (current === "review") {
      return [
        requestColumn,
        orderColumn,
        productColumn,
        reasonColumn,
        {
          key: "timing",
          label: "Timing",
          render: (r) => requestTiming(r["createdAt"], r["deliveredAt"]),
        },
        actionColumn,
      ];
    }
    if (current === "queue") {
      return [
        requestColumn,
        {
          key: "replacementOrder",
          label: "Replacement order",
          render: (r) => (
            <div>
              {String(r.newOrderNumber)}
              <p className="text-xs text-muted-foreground mt-1">Ship to: {String(r.shipTo)}</p>
            </div>
          ),
        },
        productColumn,
        {
          key: "stage",
          label: "Stage",
          render: (r) => <Badge>{String(r["newOrderStatus"] || "Processing")}</Badge>,
        },
        actionColumn,
      ];
    }
    return [
      requestColumn,
      orderColumn,
      productColumn,
      {
        key: "outcome",
        label: "Outcome",
        render: (r) => <Badge>{outcomeLabel(r)}</Badge>,
      },
      actionColumn,
    ];
  };

  const siblingsOf = (row: ReplacementRow) => rows.filter((r) => r.orderId === row.orderId);

  const emptyCopy = {
    review: ["No requests waiting for review", "New replacement requests appear here."],
    queue: ["The replacement queue is empty", "Approved replacements appear here until they are delivered."],
    closed: ["No closed replacements", "Rejected and completed replacements appear here."],
  } as const;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Workspace / Replacements</div>
          <h1>Replacements</h1>
          <p className="text-muted-foreground">{replacements.description}</p>
        </div>
      </div>

      <div className="summary-strip">
        <div>
          <span>Awaiting review</span>
          <strong>{counts.review}</strong>
        </div>
        <div>
          <span>In replacement queue</span>
          <strong>{counts.queue}</strong>
        </div>
        <div>
          <span>Closed</span>
          <strong>{counts.closed}</strong>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Replacement views">
        {TABS.map((t) => (
          <Button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            variant={tab === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label} ({counts[t.key]})
          </Button>
        ))}
      </div>

      <div className="resource-toolbar">
        <TableSearch onSearch={setSearch} placeholder="Search replacements..." />
      </div>

      {query.isError ? (
        <div className="empty-state">
          <h3>Unable to load replacements</h3>
          <p>{query.error instanceof Error ? query.error.message : "Request failed"}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : !query.isLoading && visible.length === 0 ? (
        <div className="empty-state">
          <h3>{emptyCopy[tab][0]}</h3>
          <p>{emptyCopy[tab][1]}</p>
        </div>
      ) : (
        <DataTable columns={columnsFor(tab)} rows={visible} loading={query.isLoading} />
      )}

      {openRow && (
        <ReplacementReviewPanel
          replacement={openRow}
          siblings={siblingsOf(openRow)}
          onClose={() => setOpenId(null)}
          onDecided={refresh}
        />
      )}

      {advancing && (
        <ConfirmModal
          title={`Mark ${String(advancing["newOrderNumber"])} ${nextQueueStatus(advancing).toLowerCase()}?`}
          body="This updates the replacement order status on the live store. The original order is not changed."
          intent="normal"
          busy={working}
          onCancel={() => setAdvancing(null)}
          onConfirm={advanceQueue}
        />
      )}
    </>
  );
}
