const GraphIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const LogoIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h16" />
    <circle cx="18" cy="12" r="2" fill="currentColor" opacity=".6" />
  </svg>
);

interface HeaderProps {
  onGraphView: () => void;
  graphViewOpen: boolean;
}

export default function Header({ onGraphView, graphViewOpen }: HeaderProps) {
  return (
    <header className="fixed top-0 left-[var(--sidebar-width)] right-0 z-40 bg-white border-b border-[var(--border)] flex items-center justify-between px-6 h-14">
      <div />
      <div className="flex items-center gap-2">
        <button
          onClick={onGraphView}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            graphViewOpen
              ? "bg-[var(--text-primary)] text-white"
              : "bg-[var(--accent)] text-white hover:opacity-90"
          }`}
        >
          <GraphIcon />
          <span>{graphViewOpen ? "Close Graph" : "Graph View"}</span>
        </button>
      </div>
    </header>
  );
}
