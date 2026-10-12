import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/admin/Badge";
import { resources } from "@/data/resources";
import { useFetch } from "@/hooks/useFetch";
import { money } from "@/lib/format";

export function RecentOrdersList() {
  const query = useFetch(resources["orders"]?.listPath ?? "/admin/orders");
  const rows = useMemo(
    () => (resources["orders"]?.toRows(query.data) ?? []).slice(0, 5),
    [query.data],
  );

  return (
    <section className="dashboard-panel recent-orders">
      <div className="panel-heading">
        <div>
          <h2>Recent orders</h2>
          <p>Your latest customer purchases.</p>
        </div>
        <Link to="/orders">
          View all
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Link to="/orders" className="font-medium">
                    {row.name}
                  </Link>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="mini-avatar">
                      {String(row["customer"])
                        .split(" ")
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    {String(row["customer"])}
                  </div>
                </td>
                <td>{row.status && <Badge>{row.status}</Badge>}</td>
                <td className="text-right font-medium">{money(row["total"])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
