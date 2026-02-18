import { useEffect, useState, useCallback, useRef } from "react";
import {
  Search,
  Download,
  DownloadCloud,
  Loader2,
  HardDrive,
  Zap,
  Star,
  TrendingUp,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import {
  modelHubApi,
  type HFModelCard,
  type LocalModel,
  type SwapStatus,
  type DownloadProgress,
} from "../services/api";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatParams(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return String(n);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function ModelCard({
  model,
  isLocal,
  isActive,
  downloading,
  onDownload,
  onSwap,
}: {
  model: HFModelCard;
  isLocal: boolean;
  isActive: boolean;
  downloading?: DownloadProgress;
  onDownload: (id: string) => void;
  onSwap: (id: string) => void;
}) {
  const isDownloading =
    downloading &&
    (downloading.status === "queued" || downloading.status === "downloading");

  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-sm ${
        isActive
          ? "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/40"
          : "bg-white border-[var(--border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {model.model_id}
            </h3>
            {isActive && (
              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                ACTIVE
              </span>
            )}
            {isLocal && !isActive && (
              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--success)]/15 text-[var(--success)]">
                LOCAL
              </span>
            )}
          </div>
          {model.author && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              by {model.author}
            </p>
          )}
        </div>

        <a
          href={`https://huggingface.co/${model.model_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors"
          title="View on Hugging Face"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {model.pipeline_tag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
            {model.pipeline_tag}
          </span>
        )}
        {model.library_name && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
            {model.library_name}
          </span>
        )}
        {model.gated && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--warning)]/15 text-[var(--warning)]">
            Gated
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-tertiary)]">
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" /> {formatNumber(model.downloads)}
        </span>
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" /> {formatNumber(model.likes)}
        </span>
        {model.params_count > 0 && (
          <span className="font-medium text-[var(--text-secondary)]">
            {formatParams(model.params_count)} params
          </span>
        )}
        {model.size_estimate_gb > 0 && (
          <span>~{model.size_estimate_gb} GB</span>
        )}
      </div>

      {/* Download progress bar */}
      {isDownloading && downloading && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
            <span>
              {downloading.total_bytes > 0
                ? `${formatBytes(downloading.downloaded_bytes)} / ${formatBytes(downloading.total_bytes)}`
                : "Preparing…"}
            </span>
            <span>{downloading.progress_pct.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all duration-700 ease-out"
              style={{ width: `${downloading.progress_pct}%` }}
            />
          </div>
          {downloading.total_files > 0 && (
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              {downloading.downloaded_files} / {downloading.total_files} files
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
        {(isLocal && !isDownloading) || downloading?.status === "complete" ? (
          <button
            onClick={() => onSwap(model.model_id)}
            disabled={isActive}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              isActive
                ? "bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed"
                : "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
            }`}
          >
            <Zap className="w-3 h-3" />
            {isActive ? "Active" : "Use Model"}
          </button>
        ) : isDownloading ? (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
            <Loader2 className="w-3 h-3 animate-spin" />
            Downloading…
          </div>
        ) : downloading?.status === "error" ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-[var(--error)]">
              <AlertCircle className="w-3 h-3" /> Failed
            </span>
            <button
              onClick={() => onDownload(model.model_id)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        ) : (
          <button
            onClick={() => onDownload(model.model_id)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
          >
            <DownloadCloud className="w-3 h-3" />
            Download
            {model.size_estimate_gb > 0 && (
              <span className="text-[var(--text-tertiary)] ml-0.5">
                (~{model.size_estimate_gb} GB)
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function LocalModelRow({
  model,
  isActive,
  swapping,
  onSwap,
  onDelete,
}: {
  model: LocalModel;
  isActive: boolean;
  swapping: boolean;
  onSwap: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-shadow hover:shadow-sm ${
        isActive
          ? "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/40"
          : "bg-white border-[var(--border)]"
      }`}
    >
      <div className="w-9 h-9 rounded-lg bg-[var(--surface-tertiary)] flex items-center justify-center shrink-0">
        <HardDrive className="w-4 h-4 text-[var(--text-tertiary)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {model.model_id}
          </p>
          {isActive && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
              ACTIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-0.5">
          {model.size_mb > 0 && <span>{model.size_mb >= 1024 ? `${(model.size_mb / 1024).toFixed(1)} GB` : `${model.size_mb.toFixed(0)} MB`}</span>}
          {model.has_config && <span>config.json</span>}
          {model.has_tokenizer && <span>tokenizer</span>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onSwap(model.model_id)}
          disabled={isActive || swapping}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isActive
              ? "bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed"
              : "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
          }`}
        >
          {swapping ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Zap className="w-3 h-3" />
          )}
          {isActive ? "Active" : "Use"}
        </button>

        {!isActive && model.path !== "(huggingface cache)" && (
          <button
            onClick={() => onDelete(model.model_id)}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
            title="Delete local model"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function SwapStatusBanner({ swap }: { swap: SwapStatus }) {
  if (swap.status === "idle") return null;

  const isActive = ["validating", "unloading", "loading", "wiring"].includes(swap.status);
  const isError = swap.status === "error";
  const isDone = swap.status === "ready";

  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-5 flex items-center gap-3 ${
        isError
          ? "bg-[var(--error)]/5 border-[var(--error)]/20"
          : isDone
          ? "bg-[var(--success)]/5 border-[var(--success)]/20"
          : "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/30"
      }`}
    >
      {isActive && <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />}
      {isDone && <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}
      {isError && <AlertCircle className="w-4 h-4 text-[var(--error)]" />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {isActive && `Swapping to ${swap.model_id}…`}
          {isDone && `Switched to ${swap.model_id}`}
          {isError && `Swap failed for ${swap.model_id}`}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {isActive && (
            <>
              Status: <span className="capitalize">{swap.status}</span> — {swap.progress_pct.toFixed(0)}%
            </>
          )}
          {isDone && `Completed in ${(swap.elapsed_ms / 1000).toFixed(1)}s`}
          {isError && swap.error}
        </p>
      </div>

      {isActive && (
        <div className="w-24 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${swap.progress_pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function ModelHubPage() {
  const [trending, setTrending] = useState<HFModelCard[]>([]);
  const [searchResults, setSearchResults] = useState<HFModelCard[]>([]);
  const [localModels, setLocalModels] = useState<LocalModel[]>([]);
  const [activeModel, setActiveModel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [downloads, setDownloads] = useState<Record<string, DownloadProgress>>({});
  const [swap, setSwap] = useState<SwapStatus>({
    status: "idle",
    model_id: "",
    progress_pct: 0,
    error: null,
    started_at: 0,
    elapsed_ms: 0,
  });

  const swapPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const downloadPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch trending & local on mount ───────────────────────────────

  const loadTrending = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const res = await modelHubApi.trending(5);
      setTrending(res.models);
    } catch (e) {
      console.error("Trending fetch error:", e);
    } finally {
      setLoadingTrending(false);
    }
  }, []);

  const loadLocal = useCallback(async () => {
    setLoadingLocal(true);
    try {
      const res = await modelHubApi.listLocal();
      setLocalModels(res.models);
      setActiveModel(res.active_model);
    } catch (e) {
      console.error("Local models fetch error:", e);
    } finally {
      setLoadingLocal(false);
    }
  }, []);

  // ── Restore active downloads on mount ────────────────────────────

  const restoreDownloads = useCallback(async () => {
    try {
      const res = await modelHubApi.allDownloads();
      if (res.downloads.length > 0) {
        const map: Record<string, DownloadProgress> = {};
        let anyActive = false;
        for (const d of res.downloads) {
          map[d.model_id] = d;
          if (d.status === "queued" || d.status === "downloading") {
            anyActive = true;
          }
        }
        setDownloads(map);

        // Restart polling if there are active downloads
        if (anyActive && !downloadPollRef.current) {
          downloadPollRef.current = setInterval(async () => {
            try {
              const r = await modelHubApi.allDownloads();
              const m: Record<string, DownloadProgress> = {};
              let stillActive = false;
              for (const d of r.downloads) {
                m[d.model_id] = d;
                if (d.status === "queued" || d.status === "downloading") {
                  stillActive = true;
                }
              }
              setDownloads(m);
              if (!stillActive && downloadPollRef.current) {
                clearInterval(downloadPollRef.current);
                downloadPollRef.current = null;
                loadLocal();
              }
            } catch {
              // ignore transient poll errors
            }
          }, 1500);
        }
      }
    } catch (e) {
      console.error("Failed to restore downloads:", e);
    }
  }, [loadLocal]);

  useEffect(() => {
    loadTrending();
    loadLocal();
    restoreDownloads();
  }, [loadTrending, loadLocal, restoreDownloads]);

  // ── Search ────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await modelHubApi.search(q, 12);
      setSearchResults(res.models);
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // ── Download ──────────────────────────────────────────────────────

  const handleDownload = useCallback(async (modelId: string) => {
    try {
      const prog = await modelHubApi.download(modelId);
      setDownloads((prev) => ({ ...prev, [modelId]: prog }));

      // Start polling for this download — 1.5s for snappy progress bar updates
      if (!downloadPollRef.current) {
        downloadPollRef.current = setInterval(async () => {
          try {
            const res = await modelHubApi.allDownloads();
            const map: Record<string, DownloadProgress> = {};
            let anyActive = false;
            for (const d of res.downloads) {
              map[d.model_id] = d;
              if (d.status === "queued" || d.status === "downloading") {
                anyActive = true;
              }
            }
            setDownloads(map);

            if (!anyActive && downloadPollRef.current) {
              clearInterval(downloadPollRef.current);
              downloadPollRef.current = null;
              // Refresh local models once downloads finish
              loadLocal();
            }
          } catch {
            // ignore transient poll errors
          }
        }, 1500);
      }
    } catch (e) {
      console.error("Download start error:", e);
    }
  }, [loadLocal]);

  // ── Swap ──────────────────────────────────────────────────────────

  const handleSwap = useCallback(async (modelId: string) => {
    try {
      const status = await modelHubApi.swap(modelId);
      setSwap(status);

      // Poll until swap is done
      if (swapPollRef.current) clearInterval(swapPollRef.current);
      swapPollRef.current = setInterval(async () => {
        const s = await modelHubApi.swapStatus();
        setSwap(s);
        if (s.status === "ready" || s.status === "error" || s.status === "idle") {
          if (swapPollRef.current) {
            clearInterval(swapPollRef.current);
            swapPollRef.current = null;
          }
          // Refresh local to update active marker
          loadLocal();
        }
      }, 1000);
    } catch (e) {
      console.error("Swap error:", e);
    }
  }, [loadLocal]);

  // ── Delete ────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (modelId: string) => {
    if (!window.confirm(`Delete local copy of ${modelId}?`)) return;
    try {
      await modelHubApi.deleteLocal(modelId);
      loadLocal();
    } catch (e) {
      console.error("Delete error:", e);
    }
  }, [loadLocal]);

  // ── Cleanup polls on unmount ──────────────────────────────────────

  useEffect(() => {
    return () => {
      if (swapPollRef.current) clearInterval(swapPollRef.current);
      if (downloadPollRef.current) clearInterval(downloadPollRef.current);
    };
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────

  const localIds = new Set(localModels.map((m) => m.model_id));
  const isSwapping = ["validating", "unloading", "loading", "wiring"].includes(swap.status);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Model Hub"
        description="Browse, download, and swap Hugging Face models"
        actions={
          <button
            onClick={() => { loadLocal(); loadTrending(); }}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        }
      />

      {/* Swap status banner */}
      <SwapStatusBanner swap={swap} />

      {/* ── Search bar ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search Hugging Face models…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent-light)] transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Search
          </button>
        </div>
      </div>

      {/* ── Search results ────────────────────────────────────────────── */}
      {searchResults.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
            <h3
              className="text-sm font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Search Results
            </h3>
            <span className="text-xs text-[var(--text-tertiary)]">
              ({searchResults.length})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchResults.map((m) => (
              <ModelCard
                key={m.model_id}
                model={m}
                isLocal={localIds.has(m.model_id)}
                isActive={m.model_id === activeModel}
                downloading={downloads[m.model_id]}
                onDownload={handleDownload}
                onSwap={handleSwap}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Trending models ───────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[var(--text-tertiary)]" />
          <h3
            className="text-sm font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Top Models
          </h3>
          {loadingTrending && <Loader2 className="w-3 h-3 animate-spin text-[var(--text-tertiary)]" />}
        </div>
        {trending.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {trending.map((m) => (
              <ModelCard
                key={m.model_id}
                model={m}
                isLocal={localIds.has(m.model_id)}
                isActive={m.model_id === activeModel}
                downloading={downloads[m.model_id]}
                onDownload={handleDownload}
                onSwap={handleSwap}
              />
            ))}
          </div>
        ) : (
          !loadingTrending && (
            <p className="text-sm text-[var(--text-tertiary)]">
              Unable to fetch trending models. Check your internet connection.
            </p>
          )
        )}
      </section>

      {/* ── Local / Downloaded models ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="w-4 h-4 text-[var(--text-tertiary)]" />
          <h3
            className="text-sm font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Downloaded Models
          </h3>
          {loadingLocal && <Loader2 className="w-3 h-3 animate-spin text-[var(--text-tertiary)]" />}
          <span className="text-xs text-[var(--text-tertiary)]">
            ({localModels.length})
          </span>
        </div>
        <div className="space-y-2">
          {localModels.map((m) => (
            <LocalModelRow
              key={m.model_id}
              model={m}
              isActive={m.model_id === activeModel}
              swapping={isSwapping}
              onSwap={handleSwap}
              onDelete={handleDelete}
            />
          ))}
          {!loadingLocal && localModels.length === 0 && (
            <div className="text-center py-8 text-sm text-[var(--text-tertiary)]">
              <HardDrive className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No local models found.</p>
              <p className="text-xs mt-1">Search and download a model above to get started.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
