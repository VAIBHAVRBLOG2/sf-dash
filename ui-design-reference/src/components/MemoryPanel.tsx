import { Database, Search } from "lucide-react";
import MetricCard from "./MetricCard";
import type { MemoryStats } from "../services/api";

interface MemoryPanelProps {
  stats: MemoryStats | null;
}

export default function MemoryPanel({ stats }: MemoryPanelProps) {
  if (!stats) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
        Loading memory stats...
      </div>
    );
  }

  const store = stats.memory_store;
  const fillPct =
    store.max_entries > 0
      ? Math.round((store.num_entries / store.max_entries) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Section: RAG Memory Store */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" /> Memory Store
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Entries"
            value={`${fillPct}%`}
            sub={`${store.num_entries} / ${store.max_entries}`}
            accent={fillPct > 80}
          />
          <MetricCard label="Embed Dim" value={store.embed_dim} />
          <MetricCard label="Threshold" value={store.similarity_threshold.toFixed(2)} />
          <MetricCard label="Turns" value={stats.conversation_turns} />
        </div>
      </div>

      {/* Section: Embedding Model */}
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Retrieval
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <MetricCard label="Embed Model" value={store.embed_model.split("/").pop() ?? store.embed_model} />
          <MetricCard label="Max Entries" value={store.max_entries} />
          <MetricCard label="Save Path" value={store.save_path || "—"} />
        </div>
      </div>
    </div>
  );
}
