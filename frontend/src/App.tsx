import { useState, useEffect } from "react";
import { useApi } from "./hooks/useApi";
import { fetchProcedures, fetchPackages } from "./api/client";
import type { Procedure } from "./types";

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TabBar from "./components/TabBar";
import type { TabKey } from "./components/TabBar";
import OverviewTab from "./pages/OverviewTab";
import TablesQueriesTab from "./pages/TablesQueriesTab";
import GraphTab from "./pages/GraphTab";
import KnowledgeGraphView from "./pages/KnowledgeGraphView";

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selected, setSelected] = useState<Procedure | null>(null);
  const [graphViewOpen, setGraphViewOpen] = useState(false);

  const { data: procData, loading: procLoading } = useApi(() => fetchProcedures());
  const { data: pkgData } = useApi(() => fetchPackages());

  const procedures = procData?.procedures ?? [];
  const packages = pkgData?.packages ?? [];

  useEffect(() => {
    if (!selected && procedures.length > 0) {
      setSelected(procedures[0]);
    }
  }, [procedures, selected]);

  const handleSelect = (proc: Procedure) => {
    setSelected(proc);
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-[var(--surface-secondary)]">
      <Sidebar
        procedures={procedures}
        packages={packages}
        selected={selected}
        onSelect={handleSelect}
      />

      <Header onGraphView={() => setGraphViewOpen((v) => !v)} graphViewOpen={graphViewOpen} />

      <main className="ml-[var(--sidebar-width)] pt-14 min-h-screen">
        {graphViewOpen ? (
          <KnowledgeGraphView onClose={() => setGraphViewOpen(false)} />
        ) : (
        <div className="p-6 max-w-7xl mx-auto">
          {procLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <div className="w-10 h-10 rounded-xl skeleton" />
              <div className="w-48 h-3 skeleton" />
              <div className="w-32 h-3 skeleton" />
            </div>
          ) : selected ? (
            <div className="animate-fade-in">
              {/* Procedure header */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {selected.procedure_name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-ultra-light)] text-[var(--accent)] font-semibold uppercase">
                    {selected.domain}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">{selected.package_name}</span>
                  <span className="text-sm text-[var(--text-tertiary)]">v{selected.version}</span>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-white rounded-xl border border-[var(--border)] p-4">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Version</p>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mt-1">{selected.version}</p>
                </div>
                <div className="bg-white rounded-xl border border-[var(--border)] p-4">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Tables</p>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mt-1">{selected.table_count}</p>
                </div>
                <div className="bg-white rounded-xl border border-[var(--border)] p-4">
                  <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Dependencies</p>
                  <p className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] mt-1">{selected.called_procedures_count}</p>
                </div>
                <div className="bg-[var(--accent)] rounded-xl p-4">
                  <p className="text-xs font-medium text-white/70 uppercase tracking-wider" style={{ fontFamily: "var(--font-heading)" }}>Domain</p>
                  <p className="text-2xl font-semibold tracking-tight text-white mt-1 capitalize">{selected.domain}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-5">
                <TabBar active={activeTab} onChange={setActiveTab} />
              </div>

              {/* Tab content */}
              <div key={`${selected.procedure_name}-${activeTab}`} className="animate-fade-in">
                {activeTab === "overview" && <OverviewTab procedureName={selected.procedure_name} />}
                {activeTab === "tables" && <TablesQueriesTab procedureName={selected.procedure_name} />}
                {activeTab === "graph" && <GraphTab procedureName={selected.procedure_name} />}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
              <div className="w-14 h-14 rounded-xl bg-[var(--accent-ultra-light)] flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text-secondary)]">Select a procedure from the sidebar</p>
              <p className="text-xs text-[var(--text-tertiary)]">Choose a stored procedure to explore its details</p>
            </div>
          )}
        </div>
        )}
      </main>

    </div>
  );
}

export default function App() {
  return <Dashboard />;
}
