import { useEffect, useState } from "react";
import { Trash2, ToggleLeft, ToggleRight, Radio } from "lucide-react";
import PageHeader from "../components/PageHeader";
import TraceViewer from "../components/TraceViewer";
import { useObservabilitySSE } from "../services/useObservabilitySSE";
import {
  observabilityApi,
  type ArchitectureInfo,
} from "../services/api";

const EVENT_TYPE_OPTIONS = [
  "all",
  "cache_read",
  "cache_write",
  "cache_prune",
  "state_update",
  "state_inject",
  "memory_offload",
  "memory_retrieve",
  "forward_start",
  "forward_end",
  "generate_start",
  "generate_end",
  "hook_fire",
];

export default function ObservabilityPage() {
  const [arch, setArch] = useState<ArchitectureInfo | null>(null);
  const [tracingEnabled, setTracingEnabled] = useState(true);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // SSE — replaces all polling
  const { traceEvents, connected, clearTrace } = useObservabilitySSE(filter);

  // Architecture is static, fetch once
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setArch(await observabilityApi.getArchitecture());
      } catch (e) {
        console.error("Architecture fetch error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleTracing = async () => {
    const result = await observabilityApi.toggleTracing(!tracingEnabled);
    setTracingEnabled(result.tracing_enabled);
  };

  const handleClearTrace = async () => {
    await observabilityApi.clearTrace();
    clearTrace();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Observability"
        description="Internal forward-pass tracing and architecture overview"
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <span className={`flex items-center gap-1 text-xs ${connected ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
              <Radio className="w-3.5 h-3.5" />
              {connected ? "Live" : "Reconnecting..."}
            </span>

            <button
              onClick={handleToggleTracing}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                tracingEnabled
                  ? "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/30 text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              {tracingEnabled ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
              {tracingEnabled ? "Tracing ON" : "Tracing OFF"}
            </button>
            <button
              onClick={handleClearTrace}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        }
      />

      {/* Architecture */}
      {arch && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            Architecture
          </h3>

          {/* Flow description */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 mb-4">
            <pre className="text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
              {arch.flow_description}
            </pre>
          </div>

          {/* Architecture details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Layers</p>
              <p className="text-lg font-semibold font-mono text-[var(--accent)]">{arch.num_layers}</p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Hidden Size</p>
              <p className="text-lg font-semibold font-mono text-[var(--accent)]">{arch.hidden_size}</p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Memory Entries</p>
              <p className="text-lg font-semibold font-mono text-[var(--accent)]">{arch.memory_entries} / {arch.max_memory_entries}</p>
            </div>
            <div className="bg-white rounded-xl border border-[var(--border)] p-4">
              <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Embed Model</p>
              <p className="text-sm font-semibold font-mono text-[var(--accent)] truncate">{arch.embed_model}</p>
            </div>
          </div>
        </section>
      )}

      {/* Trace Events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            Trace Events
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "all" ? "All Events" : opt}
                </option>
              ))}
            </select>
            <span className="text-xs text-[var(--text-tertiary)]">
              {traceEvents.length} events
            </span>
          </div>
        </div>
        <TraceViewer events={traceEvents} maxHeight="500px" />
      </section>
    </div>
  );
}
