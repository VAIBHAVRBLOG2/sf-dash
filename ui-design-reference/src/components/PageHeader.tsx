import { Loader2 } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  loading?: boolean;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, loading, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2
          className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
          {loading && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-[var(--text-tertiary)]" />}
        </h2>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
