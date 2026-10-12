import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
export function MetricCard({
  title,
  value,
  delta,
  icon: Icon,
  to,
  negative = false,
}: {
  title: string;
  value: string;
  /** Optional comparison text. Omitted when no real comparison data exists. */
  delta?: string;
  icon: LucideIcon;
  to: string;
  negative?: boolean;
}) {
  return (
    <Link to={to} className="metric-card">
      <div className="flex justify-between items-center">
        <span>{title}</span>
        <span className="metric-icon">
          <Icon size={17} />
        </span>
      </div>
      <strong>{value}</strong>
      {delta !== undefined && (
        <div className="metric-comparison">
          <span className={negative ? "text-destructive" : "text-success"}>
            {negative ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />} {delta}
          </span>
          <small>vs. last month</small>
          <svg viewBox="0 0 85 24" aria-hidden="true">
            <path
              d={
                negative
                  ? "M1 4 L14 8 L24 5 L36 14 L46 11 L57 17 L70 16 L84 22"
                  : "M1 22 L12 17 L24 19 L35 12 L46 15 L57 7 L70 9 L84 2"
              }
            />
          </svg>
        </div>
      )}
    </Link>
  );
}
