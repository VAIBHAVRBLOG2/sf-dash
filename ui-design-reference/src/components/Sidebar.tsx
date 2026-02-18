import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  Activity,
  Brain,
  Boxes,
} from "lucide-react";
import { modelHubApi } from "../services/api";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/models", label: "Model Hub", icon: Boxes },
  { to: "/observability", label: "Observability", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

/** Extract a short display name from a HF model id like "Qwen/Qwen2.5-3B-Instruct" → "Qwen2.5-3B-Instruct" */
function shortModelName(id: string): string {
  const parts = id.split("/");
  return parts.length > 1 ? parts[parts.length - 1] : id;
}

export default function Sidebar() {
  const [modelName, setModelName] = useState("");

  useEffect(() => {
    modelHubApi.activeModel().then((m) => setModelName(m.model_id)).catch(() => {});
    // Poll every 30s to catch swaps
    const iv = setInterval(() => {
      modelHubApi.activeModel().then((m) => setModelName(m.model_id)).catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col border-r bg-white z-50"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Stateful LLM
          </h1>
          <p className="text-[11px] text-[var(--text-tertiary)]">Neural Memory System</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--accent-ultra-light)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)]"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer — active model */}
      <div className="px-6 py-4 border-t border-[var(--border)]">
        <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate" title={modelName}>
          {modelName ? shortModelName(modelName) : "Loading…"}
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          3-tier memory · RTX 4070
        </p>
      </div>
    </aside>
  );
}
