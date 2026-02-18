/**
 * REST API client — all calls go through the Vite proxy `/api` → `http://localhost:8000`.
 */

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface ModelInfo {
  model_name: string;
  hidden_size: number;
  num_attention_heads: number;
  num_layers: number;
  max_seq_len: number;
  dtype: string;
  device: string;
  load_in_4bit: boolean;
  load_in_8bit: boolean;
  total_parameters: number;
  trainable_parameters: number;
  memory_entries: number;
  max_memory_entries: number;
  gpu: Record<string, unknown>;
}

export interface InferenceConfig {
  max_new_tokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
  repetition_penalty: number;
  do_sample: boolean;
}

export interface ChatResponse {
  response: string;
  turn: number;
  generation_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface ConversationHistory {
  history: { role: string; content: string }[];
  turn_count: number;
}

export interface MemoryStats {
  memory_store: MemoryStoreStats;
  inference: Record<string, unknown>;
  conversation_turns: number;
  conversation_store: Record<string, unknown>;
}

export interface MemoryStoreStats {
  num_entries: number;
  max_entries: number;
  embed_model: string;
  embed_dim: number;
  similarity_threshold: number;
  save_path: string;
}

export interface ArchitectureInfo {
  model_name: string;
  num_layers: number;
  hidden_size: number;
  memory_entries: number;
  max_memory_entries: number;
  embed_model: string;
  flow_description: string;
}

export interface TraceEvent {
  event_type: string;
  timestamp: number;
  layer: number | null;
  data: Record<string, unknown>;
}

export interface TraceResponse {
  events: TraceEvent[];
  total: number;
}

export interface SystemHealth {
  status: string;
  model_name?: string;
  model_loaded?: boolean;
  device: string;
  gpu: Record<string, unknown>;
  debug?: boolean;
  conversation_turns: number;
  active_memory_entries: number;
  max_memory_entries: number;
  memory?: MemoryStats;
}

export interface FullConfig {
  model: Record<string, unknown>;
  inference: Record<string, unknown>;
  memory: Record<string, unknown>;
  debug: boolean;
}

/* ── Model Config ───────────────────────────────────────────────────────── */

export const modelConfigApi = {
  getInfo: () => request<ModelInfo>("/model-config/info"),
  getInference: () => request<InferenceConfig>("/model-config/inference"),
  updateInference: (patch: Partial<InferenceConfig>) =>
    request<InferenceConfig>("/model-config/inference", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  getFull: () => request<FullConfig>("/model-config/full"),
  toggleDebug: (enable?: boolean) =>
    request<{ debug: boolean }>(`/model-config/debug${enable !== undefined ? `?enable=${enable}` : ""}`, {
      method: "POST",
    }),
};

/* ── Inference / Chat ───────────────────────────────────────────────────── */

export const chatApi = {
  send: (message: string, opts?: { max_new_tokens?: number; temperature?: number }) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({ message, ...opts }),
    }),
  getHistory: () => request<ConversationHistory>("/chat/history"),
  reset: () => request<{ status: string; message: string }>("/chat/reset", { method: "POST" }),
};

/* ── Memory ─────────────────────────────────────────────────────────────── */

export const memoryApi = {
  getStats: () => request<MemoryStats>("/memory/stats"),
  getStore: () => request<MemoryStoreStats>("/memory/store"),
  getEntries: () => request<{ entries: Record<string, unknown>[] }>("/memory/entries"),
  search: (query: string, topK = 3) =>
    request<{ results: Record<string, unknown>[]; query: string }>("/memory/search", {
      method: "POST",
      body: JSON.stringify({ query, top_k: topK }),
    }),
  clear: () => request<{ status: string }>("/memory/clear", { method: "POST" }),
  resetAll: () => request<{ status: string }>("/memory/reset-all", { method: "POST" }),
  resetConversation: () => request<{ status: string }>("/memory/conversation/reset", { method: "POST" }),
};

/* ── Observability ──────────────────────────────────────────────────────── */

export const observabilityApi = {
  getArchitecture: () => request<ArchitectureInfo>("/observability/architecture"),
  getTrace: (lastN = 100, eventType?: string) => {
    const params = new URLSearchParams({ last_n: String(lastN) });
    if (eventType) params.set("event_type", eventType);
    return request<TraceResponse>(`/observability/trace?${params}`);
  },
  clearTrace: () => request<{ status: string }>("/observability/trace", { method: "DELETE" }),
  toggleTracing: (enable?: boolean) =>
    request<{ tracing_enabled: boolean }>(
      `/observability/trace/toggle${enable !== undefined ? `?enable=${enable}` : ""}`,
      { method: "POST" }
    ),
  getHealth: () => request<SystemHealth>("/observability/health"),
};

/* ── Model Hub ──────────────────────────────────────────────────────────── */

export interface HFModelCard {
  model_id: string;
  author: string;
  pipeline_tag: string | null;
  tags: string[];
  downloads: number;
  likes: number;
  last_modified: string;
  private: boolean;
  library_name: string | null;
  gated: boolean;
  params_count: number;
  size_estimate_gb: number;
}

export interface DownloadProgress {
  model_id: string;
  status: "queued" | "downloading" | "complete" | "error" | "not_started";
  progress_pct: number;
  downloaded_files: number;
  total_files: number;
  downloaded_bytes: number;
  total_bytes: number;
  error: string | null;
}

export interface LocalModel {
  model_id: string;
  path: string;
  size_mb: number;
  has_config: boolean;
  has_tokenizer: boolean;
}

export interface SwapStatus {
  status: "idle" | "validating" | "unloading" | "loading" | "wiring" | "ready" | "error";
  model_id: string;
  progress_pct: number;
  error: string | null;
  started_at: number;
  elapsed_ms: number;
}

export interface ActiveModel {
  model_id: string;
  hidden_size: number;
  num_layers: number;
  device: string;
  dtype: string;
}

export const modelHubApi = {
  /* Search & trending */
  trending: (limit = 5, filterTask = "text-generation") =>
    request<{ models: HFModelCard[] }>(
      `/model-hub/trending?limit=${limit}&filter_task=${encodeURIComponent(filterTask)}`
    ),
  search: (query: string, limit = 10, filterTask = "text-generation", sort = "downloads") => {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      filter_task: filterTask,
      sort,
    });
    return request<{ models: HFModelCard[]; total: number }>(`/model-hub/search?${params}`);
  },
  modelDetail: (modelId: string) =>
    request<HFModelCard>(`/model-hub/model/${modelId}`),

  /* Download */
  download: (modelId: string) =>
    request<DownloadProgress>("/model-hub/download", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId }),
    }),
  downloadStatus: (modelId: string) =>
    request<DownloadProgress>(`/model-hub/download/status/${modelId}`),
  allDownloads: () =>
    request<{ downloads: DownloadProgress[] }>("/model-hub/downloads"),

  /* Local models */
  listLocal: () =>
    request<{ models: LocalModel[]; active_model: string }>("/model-hub/local"),
  deleteLocal: (modelId: string) =>
    request<{ status: string; model_id: string }>(`/model-hub/local/${modelId}`, {
      method: "DELETE",
    }),

  /* Model swap */
  swap: (modelId: string) =>
    request<SwapStatus>("/model-hub/swap", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId }),
    }),
  swapStatus: () =>
    request<SwapStatus>("/model-hub/swap/status"),
  activeModel: () =>
    request<ActiveModel>("/model-hub/active"),
};
