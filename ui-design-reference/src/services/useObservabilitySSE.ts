import { useEffect, useRef, useCallback, useState } from "react";
import type { TraceEvent, SystemHealth } from "./api";

interface SSEData {
  traceEvents: TraceEvent[];
  health: SystemHealth | null;
  connected: boolean;
  clearTrace: () => void;
}

/**
 * Hook that connects to the `/api/observability/stream` SSE endpoint.
 *
 * Returns live trace events and periodic health snapshots pushed by the server.
 * Automatically reconnects on disconnect.
 *
 * @param eventType — optional trace event filter (e.g. "cache_read")
 * @param maxEvents — max trace events to keep in state (default 300)
 */
export function useObservabilitySSE(
  eventType?: string,
  maxEvents = 300
): SSEData {
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [health, setHealth] = useState<SSEData["health"]>(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Build URL with optional filter
    const params = new URLSearchParams();
    if (eventType && eventType !== "all") {
      params.set("event_type", eventType);
    }
    const qs = params.toString();
    const url = `/api/observability/stream${qs ? `?${qs}` : ""}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.addEventListener("trace", (e) => {
      try {
        const data = JSON.parse(e.data) as { events: TraceEvent[]; total: number };
        if (data.events.length > 0) {
          setTraceEvents((prev) => {
            const merged = [...prev, ...data.events];
            // Keep only the latest maxEvents to avoid unbounded growth
            return merged.length > maxEvents ? merged.slice(-maxEvents) : merged;
          });
        }
      } catch {
        console.error("SSE trace parse error", e.data);
      }
    });

    es.addEventListener("health", (e) => {
      try {
        const data = JSON.parse(e.data);
        setHealth(data);
      } catch {
        console.error("SSE health parse error", e.data);
      }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;
      // Reconnect after 3 s
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connect();
        }, 3000);
      }
    };
  }, [eventType, maxEvents]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [connect]);

  /** Clear local trace event buffer. */
  const clearTrace = useCallback(() => setTraceEvents([]), []);

  return { traceEvents, health, connected, clearTrace };
}
