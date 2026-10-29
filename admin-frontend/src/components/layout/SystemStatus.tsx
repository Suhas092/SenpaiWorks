import { useQuery } from "@tanstack/react-query";

type HealthResponse = {
  status: string;
  uptime: number;
  timestamp: number;
  service?: string;
  latency?: number;
};

function formatUptime(seconds?: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemStatus() {
  const { data, isError, isPending } = useQuery<HealthResponse>({
    queryKey: ["system-health"],
    queryFn: async () => {
      const start = performance.now();
      const res = await fetch("/api/health");
      const latency = Math.round(performance.now() - start);
      if (!res.ok) throw new Error("Health check failed");
      const json = await res.json();
      return { ...json, latency };
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  if (isError) {
    return (
      <span
        className="system-status status-offline"
        title="Cannot reach backend server. Connection lost."
      >
        <span className="status-dot dot-offline" />
        <span>System Offline</span>
      </span>
    );
  }

  if (isPending) {
    return (
      <span
        className="system-status status-connecting"
        title="Checking server status..."
      >
        <span className="status-dot dot-connecting" />
        <span>Connecting...</span>
      </span>
    );
  }

  const tooltip = `System Online • ${data?.latency ?? 0}ms${data?.uptime ? ` • Uptime ${formatUptime(data.uptime)}` : ""}`;

  return (
    <span className="system-status status-online" title={tooltip}>
      <span className="status-dot dot-online" />
      <span>System Online</span>
    </span>
  );
}
