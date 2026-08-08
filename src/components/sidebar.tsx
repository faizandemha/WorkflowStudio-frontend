import Link from "next/link";
import clsx from "clsx";
import { Workflow as WorkflowIcon, Activity, Settings, Zap } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Workflows", icon: WorkflowIcon },
  { href: "/executions", label: "Executions", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

// `open` only matters below the lg breakpoint — on lg+ the sidebar is
// always visible as a static column (see the lg:translate-x-0 override),
// so this prop and the transform classes are inert there. Kept as a plain
// prop-driven component (no internal state, no onClick) so it stays
// server-renderable; DashboardShell owns the toggle state and the backdrop
// interactivity that actually needs a client boundary.
export function Sidebar({ open }: { open: boolean }) {
  return (
    <aside
      className={clsx(
        "flex h-full w-60 shrink-0 flex-col border-r border-border bg-surface shadow-[1px_0_0_0_rgba(16,27,61,0.02),2px_0_12px_0_rgba(16,27,61,0.04)] transition-transform duration-200 ease-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center gap-2 px-1.5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-amber-dim text-accent-amber">
          <Zap size={20} strokeWidth={2.5} />
        </div>
        <span className="font-[family-name:var(--font-display)] text-[25px] font-medium tracking-tight">
          WorkflowStudio
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-2.5 rounded-md px-3 py-2 text-[20px] font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Icon size={25} strokeWidth={1.75} className="text-text-tertiary group-hover:text-text-secondary" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto px-5 py-4 text-[11px] text-text-tertiary">
        <p className="font-mono">v0.1.0-dev</p>
      </div>
    </aside>
  );
}
