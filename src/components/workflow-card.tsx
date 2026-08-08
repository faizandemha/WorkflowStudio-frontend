"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, GitBranch, Trash2 } from "lucide-react";
import type { Workflow } from "@/lib/api";
import { api, ApiError } from "@/lib/api";
import { GraphThumbnail } from "@/components/graph-thumbnail";
import { ConfirmDialog } from "@/components/confirm-dialog";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function WorkflowCard({ workflow, index = 0 }: { workflow: Workflow; index?: number }) {
  const router = useRouter();
  const nodeCount = workflow.definition.nodes.length;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteWorkflow(workflow.id);
      // The dashboard's workflow list lives in a server component — a
      // router.refresh() re-runs that fetch rather than us maintaining a
      // separate client-side copy of the list just to remove one item
      // from it locally.
      router.refresh();
    } catch (err) {
      setDeleting(false);
      setConfirmOpen(false);
      setError(err instanceof ApiError ? err.message : "Couldn't delete this workflow.");
    }
  }

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-200 ease-out hover:border-border-strong hover:bg-surface-hover hover:-translate-y-0.5 hover:shadow-lg animate-card-in"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 text-text-tertiary opacity-0 backdrop-blur-sm transition-opacity hover:bg-accent-red-dim hover:text-accent-red group-hover:opacity-100 focus-visible:opacity-100"
        aria-label={`Delete ${workflow.name}`}
      >
        <Trash2 size={14} />
      </button>

      <Link href={`/workflows/${workflow.id}`} className="flex flex-1 flex-col">
        <div className="border-b border-border bg-base/40 px-4 pt-4">
          <GraphThumbnail definition={workflow.definition} className="h-20 w-full" />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2 pr-6">
            <h3 className="font-[family-name:var(--font-display)] text-[15px] font-medium leading-snug text-text-primary">
              {workflow.name}
            </h3>
            <span
              className={
                workflow.is_active
                  ? "shrink-0 rounded-full bg-accent-teal-dim px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-accent-teal"
                  : "shrink-0 rounded-full bg-surface-raised px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-tertiary"
              }
            >
              {workflow.is_active ? "Active" : "Paused"}
            </span>
          </div>

          {workflow.description && (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-text-secondary">
              {workflow.description}
            </p>
          )}

          <div className="mt-auto flex items-center gap-4 pt-1 font-mono text-[11px] text-text-tertiary">
            <span className="flex items-center gap-1.5">
              <GitBranch size={12} strokeWidth={2} />
              {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} strokeWidth={2} />
              {relativeTime(workflow.updated_at)}
            </span>
          </div>

          {error && <p className="text-[11px] text-accent-red">{error}</p>}
        </div>
      </Link>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this workflow?"
        message={`"${workflow.name}" and its entire run history will be permanently deleted. This can't be undone.`}
        pending={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
