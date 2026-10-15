import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Download,
  Pencil,
  Trash2,
  ArrowUpRight,
  Star,
  Package,
  SlidersHorizontal,
} from "lucide-react";
import { Link, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/table/DataTable";
import { TableSearch } from "@/components/table/TableSearch";
import { TableFilters } from "@/components/table/TableFilters";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { RecordForm } from "./RecordForm";
import { Badge } from "./Badge";
import { OrderDetailPanel } from "@/pages/orders/OrderDetail";
import { resources } from "@/data/resources";
import { useFetch, invalidateResource } from "@/hooks/useFetch";
import { ApiError } from "@/api";
import { money } from "@/lib/format";
import type { AdminRecord, FormValues, ResourceConfig } from "@/types";

export function ResourcePage({ resource }: { resource: string }) {
  const config = resources[resource];
  if (!config) {
    return (
      <div className="empty-state">
        <Package />
        <h3>Unknown resource</h3>
        <p>{resource}</p>
      </div>
    );
  }
  return <ResourceView key={resource} resource={resource} config={config} />;
}

function renderCell(key: string, row: AdminRecord) {
  switch (key) {
    case "name":
      return (
        <div className="flex items-center gap-3">
          {row["img"] && (
            <div className="product-thumb">
              <img src={String(row["img"])} alt="" className="product-image" />
            </div>
          )}
          <div>
            <span className="font-medium text-foreground">{row.name}</span>
            {row.sub && <p className="text-xs text-muted-foreground mt-1">{row.sub}</p>}
          </div>
        </div>
      );
    case "status":
    case "paymentStatus":
      return row[key] ? <Badge>{String(row[key])}</Badge> : "—";
    case "price":
      return (
        <div className="font-medium">
          {money(row["price"])}
          {Number(row["originalPrice"]) > Number(row["price"]) && (
            <div className="text-xs text-muted-foreground line-through mt-1">
              {money(row["originalPrice"])}
            </div>
          )}
        </div>
      );
    case "total":
      return <span className="font-medium">{money(row["total"])}</span>;
    case "rating":
      return (
        <span className="flex gap-1 items-center">
          <Star size={14} className="rating-star" />
          {String(row["rating"])}
        </span>
      );
    case "stockQuantity": {
      const stock = Number(row["stockQuantity"]);
      return (
        <span className={stock < 10 ? "text-warning" : "text-muted-foreground"}>
          {stock === 0 ? "Out of stock" : `${stock} in stock`}
        </span>
      );
    }
    case "customer":
      return (
        <div className="flex gap-2 items-center">
          <span className="mini-avatar">
            {String(row["customer"])
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div>
            {String(row["customer"])}
            {row["email"] && <p className="text-xs text-muted-foreground">{String(row["email"])}</p>}
          </div>
        </div>
      );
    default:
      return String(row[key] ?? "—");
  }
}

function ResourceView({ resource, config }: { resource: string; config: ResourceConfig }) {
  const client = useQueryClient();
  const query = useFetch(config.listPath, { refetchInterval: config.refetchInterval ?? false });
  const rows = useMemo(() => config.toRows(query.data), [config, query.data]);
  const refresh = () => invalidateResource(client, config.listPath);
  const { product: productFilter, order: orderFocus, review: reviewFilter } = useSearch({ strict: false }) as {
    product?: string;
    order?: string;
    review?: string;
  };

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const extraAll = config.extraFilter?.allLabel ?? "";
  const extraKey = config.extraFilter?.key;
  const [extra, setExtra] = useState(extraAll);
  const [editing, setEditing] = useState<AdminRecord | undefined | null>(null);
  const [deleting, setDeleting] = useState<AdminRecord | null>(null);
  const [conflict, setConflict] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState(false);
  const [working, setWorking] = useState(false);
  const [openedOrder, setOpenedOrder] = useState<string | null>(null);

  const detail = detailId ? (rows.find((r) => r.id === detailId) ?? null) : null;

  // Open the order named in ?order= once, so closing the panel does not reopen it.
  useEffect(() => {
    if (!config.openDetail || !orderFocus || openedOrder === orderFocus) return;
    if (rows.some((r) => r.id === orderFocus)) {
      setDetailId(orderFocus);
      setOpenedOrder(orderFocus);
    }
  }, [config.openDetail, orderFocus, openedOrder, rows]);
  const statuses = useMemo(
    () => [
      "All statuses",
      ...(config.statusOptions ??
        Array.from(new Set(rows.map((r) => r.status).filter((s): s is string => Boolean(s))))),
    ],
    [config.statusOptions, rows],
  );
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!productFilter || r.name === productFilter) &&
          (!reviewFilter || r.id === reviewFilter) &&
          (filter === "All statuses" || r.status === filter) &&
          (!extraKey || extra === extraAll || r[extraKey] === extra) &&
          Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase()),
      ),
    [rows, search, filter, extra, extraAll, extraKey, productFilter, reviewFilter],
  );

  const run = async (fn: () => Promise<unknown>, success: string): Promise<boolean> => {
    setWorking(true);
    try {
      await fn();
      toast.success(success);
      refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setWorking(false);
    }
  };

  const save = async (values: FormValues) => {
    const ok = await run(
      () =>
        editing && config.update
          ? config.update(editing, values)
          : config.create
            ? config.create(values)
            : Promise.reject(new Error("Not supported for this resource")),
      editing ? "Changes saved" : `${config.singular} added`,
    );
    if (ok) setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const row = deleting;
    setWorking(true);
    try {
      if (conflict && config.archive) await config.archive(row);
      else if (config.remove) await config.remove(row);
      toast.success(conflict ? "Product archived" : "Record deleted");
      setDeleting(null);
      setConflict(false);
      refresh();
    } catch (e) {
      if (!conflict && e instanceof ApiError && e.status === 409 && config.archive) {
        setConflict(true);
      } else {
        toast.error(e instanceof Error ? e.message : "Unable to delete");
      }
    } finally {
      setWorking(false);
    }
  };

  const confirmBulkDelete = async () => {
    const targets = rows.filter((r) => selected.includes(r.id));
    setWorking(true);
    const results = await Promise.allSettled(
      targets.map((r) => (config.remove ? config.remove(r) : Promise.reject(new Error("Unsupported")))),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    setSelected([]);
    setBulk(false);
    setWorking(false);
    refresh();
    if (failed) toast.error(`${failed} record(s) could not be deleted`);
    else toast.success("Selected records deleted");
  };

  const exportCsv = () => {
    const csv = [
      config.columns.map((c) => c.key).join(","),
      ...filtered.map((r) =>
        config.columns
          .map(
            (c) =>
              `"${String(r[c.key] ?? "")
                .replace(/"/g, '""')
                .replace(/^[=+@-]/, "'")}"`,
          )
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `senpaiworks-${resource}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  };

  const actions = (row: AdminRecord) => (
    <div className="flex gap-1 items-center">
      {config.viewReviews && (
        <Button variant="ghost" size="sm" asChild>
          <Link to="/reviews" search={{ product: row.name }}>
            View reviews
            <ArrowUpRight />
          </Link>
        </Button>
      )}
      {config.rowAction && (
        <Button
          variant="outline"
          size="sm"
          disabled={working}
          onClick={() =>
            config.rowAction &&
            run(() => config.rowAction!.run(row), config.rowAction.success)
          }
        >
          {config.rowAction.label(row)}
        </Button>
      )}
      {config.liveUrl && (
        <Button variant="ghost" size="icon" asChild title="View live" aria-label={`View ${row.name} live`}>
          <a href={config.liveUrl(row)} target="_blank" rel="noreferrer">
            <ArrowUpRight />
          </a>
        </Button>
      )}
      {config.openDetail && (
        <Button
          variant="ghost"
          size="icon"
          title="View order"
          aria-label={`View ${row.name}`}
          onClick={() => setDetailId(row.id)}
        >
          <ArrowUpRight />
        </Button>
      )}
      {config.update && (
        <Button
          variant="ghost"
          size="icon"
          title="Edit"
          aria-label={`Edit ${row.name}`}
          onClick={() => setEditing(row)}
        >
          <Pencil />
        </Button>
      )}
      {config.remove && (
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          aria-label={`Delete ${row.name}`}
          onClick={() => setDeleting(row)}
        >
          <Trash2 size={15} />
        </Button>
      )}
    </div>
  );

  const columns: Column<AdminRecord>[] = [
    ...config.columns.map((c) => ({
      key: c.key,
      label: c.label,
      render: (row: AdminRecord) => renderCell(c.key, row),
    })),
    { key: "actions", label: "Actions", render: actions, sticky: true },
  ];

  const showTabs = ["reviews", "profile-feedback", "product-health"].includes(resource);
  const canBulkDelete = Boolean(config.remove) && !config.visual;

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / {resource.toUpperCase()}</div>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download />
            Export
          </Button>
          {config.create && (
            <Button onClick={() => setEditing(undefined)}>
              <Plus />
              Add {config.singular}
            </Button>
          )}
        </div>
      </div>

      {showTabs && (
        <div className="page-tabs">
          <Link to="/product-health">Product health</Link>
          <Link to="/reviews" search={{}}>
            All reviews
          </Link>
          <Link to="/reviews" search={{ view: "queries" }}>
            Customer feedback
          </Link>
        </div>
      )}

      {productFilter && (
        <div className="flex gap-3 items-center text-sm mb-3">
          <span>Showing reviews for {productFilter}</span>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reviews" search={{}}>
              Clear filter
            </Link>
          </Button>
        </div>
      )}

      {reviewFilter && (
        <div className="flex gap-3 items-center text-sm mb-3">
          <span>Showing review #{reviewFilter}</span>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/reviews" search={{}}>
              Clear filter
            </Link>
          </Button>
        </div>
      )}

      {resource === "products" && (
        <div className="summary-strip">
          {[
            ["Total products", rows.length],
            ["Available", rows.filter((r) => r.status === "Available").length],
            [
              "Low stock",
              rows.filter((r) => Number(r["stockQuantity"]) > 0 && Number(r["stockQuantity"]) < 10)
                .length,
            ],
            ["Out of stock", rows.filter((r) => Number(r["stockQuantity"]) === 0).length],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="resource-toolbar">
        <TableSearch onSearch={setSearch} placeholder={`Search ${config.title.toLowerCase()}...`} />
        <div className="flex gap-2 items-center">
          <SlidersHorizontal size={15} className="text-muted-foreground" />
          <TableFilters value={filter} onChange={setFilter} options={statuses} />
          {config.extraFilter && (
            <select
              className="admin-input w-auto"
              aria-label={`Filter ${config.extraFilter.label.toLowerCase()}`}
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
            >
              {[config.extraFilter.allLabel, ...config.extraFilter.options].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} {config.title.toLowerCase()}
        </span>
      </div>

      {canBulkDelete && selected.length > 0 && (
        <div className="bulk-bar">
          <span>{selected.length} selected</span>
          <Button variant="destructive" size="sm" onClick={() => setBulk(true)}>
            Delete selected
          </Button>
        </div>
      )}

      {query.isError ? (
        <div className="empty-state">
          <Package />
          <h3>Unable to load {config.title.toLowerCase()}</h3>
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
        </div>
      ) : config.visual ? (
        <div className="asset-grid">
          {filtered.map((row) => (
            <article className="asset-card" key={row.id}>
              {row["img"] && (
                <div className="asset-image">
                  <img src={String(row["img"])} alt={row.name} className="asset-photo" />
                </div>
              )}
              <div className="asset-body">
                <h3>{row.name}</h3>
                <p>{row.sub || "Senpai Studio"}</p>
                {config.cardStats && (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {config.cardStats.map((stat) => (
                      <li key={stat.key} title={stat.label} className="flex items-center gap-1">
                        <stat.icon size={14} fill={stat.filled ? "currentColor" : "none"} aria-hidden />
                        {Number(row[stat.key] ?? 0).toLocaleString("en-US")}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-between items-center mt-4">
                  {row.status ? <Badge>{row.status}</Badge> : <span />}
                  {actions(row)}
                </div>
              </div>
            </article>
          ))}
          {!filtered.length && !query.isLoading && (
            <div className="empty-state">No records found.</div>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          loading={query.isLoading}
          selectable={canBulkDelete}
          onSelection={setSelected}
        />
      )}

      {editing !== null && (
        <RecordForm
          config={config}
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          busy={working}
        />
      )}

      {deleting && (
        <ConfirmModal
          title={conflict ? "This product has existing orders" : `Delete ${config.singular}?`}
          body={
            conflict
              ? "This product cannot be deleted because it is linked to customer orders. Archive it instead to preserve order history."
              : `“${deleting.name}” will be removed. This action cannot be undone.`
          }
          confirmLabel={conflict ? "Archive product" : "Delete"}
          onCancel={() => {
            setDeleting(null);
            setConflict(false);
          }}
          onConfirm={confirmDelete}
          busy={working}
        />
      )}

      {bulk && (
        <ConfirmModal
          title={`Delete selected ${config.title.toLowerCase()}?`}
          body={`${selected.length} record(s) will be removed. This action cannot be undone.`}
          onCancel={() => setBulk(false)}
          onConfirm={confirmBulkDelete}
          busy={working}
        />
      )}

      {detail && (
        <OrderDetailPanel order={detail} onClose={() => setDetailId(null)} onUpdate={refresh} />
      )}
    </>
  );
}
