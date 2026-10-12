import { useState, type ReactNode } from "react";
import { ArrowDownUp, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "./Pagination";
export type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  /** Pins the column to the right edge of the scrolling table. */
  sticky?: boolean;
};
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  selectable = false,
  onSelection,
  loading = false,
}: {
  columns: Column<T>[];
  rows: T[];
  selectable?: boolean;
  onSelection?: (ids: string[]) => void;
  loading?: boolean;
}) {
  const [sort, setSort] = useState("");
  const [reverse, setReverse] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const sorted = sort
    ? [...rows].sort(
        (a, b) =>
          String(a[sort as keyof T]).localeCompare(String(b[sort as keyof T]), undefined, {
            numeric: true,
          }) * (reverse ? -1 : 1),
      )
    : rows;
  const paging = usePagination(sorted);
  const select = (ids: string[]) => {
    setSelected(ids);
    onSelection?.(ids);
  };
  return (
    <div className="table-frame">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th>
                  <input
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={rows.length > 0 && rows.every((r) => selected.includes(r.id))}
                    onChange={(e) => select(e.target.checked ? rows.map((r) => r.id) : [])}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={String(c.key)} className={c.sticky ? "sticky-end" : undefined}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="table-heading"
                    onClick={() => {
                      setReverse(sort === c.key ? !reverse : false);
                      setSort(String(c.key));
                    }}
                  >
                    {c.label}
                    <ArrowDownUp size={12} />
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-16 text-center">
                  Loading records…
                </td>
              </tr>
            ) : (
              paging.rows.map((row) => (
                <tr key={row.id}>
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${row.id}`}
                        checked={selected.includes(row.id)}
                        onChange={(e) =>
                          select(
                            e.target.checked
                              ? [...selected, row.id]
                              : selected.filter((id) => id !== row.id),
                          )
                        }
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td key={String(c.key)} className={c.sticky ? "sticky-end" : undefined}>
                      {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && !rows.length && (
          <div className="empty-state">
            <PackageOpen size={30} />
            <h3>No records found</h3>
            <p>Try a different search or add your first record.</p>
          </div>
        )}
      </div>
      <Pagination {...paging} total={rows.length} onChange={paging.setPage} />
    </div>
  );
}
