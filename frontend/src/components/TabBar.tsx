type TabKey = "overview" | "tables" | "graph";

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "tables", label: "Tables & Queries" },
  { key: "graph", label: "Graph Details" },
];

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="flex gap-1 border-b border-[var(--border)]">
      {tabs.map((t) => {
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
              isActive
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export type { TabKey };
