import { useApi } from "../hooks/useApi";
import { fetchProcedureGraph } from "../api/client";
import type { ProcedureGraph } from "../types";
import type { ReactNode } from "react";

function SectionCard({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-5 mt-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--accent-ultra-light)] text-[var(--accent)]">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "green" | "amber" }) {
  const styles: Record<string, string> = {
    default: "bg-[var(--surface-tertiary)] text-[var(--text-secondary)]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mr-1.5 mb-1.5 ${styles[variant]}`}>
      {children}
    </span>
  );
}

interface TablesQueriesTabProps {
  procedureName: string;
}

export default function TablesQueriesTab({ procedureName }: TablesQueriesTabProps) {
  const { data, loading, error } = useApi<ProcedureGraph>(
    () => fetchProcedureGraph(procedureName),
    [procedureName]
  );

  if (loading)
    return (
      <div className="flex flex-col gap-4 mt-1">
        <div className="bg-white rounded-xl border border-[var(--border)] p-5">
          <div className="w-32 h-4 skeleton mb-4" />
          <div className="w-full h-8 skeleton mb-2" />
          <div className="w-full h-8 skeleton mb-2" />
          <div className="w-full h-8 skeleton" />
        </div>
        <div className="bg-white rounded-xl border border-[var(--border)] p-5">
          <div className="w-24 h-4 skeleton mb-4" />
          <div className="w-full h-20 skeleton" />
        </div>
      </div>
    );

  if (error || !data || data.detail)
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-8 mt-1 text-center">
        <p className="text-sm font-medium text-[var(--text-secondary)]">No data available.</p>
      </div>
    );

  const { tables = [], queries = [] } = data;

  return (
    <div className="mt-1">
      <SectionCard title="Tables Used" count={tables.length}>
        {tables.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No tables referenced</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-tertiary)]">
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Table</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Schema</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Operations</th>
                  <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Columns</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border-light)] hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <td className="px-3 py-2 text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {t.table_name}
                    </td>
                    <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{t.schema_name}</td>
                    <td className="px-3 py-2"><Badge variant="green">{t.operations}</Badge></td>
                    <td className="px-3 py-2">
                      {(t.columns ?? []).map((c) => (
                        <Badge key={c}>{c}</Badge>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Queries" count={queries.length}>
        {queries.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)]">No queries found</p>
        ) : (
          <div className="space-y-3">
            {queries.map((q, i) => (
              <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <Badge variant="amber">{q.query_type}</Badge>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Tables: {(q.tables ?? []).join(", ")}
                  </span>
                </div>
                <pre
                  className="text-xs whitespace-pre-wrap break-words rounded-lg p-3 bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border-light)]"
                  style={{ fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                >
                  {q.raw_query}
                </pre>
                {q.conditions?.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-[var(--border-light)]">
                    <span
                      className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      Conditions
                    </span>
                    <div className="mt-1.5">
                      {q.conditions.map((c, j) => (
                        <Badge key={j}>{c}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
