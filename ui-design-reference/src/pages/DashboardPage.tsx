import { useEffect, useState } from "react";
import {
  Activity,
  MessageSquare,
  Zap,
  Radio,
  Brain,
  Cpu,
  Database,
  Layers,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import MetricCard from "../components/MetricCard";
import MemoryPanel from "../components/MemoryPanel";
import TraceViewer from "../components/TraceViewer";
import { useObservabilitySSE } from "../services/useObservabilitySSE";

export default function DashboardPage() {
  // SSE provides live trace events + health/memory snapshots every 5s
  const { traceEvents, health, connected } = useObservabilitySSE(undefined, 50);
  const [loading, setLoading] = useState(true);

  // Initial load indicator — clears once first health snapshot arrives
  useEffect(() => {
    if (health) setLoading(false);
  }, [health]);

  // Fallback: if SSE hasn't delivered health yet after 3s, clear loading
  useEffect(() => {
    const t = setTimeout(() => {
      if (!health) setLoading(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [health]);

  // Extract memory stats from the SSE health payload
  const memStats = health?.memory ?? null;

  /** Short model name: "Qwen/Qwen2.5-3B-Instruct" → "Qwen2.5-3B-Instruct" */
  const modelShort = health?.model_name
    ? health.model_name.split("/").pop() ?? health.model_name
    : "—";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="System overview and memory metrics"
        loading={loading}
        actions={
          <span className={`flex items-center gap-1.5 text-xs ${connected ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
            <Radio className="w-3.5 h-3.5" />
            {connected ? "Live" : "Reconnecting..."}
          </span>
        }
      />

      {/* ── Active Model ────────────────────────────────────────────── */}
      <section className="mb-6">
        <h3
          className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Active Model
        </h3>
        <div className="rounded-xl border border-[var(--accent-light)]/30 bg-[var(--accent-ultra-light)] p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{modelShort}</p>
            {health?.model_name && (
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">{health.model_name}</p>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> {health?.device ?? "—"}</span>
            <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" /> {health?.conversation_turns ?? 0} turns</span>
          </div>
        </div>
      </section>

      {/* ── System Health ───────────────────────────────────────────── */}
      <section className="mb-6">
        <h3
          className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          System Health
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="Status"
            value={health?.status === "healthy" ? "Healthy" : "—"}
            icon={<Activity className="w-4 h-4" />}
            accent={health?.status === "healthy"}
          />
          <MetricCard
            label="Device"
            value={health?.device ?? "—"}
            icon={<Zap className="w-4 h-4" />}
          />
          <MetricCard
            label="Memory"
            value={health ? `${health.active_memory_entries}/${health.max_memory_entries}` : "—"}
            icon={<Database className="w-4 h-4" />}
            sub={`entries stored`}
          />
          <MetricCard
            label="Turns"
            value={health?.conversation_turns ?? 0}
            icon={<MessageSquare className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* ── GPU Info ────────────────────────────────────────────────── */}
      {health?.gpu && Object.keys(health.gpu).length > 0 && (
        <section className="mb-6">
          <h3
            className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            GPU
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(health.gpu).map(([k, v]) => (
              <MetricCard key={k} label={k.replace(/_/g, " ")} value={String(v)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Memory Subsystems ───────────────────────────────────────── */}
      <section className="mb-6">
        <h3
          className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="inline-flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Memory Subsystems</span>
        </h3>
        <MemoryPanel stats={memStats} />
      </section>

      {/* ── Recent Trace ────────────────────────────────────────────── */}
      <section>
        <h3
          className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Recent Trace Events
        </h3>
        <TraceViewer events={traceEvents} maxHeight="280px" />
      </section>
    </div>
  );
}
