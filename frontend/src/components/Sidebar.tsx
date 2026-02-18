import { useState, useMemo } from "react";
import type { Procedure, Package } from "../types";

const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

interface SidebarProps {
  procedures: Procedure[];
  packages: Package[];
  selected: Procedure | null;
  onSelect: (proc: Procedure) => void;
}

export default function Sidebar({ procedures, packages, selected, onSelect }: SidebarProps) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");

  const domains = useMemo(
    () => [...new Set(procedures.map((p) => p.domain))].sort(),
    [procedures]
  );
  const packageNames = useMemo(
    () => [...new Set(procedures.map((p) => p.package_name))].sort(),
    [procedures]
  );

  const filtered = useMemo(() => {
    let list = procedures;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.procedure_name.toLowerCase().includes(q));
    }
    if (domainFilter) list = list.filter((p) => p.domain === domainFilter);
    if (packageFilter) list = list.filter((p) => p.package_name === packageFilter);
    return list;
  }, [procedures, search, domainFilter, packageFilter]);

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col bg-white border-r border-[var(--border)] z-50 overflow-hidden"
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h16" />
            <circle cx="18" cy="12" r="2" fill="currentColor" opacity=".6" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Storeproc
          </h1>
          <p className="text-[11px] text-[var(--text-tertiary)]">Knowledge Graph</p>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search procedures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex gap-2">
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text-secondary)] outline-none cursor-pointer"
        >
          <option value="">All Domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={packageFilter}
          onChange={(e) => setPackageFilter(e.target.value)}
          className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-white text-[var(--text-secondary)] outline-none cursor-pointer"
        >
          <option value="">All Packages</option>
          {packageNames.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Count label */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <span
          className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Procedures
        </span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent-ultra-light)] text-[var(--accent)]">
          {filtered.length}
        </span>
      </div>

      {/* Procedure list */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-12 gap-2">
            <p className="text-xs text-[var(--text-tertiary)]">No procedures found</p>
          </div>
        )}

        {filtered.map((proc) => {
          const isActive = selected?.id === proc.id;
          return (
            <button
              key={proc.id}
              onClick={() => onSelect(proc)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-[var(--accent-ultra-light)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <div className="truncate text-[13px] font-semibold">{proc.procedure_name}</div>
              <div className="flex items-center gap-1.5 mt-1 overflow-hidden">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] font-medium shrink-0">
                  {proc.domain}
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)] truncate min-w-0">{proc.package_name}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[var(--border)]">
        <p className="text-[11px] font-medium text-[var(--text-tertiary)]">
          {packages.length} packages &middot; {procedures.length} procedures
        </p>
      </div>
    </aside>
  );
}
