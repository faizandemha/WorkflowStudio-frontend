import clsx from "clsx";
import type { ExecutionStatus } from "@/lib/api";

const STATUS_STYLES: Record<ExecutionStatus, { label: string; className: string; dot: string }> = {
  pending: {
    label: "Pending",
    className: "text-text-secondary bg-surface-raised border-border",
    dot: "bg-text-tertiary",
  },
  running: {
    label: "Running",
    className: "text-accent-amber bg-accent-amber-dim border-accent-amber/30",
    dot: "bg-accent-amber",
  },
  succeeded: {
    label: "Succeeded",
    className: "text-accent-teal bg-accent-teal-dim border-accent-teal/30",
    dot: "bg-accent-teal",
  },
  failed: {
    label: "Failed",
    className: "text-accent-red bg-accent-red-dim border-accent-red/30",
    dot: "bg-accent-red",
  },
  cancelled: {
    label: "Cancelled",
    className: "text-text-secondary bg-surface-raised border-border",
    dot: "bg-text-tertiary",
  },
  skipped: {
    label: "Skipped",
    className: "text-text-tertiary bg-surface-raised border-border",
    dot: "bg-text-tertiary",
  },
};

export function StatusPill({ status }: { status: ExecutionStatus }) {
  const style = STATUS_STYLES[status];
  const isLive = status === "running";

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider",
        style.className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isLive && (
          <span className={clsx("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", style.dot)} />
        )}
        <span className={clsx("relative inline-flex h-1.5 w-1.5 rounded-full", style.dot)} />
      </span>
      {style.label}
    </span>
  );
}
