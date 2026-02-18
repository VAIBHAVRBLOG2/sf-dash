/**
 * WebSocket client for real-time chat with trace events.
 *
 * Protocol:
 *   Client → Server:
 *     { type: "message", content: "...", max_new_tokens?, temperature? }
 *     { type: "get_stats" }
 *     { type: "get_trace", last_n?: number }
 *     { type: "reset" }
 *     { type: "ping" }
 *
 *   Server → Client:
 *     { type: "status",   status: "generating" | "reset" }
 *     { type: "trace",    events: [...] }
 *     { type: "response", content: "...", turn: N, generation_ms: N }
 *     { type: "stats",    ...allMemoryStats }
 *     { type: "error",    message: "..." }
 *     { type: "pong" }
 */

export type WSMessageType =
  | "status"
  | "trace"
  | "response"
  | "server_logs"
  | "stats"
  | "history"
  | "error"
  | "pong";

export interface WSMessage {
  type: WSMessageType;
  [key: string]: unknown;
}

export type WSListener = (msg: WSMessage) => void;

export class ChatWebSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<WSListener>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;
  private url: string;

  constructor(url?: string) {
    // Use the Vite proxy path — the proxy rewrites /ws → ws://localhost:8000
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    this.url = url ?? `${proto}//${window.location.host}/ws/chat`;
  }

  get connected() {
    return this._connected;
  }

  connect() {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this._connected = true;
      this.emit({ type: "status", status: "connected" });
    };

    this.ws.onmessage = (evt) => {
      try {
        const msg: WSMessage = JSON.parse(evt.data);
        this.emit(msg);
      } catch {
        console.error("WS bad JSON:", evt.data);
      }
    };

    this.ws.onclose = () => {
      this._connected = false;
      this.emit({ type: "status", status: "disconnected" });
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this._connected = false;
  }

  /** Send a chat message. */
  sendMessage(content: string, opts?: { max_new_tokens?: number; temperature?: number }) {
    this.send({ type: "message", content, ...opts });
  }

  /** Request conversation history from the server. */
  requestHistory() {
    this.send({ type: "get_history" });
  }

  /** Request updated memory stats. */
  requestStats() {
    this.send({ type: "get_stats" });
  }

  /** Request trace events. */
  requestTrace(lastN = 50) {
    this.send({ type: "get_trace", last_n: lastN });
  }

  /** Reset conversation + state. */
  reset() {
    this.send({ type: "reset" });
  }

  ping() {
    this.send({ type: "ping" });
  }

  /** Subscribe to all incoming messages. Returns unsubscribe fn. */
  subscribe(listener: WSListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /* ── Internals ─────────────────────────────────────────────────────── */

  private send(data: Record<string, unknown>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WS not connected, queuing connect");
      this.connect();
      return;
    }
    this.ws.send(JSON.stringify(data));
  }

  private emit(msg: WSMessage) {
    for (const fn of this.listeners) {
      try { fn(msg); } catch (e) { console.error("WS listener error:", e); }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }
}

/** Singleton instance */
export const chatWs = new ChatWebSocket();
