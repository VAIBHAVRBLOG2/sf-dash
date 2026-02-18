import { useMemo } from "react";
import type { TraceEvent } from "../services/api";

const EVENT_COLORS: Record<string, string> = {
  cache_read: "bg-blue-100 text-blue-700",
  cache_write: "bg-sky-100 text-sky-700",
  cache_prune: "bg-amber-100 text-amber-700",
  state_update: "bg-violet-100 text-violet-700",
  state_inject: "bg-purple-100 text-purple-700",
  memory_offload: "bg-orange-100 text-orange-700",
  memory_retrieve: "bg-emerald-100 text-emerald-700",
  forward_start: "bg-gray-100 text-gray-600",
  forward_end: "bg-gray-100 text-gray-600",
  generate_start: "bg-indigo-100 text-indigo-700",
  generate_end: "bg-indigo-100 text-indigo-700",
  hook_fire: "bg-rose-100 text-rose-700",
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

interface TraceViewerProps {
  events: TraceEvent[];
  maxHeight?: string;
}

export default function TraceViewer({ events, maxHeight = "400px" }: TraceViewerProps) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => b.timestamp - a.timestamp),
    [events]
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
        No trace events yet. Send a message to see the forward-pass pipeline.
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-[var(--border)]" style={{ maxHeight }}>
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-[var(--surface-tertiary)] z-10">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Time</th>
            <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Event</th>
            <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Layer</th>
            <th className="text-left px-3 py-2 font-medium text-[var(--text-secondary)]">Details</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((evt, i) => {
            const colorCls = EVENT_COLORS[evt.event_type] ?? "bg-gray-100 text-gray-600";
            return (
              <tr key={i} className="trace-row border-t border-[var(--border-light)] hover:bg-[var(--surface-tertiary)]/60">
                <td className="px-3 py-1.5 font-mono whitespace-nowrap text-[var(--text-tertiary)]">
                  {formatTimestamp(evt.timestamp)}
                </td>
                <td className="px-3 py-1.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorCls}`}>
                    {evt.event_type}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-mono text-[var(--text-secondary)]">
                  {evt.layer !== null ? `L${evt.layer}` : "—"}
                </td>
                <td className="px-3 py-1.5 font-mono text-[var(--text-secondary)] truncate max-w-[300px]">
                  {Object.keys(evt.data).length > 0 ? JSON.stringify(evt.data) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
