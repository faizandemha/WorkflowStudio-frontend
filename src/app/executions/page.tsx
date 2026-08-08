"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Activity, WifiOff, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatusPill } from "@/components/status-pill";
import { api, ApiError, type ExecutionWithWorkflow } from "@/lib/api";

function formatDuration(started?: string, finished?: string): string {
  if (!started || !finished) return "—";
  const ms = new Date(finished).getTime() - new Date(started).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PAGE_SIZE = 25;

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExecutionWithWorkflow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listAllExecutions(PAGE_SIZE, nextOffset);
      setExecutions(res.executions);
      setTotal(res.total);
      setOffset(nextOffset);
    } catch (err) {
      setExecutions([]);
      setError(
        err instanceof ApiError
          ? err.message
          : "Can't reach the WorkflowStudio API. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // This page's whole reason for existing is showing live data across
    // every workflow — fetching on mount is the correct trigger here, not
    // an event handler, since there's no user action that precedes the
    // page simply being opened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(0);
  }, [load]);

  const hasNextPage = offset + PAGE_SIZE < total;
  const hasPrevPage = offset > 0;

  return (
    <DashboardShell>
      <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-text-primary sm:text-2xl">
            Executions
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            {total > 0 ? `${total} execution${total === 1 ? "" : "s"} across all workflows` : "Every run, across every workflow"}
          </p>
        </div>
        <button
          onClick={() => load(offset)}
          className="flex items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-surface-hover sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </header>

      <div className="p-4 sm:p-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-accent-red/30 bg-accent-red-dim px-4 py-3 text-[13px] text-accent-red">
            <WifiOff size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Can&apos;t reach the API</p>
              <p className="mt-0.5 text-accent-red/80">{error}</p>
            </div>
          </div>
        )}

        {!error && !loading && executions.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center sm:py-24">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-amber-dim text-accent-amber">
              <Activity size={20} strokeWidth={2} />
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-[17px] font-medium text-text-primary">
              No executions yet
            </h2>
            <p className="mt-1.5 max-w-xs px-4 text-[13px] text-text-secondary">
              Run any workflow and its execution will show up here.
            </p>
          </div>
        )}

        {executions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface text-[11px] uppercase tracking-wide text-text-tertiary">
                  <th className="px-4 py-3 font-medium">Workflow</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec) => (
                  <tr key={exec.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                    <td className="px-4 py-3">
                      <Link
                        href={`/workflows/${exec.workflow_id}`}
                        className="font-medium text-text-primary hover:text-accent-amber"
                      >
                        {exec.workflow_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={exec.status} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-secondary">
                      {formatTimestamp(exec.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-tertiary">
                      {formatDuration(exec.started_at, exec.finished_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(hasPrevPage || hasNextPage) && (
          <div className="mt-4 flex items-center justify-between text-[13px]">
            <button
              onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
              disabled={!hasPrevPage}
              className="rounded-md border border-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-text-tertiary">
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button
              onClick={() => load(offset + PAGE_SIZE)}
              disabled={!hasNextPage}
              className="rounded-md border border-border px-3 py-1.5 text-text-secondary transition-colors hover:bg-surface-hover disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
