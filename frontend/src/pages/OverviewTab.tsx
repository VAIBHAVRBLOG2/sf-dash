import Markdown from "react-markdown";
import { useApi } from "../hooks/useApi";
import { fetchProcedureOverview } from "../api/client";

interface OverviewTabProps {
  procedureName: string;
}

export default function OverviewTab({ procedureName }: OverviewTabProps) {
  const { data, loading, error } = useApi(
    () => fetchProcedureOverview(procedureName),
    [procedureName]
  );

  if (loading)
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-6 mt-1">
        <div className="w-2/3 h-5 skeleton mb-4" />
        <div className="w-full h-3 skeleton mb-2" />
        <div className="w-5/6 h-3 skeleton mb-2" />
        <div className="w-full h-3 skeleton mb-2" />
        <div className="w-3/4 h-3 skeleton mb-4" />
        <div className="w-1/2 h-4 skeleton mb-3" />
        <div className="w-full h-3 skeleton mb-2" />
        <div className="w-4/5 h-3 skeleton" />
      </div>
    );

  if (error || !data || data.detail)
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] p-8 mt-1 text-center">
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No overview available for this procedure
        </p>
      </div>
    );

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-6 mt-1 animate-fade-in">
      <div className="prose max-w-none">
        <Markdown>{data.procedure_overview}</Markdown>
      </div>
    </div>
  );
}
