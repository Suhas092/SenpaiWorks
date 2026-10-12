import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ShoppingBag,
  Package,
  Users,
  IndianRupee,
  Plus,
  Star,
  ArrowRight,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useAdminCounts } from "@/hooks/useAdminCounts";
import { useAdminIdentity } from "@/hooks/useAdminSession";
import { MetricCard } from "./MetricCard";
import { RecentOrdersList } from "./RecentOrdersList";
import { toast } from "sonner";

type DashboardStats = {
  timeline: { labels: string[]; data: number[] };
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    totalArtworks: number;
  };
};

const CHART_W = 700;
const CHART_H = 170;
const CHART_PAD = 10;

const formatINR = (n: number) => `\u20b9${Math.round(n).toLocaleString("en-IN")}`;

const compactINR = (n: number) => {
  if (n >= 100000) return `\u20b9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20b9${Math.round(n / 1000)}k`;
  return `\u20b9${Math.round(n)}`;
};

const chartY = (v: number, max: number) => CHART_H - CHART_PAD - (v / max) * (CHART_H - CHART_PAD * 2);

/** Builds the line and area paths for the revenue chart from raw values. */
function buildChartPaths(values: number[]) {
  if (values.length === 0) return { line: "", area: "" };
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? CHART_W / (values.length - 1) : 0;
  const line = values
    .map((v, i) => {
      const x = i * step;
      const y = chartY(v, max);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return { line, area: `${line} L${CHART_W} ${CHART_H} L0 ${CHART_H} Z` };
}

export default function Dashboard() {
  const identity = useAdminIdentity();
  const stats = useFetch<DashboardStats>("/admin/dashboard/stats", { refetchInterval: 15_000 });
  const { pendingOrders, reportedReviews } = useAdminCounts();

  const kpis = stats.data?.kpis;
  const timeline = stats.data?.timeline ?? { labels: [], data: [] };
  const customerCount = kpis?.totalCustomers;
  const revenueSeries = timeline.data;
  const periodRevenue = revenueSeries.reduce((sum, v) => sum + v, 0);
  const { line, area } = buildChartPaths(revenueSeries);
  const yMax = Math.max(...revenueSeries, 0);
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => compactINR(yMax * f));
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const seriesMax = Math.max(...revenueSeries, 1);
  const hoverValue = hoverIndex === null ? undefined : revenueSeries[hoverIndex];
  const hovered =
    hoverIndex !== null && hoverValue !== undefined
      ? {
          value: hoverValue,
          label: timeline.labels[hoverIndex] ?? "",
          left: revenueSeries.length > 1 ? (hoverIndex / (revenueSeries.length - 1)) * 100 : 0,
          top: (chartY(hoverValue, seriesMax) / CHART_H) * 100,
        }
      : null;

  const dash = "\u2014";
  const firstName = identity.name.split(" ")[0] ?? identity.name;

  const attentionItems = [
    {
      key: "orders",
      count: pendingOrders,
      singular: "order to fulfill",
      plural: "orders to fulfill",
      body: "Your customers are waiting.",
      icon: ShoppingBag,
      path: "/orders",
      tone: "indigo",
    },
    {
      key: "reviews",
      count: reportedReviews,
      singular: "reported review",
      plural: "reported reviews",
      body: "Keep your community safe.",
      icon: Star,
      path: "/reviews",
      tone: "warning",
    },
  ].filter((item) => item.count > 0);
  const attentionTotal = attentionItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR STUDIO, AT A GLANCE</div>
          <h1>
            Overview <span className="heading-dot" />
          </h1>
          <p>Welcome back, {firstName}. Here’s what’s happening at SenpaiWorks.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Download report"
            aria-label="Download report"
            disabled={!kpis}
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob(
                  [
                    `Metric,Value\nRevenue,${kpis?.totalRevenue ?? 0}\nOrders,${kpis?.totalOrders ?? 0}\nProducts,${kpis?.totalProducts ?? 0}\nArtworks,${kpis?.totalArtworks ?? 0}\nCustomers,${customerCount ?? 0}`,
                  ],
                  { type: "text/csv" },
                ),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "senpaiworks-report.csv";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("Report downloaded");
            }}
          >
            <Download />
          </Button>
        </div>
      </div>
      <div className="metrics-grid">
        <MetricCard
          title="Total revenue"
          value={kpis ? formatINR(kpis.totalRevenue) : dash}
          icon={IndianRupee}
          to="/orders"
        />
        <MetricCard
          title="Total orders"
          value={kpis ? kpis.totalOrders.toLocaleString("en-IN") : dash}
          icon={ShoppingBag}
          to="/orders"
        />
        <MetricCard
          title="Active products"
          value={kpis ? kpis.totalProducts.toLocaleString("en-IN") : dash}
          icon={Package}
          to="/products"
        />
        <MetricCard
          title="Total customers"
          value={customerCount !== undefined ? customerCount.toLocaleString("en-IN") : dash}
          icon={Users}
          to="/users"
        />
      </div>
      <div className="dashboard-upper">
        <section className="dashboard-panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Revenue overview</h2>
              <p>Daily revenue, last 7 days.</p>
            </div>
          </div>
          <div className="chart-total">
            <strong>{stats.data ? formatINR(periodRevenue) : dash}</strong>
            <span className="chart-legend">
              <i /> Revenue
            </span>
          </div>
          <div className="revenue-chart">
            <div className="chart-y">
              {yTicks.map((v, i) => (
                <span key={`${v}-${i}`}>{v}</span>
              ))}
            </div>
            <div className="chart-plot">
              <div className="chart-grid">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                preserveAspectRatio="none"
                aria-label="Daily revenue, last 7 days"
                role="img"
              >
                <defs>
                  <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" className="chart-fill-top" />
                    <stop offset="100%" className="chart-fill-bottom" />
                  </linearGradient>
                </defs>
                {area && <path className="chart-area" d={area} />}
                {line && <path className="chart-line" d={line} />}
              </svg>
              <div
                className="chart-hover"
                onMouseMove={(e) => {
                  if (revenueSeries.length === 0) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const frac = (e.clientX - rect.left) / rect.width;
                  const index = Math.round(frac * (revenueSeries.length - 1));
                  setHoverIndex(Math.min(revenueSeries.length - 1, Math.max(0, index)));
                }}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {hovered && (
                  <>
                    <span className="chart-guide" style={{ left: `${hovered.left}%` }} />
                    <span
                      className="chart-dot"
                      style={{ left: `${hovered.left}%`, top: `${hovered.top}%` }}
                    />
                    <div
                      className="chart-tooltip"
                      style={{ left: `${Math.min(92, Math.max(8, hovered.left))}%` }}
                    >
                      <span>{hovered.label}</span>
                      <strong>{formatINR(hovered.value)}</strong>
                    </div>
                  </>
                )}
              </div>
              <div className="chart-x">
                {timeline.labels.map((v, i) => (
                  <span key={`${v}-${i}`}>{v}</span>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="dashboard-panel activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Needs your attention</h2>
              <p>A few things to keep moving.</p>
            </div>
            <span className="attention-count">{attentionTotal}</span>
          </div>
          {attentionItems.map((item) => (
            <Link className="attention-item" to={item.path} key={item.key}>
              <span className={`attention-icon tone-${item.tone}`}>
                <item.icon size={18} />
              </span>
              <div>
                <strong>
                  {item.count} {item.count === 1 ? item.singular : item.plural}
                </strong>
                <p>{item.body}</p>
              </div>
              <ArrowRight size={15} />
            </Link>
          ))}
          <div className="all-caught-up">
            <span className="connection-dot" />
            {attentionItems.length === 0
              ? "Nothing needs your attention right now."
              : "Everything else is looking good."}
          </div>
        </section>
      </div>
      <div className="dashboard-middle">
        <RecentOrdersList />
      </div>
      <section className="quick-actions">
        <div>
          <h2>Make something great.</h2>
          <p>Your next big idea starts here.</p>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link to="/products">
              <Plus />
              Add product
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/news">
              <Plus />
              Write an article
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/art">
              <Plus />
              Upload artwork
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
