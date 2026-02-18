import { useEffect, useRef, useState, useCallback, memo } from "react";
import { Send, RotateCcw, Loader2, Wifi, WifiOff, Brain, Clock, Zap, Terminal, Activity } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ChatMessage from "../components/ChatMessage";
import TraceViewer from "../components/TraceViewer";
import { chatWs, type WSMessage } from "../services/websocket";
import { modelHubApi, type TraceEvent } from "../services/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  meta?: string;
}

interface ServerStep {
  label: string;
  detail: string;
  elapsed_ms: number;
}

interface TurnStats {
  turn: number;
  prompt_tokens: number;
  completion_tokens: number;
  generation_ms: number;
  total_ms: number;
}

const STORAGE_KEY = "stateful_llm_chat_messages";

function saveMessages(msgs: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch { /* quota exceeded — ignore */ }
}

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Isolated input component — owns its own `input` state so keystrokes
 * only re-render this small subtree, not the entire chat page.
 */
const ChatInput = memo(function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const submit = () => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    ref.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent-light)] disabled:opacity-50 transition-colors"
      />
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 disabled:opacity-40 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
});

const MemoTraceViewer = memo(TraceViewer);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages());
  const [generating, setGenerating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [traceEvents, setTraceEvents] = useState<TraceEvent[]>([]);
  const [serverLogs, setServerLogs] = useState<ServerStep[]>([]);
  const [turnStats, setTurnStats] = useState<TurnStats | null>(null);
  const [showTrace, setShowTrace] = useState(true);
  const [rightTab, setRightTab] = useState<"logs" | "trace">("logs");
  const [activeModel, setActiveModel] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyLoaded = useRef(false);

  // Fetch active model name
  useEffect(() => {
    modelHubApi.activeModel().then((m) => setActiveModel(m.model_id)).catch(() => {});
  }, []);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Connect WebSocket on mount
  useEffect(() => {
    chatWs.connect();

    const unsub = chatWs.subscribe((msg: WSMessage) => {
      switch (msg.type) {
        case "status":
          if (msg.status === "connected") {
            setConnected(true);
            // On (re)connect, request the server-side history
            if (!historyLoaded.current) {
              chatWs.requestHistory();
            }
          } else if (msg.status === "disconnected") {
            setConnected(false);
          } else if (msg.status === "generating") {
            setGenerating(true);
            setServerLogs([]);
            setTurnStats(null);
          } else if (msg.status === "reset") {
            setMessages([]);
            setTraceEvents([]);
            setServerLogs([]);
            setTurnStats(null);
            setGenerating(false);
          }
          break;

        case "history": {
          // Server sent conversation history — merge with local state
          const serverMsgs = (msg.messages as { role: string; content: string }[]) ?? [];
          if (serverMsgs.length > 0) {
            const restored: Message[] = serverMsgs.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            }));
            setMessages(restored);
          }
          historyLoaded.current = true;
          break;
        }

        case "server_logs":
          if (Array.isArray(msg.steps)) {
            setServerLogs(msg.steps as ServerStep[]);
          }
          break;

        case "response": {
          setGenerating(false);
          const promptTok = (msg.prompt_tokens as number) ?? 0;
          const compTok = (msg.completion_tokens as number) ?? 0;
          const genMs = (msg.generation_ms as number) ?? 0;
          const totalMs = (msg.total_ms as number) ?? genMs;
          setTurnStats({
            turn: msg.turn as number,
            prompt_tokens: promptTok,
            completion_tokens: compTok,
            generation_ms: genMs,
            total_ms: totalMs,
          });
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: msg.content as string,
              meta: `Turn ${msg.turn} · ${promptTok}→${compTok} tokens · ${(totalMs / 1000).toFixed(1)}s`,
            },
          ]);
          break;
        }

        case "trace":
          if (Array.isArray(msg.events)) {
            setTraceEvents((prev) => [...prev, ...(msg.events as TraceEvent[])]);
          }
          break;

        case "error":
          setGenerating(false);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `Error: ${msg.message}` },
          ]);
          break;
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, generating]);

  const handleSend = useCallback((text: string) => {
    if (!text || generating) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    chatWs.sendMessage(text);
  }, [generating]);

  const handleReset = useCallback(() => {
    chatWs.reset();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <PageHeader
          title="Chat"
          description="Conversation with stateful neural memory"
          actions={
            <div className="flex items-center gap-2">
              {/* Active model badge */}
              {activeModel && (
                <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-[var(--accent-ultra-light)] text-[var(--accent)] border border-[var(--accent-light)]/20">
                  <Brain className="w-3 h-3" />
                  {activeModel.split("/").pop()}
                </span>
              )}

              {/* Connection indicator */}
              <span className={`flex items-center gap-1 text-xs ${connected ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
                {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {connected ? "Connected" : "Disconnected"}
              </span>

              {/* Panel toggle */}
              <button
                onClick={() => setShowTrace((v) => !v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  showTrace
                    ? "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/30 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)]"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 inline mr-1" />
                Logs
              </button>

              {/* Reset */}
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          }
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden px-6 gap-4 pb-4">
        {/* Messages */}
        <div className="flex flex-col flex-1 min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 py-2">
            {messages.length === 0 && !generating && (
              <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] text-sm">
                Start a conversation — trace events will appear in real time.
              </div>
            )}

            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} meta={m.meta} />
            ))}

            {generating && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] pl-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </div>
            )}
          </div>

          {/* Input — isolated component so typing doesn't re-render messages/trace */}
          <ChatInput onSend={handleSend} disabled={generating} />
        </div>

        {/* Right panel — Server Logs + Trace */}
        {showTrace && (
          <div className="w-[420px] flex-shrink-0 flex flex-col">
            {/* Token / timing stats bar */}
            {turnStats && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-[var(--accent-ultra-light)] rounded-lg p-2 text-center border border-[var(--accent-light)]/20">
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Input</p>
                  <p className="text-sm font-bold font-mono text-[var(--accent)]">{turnStats.prompt_tokens}</p>
                </div>
                <div className="bg-[var(--accent-ultra-light)] rounded-lg p-2 text-center border border-[var(--accent-light)]/20">
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Output</p>
                  <p className="text-sm font-bold font-mono text-[var(--accent)]">{turnStats.completion_tokens}</p>
                </div>
                <div className="bg-[var(--accent-ultra-light)] rounded-lg p-2 text-center border border-[var(--accent-light)]/20">
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Gen Time</p>
                  <p className="text-sm font-bold font-mono text-[var(--accent)]">{(turnStats.generation_ms / 1000).toFixed(1)}s</p>
                </div>
                <div className="bg-[var(--accent-ultra-light)] rounded-lg p-2 text-center border border-[var(--accent-light)]/20">
                  <p className="text-[10px] text-[var(--text-tertiary)] uppercase">Total</p>
                  <p className="text-sm font-bold font-mono text-[var(--accent)]">{(turnStats.total_ms / 1000).toFixed(1)}s</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={() => setRightTab("logs")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  rightTab === "logs"
                    ? "bg-[var(--accent-ultra-light)] text-[var(--accent)] border border-[var(--accent-light)]/30"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Terminal className="w-3 h-3" /> Server Logs
                {serverLogs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-[var(--accent)] text-white">
                    {serverLogs.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightTab("trace")}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  rightTab === "trace"
                    ? "bg-[var(--accent-ultra-light)] text-[var(--accent)] border border-[var(--accent-light)]/30"
                    : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Activity className="w-3 h-3" /> Trace
                {traceEvents.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-400 text-white">
                    {traceEvents.length}
                  </span>
                )}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => { setServerLogs([]); setTraceEvents([]); setTurnStats(null); }}
                className="text-[10px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                Clear
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden">
              {rightTab === "logs" ? (
                <ServerLogsPanel steps={serverLogs} generating={generating} />
              ) : (
                <MemoTraceViewer events={traceEvents} maxHeight="calc(100vh - 260px)" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Server Logs Panel ─────────────────────────────────────────────────── */

const STEP_ICONS: Record<string, string> = {
  received: "📨",
  memory_retrieve: "🔍",
  tokenize: "🔤",
  generate_start: "⚡",
  generate_end: "✅",
  decode: "📝",
  memory_encode: "💾",
  done: "🏁",
};

const STEP_COLORS: Record<string, string> = {
  received: "border-blue-400",
  memory_retrieve: "border-emerald-400",
  tokenize: "border-amber-400",
  generate_start: "border-indigo-400",
  generate_end: "border-indigo-400",
  decode: "border-violet-400",
  memory_encode: "border-orange-400",
  done: "border-green-500",
};

function ServerLogsPanel({ steps, generating }: { steps: ServerStep[]; generating: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [steps]);

  if (steps.length === 0 && !generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)] text-sm gap-2">
        <Terminal className="w-6 h-6 opacity-40" />
        <span>Send a message to see server pipeline logs</span>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]"
      style={{ maxHeight: "calc(100vh - 260px)" }}
    >
      {generating && steps.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-[var(--text-tertiary)]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Processing on server...</span>
        </div>
      )}

      <div className="p-3 space-y-0">
        {steps.map((step, i) => {
          const icon = STEP_ICONS[step.label] ?? "•";
          const borderColor = STEP_COLORS[step.label] ?? "border-gray-300";
          const isLast = i === steps.length - 1;
          const isDone = step.label === "done";

          return (
            <div key={i} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full border-2 ${borderColor} flex items-center justify-center text-[11px] bg-white`}>
                  {icon}
                </div>
                {!isLast && <div className="w-px flex-1 bg-[var(--border)]" />}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-3 ${isLast ? "" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDone ? "text-[var(--success)]" : "text-[var(--text-primary)]"}`}>
                    {step.label.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {step.elapsed_ms < 1000 ? `${step.elapsed_ms}ms` : `${(step.elapsed_ms / 1000).toFixed(2)}s`}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
