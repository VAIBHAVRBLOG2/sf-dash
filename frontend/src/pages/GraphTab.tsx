import { useApi } from "../hooks/useApi";
import { fetchProcedureGraph } from "../api/client";
import type { ProcedureGraph } from "../types";
import type { ReactNode } from "react";

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
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

function Badge({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "outline" | "green" | "amber" }) {
  const styles: Record<string, string> = {
    default: "bg-[var(--surface-tertiary)] text-[var(--text-secondary)]",
    outline: "bg-transparent text-[var(--text-secondary)] border border-[var(--border)]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium mr-1.5 mb-1.5 ${styles[variant]}`}>
      {children}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors">
      <span className="text-xs font-medium text-[var(--text-tertiary)] min-w-[80px] shrink-0">{label}</span>
      <span className="text-sm text-[var(--text-primary)]">{value ?? "—"}</span>
    </div>
  );
}

interface GraphTabProps {
  procedureName: string;
}

export default function GraphTab({ procedureName }: GraphTabProps) {
  const { data, loading, error } = useApi<ProcedureGraph>(
    () => fetchProcedureGraph(procedureName),
    [procedureName]
  );

  if (loading)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="w-32 h-4 skeleton mb-4" />
            <div className="w-full h-3 skeleton mb-2" />
            <div className="w-3/4 h-3 skeleton mb-2" />
            <div className="w-5/6 h-3 skeleton" />
          </div>
        ))}
      </div>
    );

  if (error || !data || data.detail)
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-8 mt-1 text-center">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No graph data available for this procedure.
        </p>
      </div>
    );

  const {
    procedure = {} as ProcedureGraph["procedure"],
    parameters = [],
    tables = [],
    queries = [],
    called_procedures = [],
    packages = [],
    functions = [],
    exception_handlers = [],
  } = data;

  return (
    <div className="mt-1">
      {/* Top row: Procedure Info + Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Procedure Info">
          <div className="divide-y divide-[var(--border-light)]">
            <InfoRow label="Name" value={procedure.procedure_name} />
            <InfoRow label="Package" value={procedure.package_name} />
            <InfoRow label="Domain" value={procedure.domain} />
            <InfoRow label="Version" value={procedure.version} />
          </div>
        </Section>

        <Section title="Parameters" count={parameters.length}>
          {parameters.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No parameters defined</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-tertiary)]">
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Name</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Type</th>
                    <th className="text-left text-xs font-medium text-[var(--text-tertiary)] px-3 py-2">Dir</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((p, i) => (
                    <tr key={i} className="border-t border-[var(--border-light)] hover:bg-[var(--surface-secondary)] transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
                        {p.parameter_name}
                      </td>
                      <td className="px-3 py-2 text-sm text-[var(--text-secondary)]">{p.parameter_type}</td>
                      <td className="px-3 py-2">
                        <Badge variant={p.direction === "IN" ? "green" : "amber"}>{p.direction}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>

      {/* Tables */}
      <div className="mt-3">
        <Section title="Tables" count={tables.length}>
          {tables.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No tables referenced</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tables.map((t, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
                      {t.table_name}
                    </span>
                    <Badge variant="green">{t.operations}</Badge>
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mb-2">Schema: {t.schema_name}</div>
                  <div>
                    {(t.columns ?? []).map((c) => (
                      <Badge key={c} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Queries */}
      <div className="mt-3">
        <Section title="Queries" count={queries.length}>
          {queries.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No queries found</p>
          ) : (
            <div className="space-y-3">
              {queries.map((q, i) => (
                <div key={i} className="rounded-lg border border-[var(--border)] p-4">
                  <Badge variant="amber">{q.query_type}</Badge>
                  <pre
                    className="text-xs mt-2.5 p-3 rounded-lg whitespace-pre-wrap break-words bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border-light)]"
                    style={{ fontFamily: "var(--font-mono)", lineHeight: 1.6 }}
                  >
                    {q.raw_query}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Called Procedures + Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
        <Section title="Called Procedures" count={called_procedures.length}>
          {called_procedures.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No external calls</p>
          ) : (
            <div className="flex flex-wrap">
              {called_procedures.map((cp, i) => (
                <Badge key={i}>{cp}</Badge>
              ))}
            </div>
          )}
        </Section>

        <Section title="Packages" count={packages.length}>
          {packages.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No packages</p>
          ) : (
            <div className="space-y-1">
              {packages.map((pk, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--surface-secondary)] transition-colors">
                  <span className="text-sm font-medium text-[var(--text-primary)]" style={{ fontFamily: "var(--font-mono)" }}>
                    {pk.package_name}
                  </span>
                  <Badge variant="outline">{pk.relation_type}</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* Functions + Exception Handlers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3 mb-4">
        <Section title="Functions" count={functions.length}>
          {functions.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No functions</p>
          ) : (
            <div className="flex flex-wrap">
              {functions.map((f, i) => (
                <Badge key={i}>{f}</Badge>
              ))}
            </div>
          )}
        </Section>

        <Section title="Exception Handlers" count={exception_handlers.length}>
          {exception_handlers.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)]">No exception handlers</p>
          ) : (
            <div className="flex flex-wrap">
              {exception_handlers.map((e, i) => (
                <Badge key={i} variant="amber">{e}</Badge>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
