import { useEffect, useState, useCallback } from "react";
import { Save, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import {
  modelConfigApi,
  type ModelInfo,
  type InferenceConfig,
  type FullConfig,
} from "../services/api";

export default function SettingsPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [inference, setInference] = useState<InferenceConfig | null>(null);
  const [fullConfig, setFullConfig] = useState<FullConfig | null>(null);
  const [draft, setDraft] = useState<Partial<InferenceConfig>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [info, inf] = await Promise.all([
        modelConfigApi.getInfo(),
        modelConfigApi.getInference(),
      ]);
      setModelInfo(info);
      setInference(inf);
      setDraft({});
    } catch (e) {
      console.error("Settings load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (Object.keys(draft).length === 0) return;
    setSaving(true);
    try {
      const updated = await modelConfigApi.updateInference(draft);
      setInference(updated);
      setDraft({});
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  const loadFullConfig = async () => {
    const cfg = await modelConfigApi.getFull();
    setFullConfig(cfg);
    setShowFull(true);
  };

  const inferenceFields: { key: keyof InferenceConfig; label: string; type: "number" | "boolean"; step?: number; min?: number; max?: number }[] = [
    { key: "max_new_tokens", label: "Max New Tokens", type: "number", min: 1, max: 4096 },
    { key: "temperature", label: "Temperature", type: "number", step: 0.05, min: 0, max: 2 },
    { key: "top_p", label: "Top P", type: "number", step: 0.05, min: 0, max: 1 },
    { key: "top_k", label: "Top K", type: "number", min: 0, max: 200 },
    { key: "repetition_penalty", label: "Repetition Penalty", type: "number", step: 0.05, min: 1, max: 3 },
    { key: "do_sample", label: "Do Sample", type: "boolean" },
  ];

  const currentVal = (key: keyof InferenceConfig) =>
    draft[key] !== undefined ? draft[key] : inference?.[key];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Settings"
        description="Model configuration and inference parameters"
        loading={loading}
        actions={
          <div className="flex gap-2">
            <button
              onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload
            </button>
            <button
              onClick={handleSave}
              disabled={Object.keys(draft).length === 0 || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 disabled:opacity-40 transition"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      />

      {/* Model Info */}
      {modelInfo && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            Model Information
          </h3>
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {([
                  ["Model", modelInfo.model_name],
                  ["Device", modelInfo.device],
                  ["Layers", modelInfo.num_layers],
                  ["Hidden Size", modelInfo.hidden_size],
                  ["Attention Heads", modelInfo.num_attention_heads],
                  ["Max Seq Length", modelInfo.max_seq_len],
                  ["dtype", modelInfo.dtype],
                  ["Total Parameters", modelInfo.total_parameters.toLocaleString()],
                  ["Trainable Parameters", modelInfo.trainable_parameters.toLocaleString()],
                  ["4-bit Quantization", modelInfo.load_in_4bit ? "Yes" : "No"],
                  ["8-bit Quantization", modelInfo.load_in_8bit ? "Yes" : "No"],
                  ["Cache Layer", `L${modelInfo.cache_layer}`],
                  ["State Update Layer", `L${modelInfo.state_update_layer}`],
                  ["State Inject Layer", `L${modelInfo.state_inject_layer}`],
                ] as [string, string | number][]).map(([label, val], i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-[var(--surface-secondary)]" : ""}>
                    <td className="px-4 py-2 font-medium text-[var(--text-secondary)] w-48">{label}</td>
                    <td className="px-4 py-2 font-mono text-[var(--text-primary)]">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Inference Config */}
      {inference && (
        <section className="mb-8">
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            Inference Parameters
          </h3>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {inferenceFields.map(({ key, label, type, step, min, max }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  {label}
                </label>
                {type === "boolean" ? (
                  <button
                    onClick={() =>
                      setDraft((d) => ({ ...d, [key]: !currentVal(key) }))
                    }
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      currentVal(key)
                        ? "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/30 text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {currentVal(key) ? "Enabled" : "Disabled"}
                  </button>
                ) : (
                  <input
                    type="number"
                    step={step ?? 1}
                    min={min}
                    max={max}
                    value={currentVal(key) as number ?? ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setDraft((d) => ({ ...d, [key]: v }));
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent-light)] font-mono transition"
                  />
                )}
              </div>
            ))}
          </div>
          {Object.keys(draft).length > 0 && (
            <p className="text-xs text-[var(--warning)] mt-2">
              Unsaved changes: {Object.keys(draft).join(", ")}
            </p>
          )}
        </section>
      )}

      {/* Full Config JSON */}
      <section>
        <button
          onClick={loadFullConfig}
          className="text-xs font-medium text-[var(--accent)] hover:underline mb-3"
        >
          {showFull ? "Hide" : "Show"} Full Configuration JSON
        </button>
        {showFull && fullConfig && (
          <pre className="bg-[var(--surface-tertiary)] text-xs p-4 rounded-xl border border-[var(--border)] overflow-auto max-h-[500px] font-mono leading-relaxed">
            {JSON.stringify(fullConfig, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
