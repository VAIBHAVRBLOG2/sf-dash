import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  accent?: boolean;
}

export default function MetricCard({ label, value, sub, icon, accent }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 transition-shadow hover:shadow-sm ${
        accent
          ? "bg-[var(--accent-ultra-light)] border-[var(--accent-light)]/30"
          : "bg-white border-[var(--border)]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-[var(--text-tertiary)]">{icon}</span>}
      </div>
      <p
        className={`text-2xl font-semibold tracking-tight ${
          accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
        }`}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--text-tertiary)] mt-1">{sub}</p>}
    </div>
  );
}
