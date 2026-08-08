"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, ChevronRight, RefreshCw, Code2 } from "lucide-react";
import clsx from "clsx";
import { api, type Execution, type ExecutionStep } from "@/lib/api";
import { StatusPill } from "@/components/status-pill";

type Props = {
  workflowId: string;
  open: boolean;
  onClose: () => void;
  refreshSignal: number;
};

function formatDuration(started?: string, finished?: string): string | null {
  if (!started || !finished) return null;
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
    second: "2-digit",
  });
}

// Shared expand/collapse mechanism: a CSS grid row transitioning between
// 0fr and 1fr. This is the one CSS-only technique that animates to/from
// "auto" height smoothly — a plain max-height transition either clips
// tall content or needs a hardcoded guess, and JS-measured heights add a
// layout thrash on every toggle. Grid rows don't have that problem.
function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function ExecutionHistoryPanel({ workflowId, open, onClose, refreshSignal }: Props) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.listExecutions(workflowId, 30);
      setExecutions(list);
    } catch {
      setError("Couldn't load execution history.");
    } finally {
      setLoading(false);
    }
  }, [workflowId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) load();
  }, [open, refreshSignal, load]);

  return (
    <div
      className={clsx(
        "fixed inset-0 z-40 flex justify-end transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={clsx(
          "relative flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-[14px] font-medium text-text-primary">
              Run history
            </h2>
            <p className="mt-0.5 text-[11px] text-text-tertiary">Last 30 executions</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={load}
              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label="Refresh"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && <p className="p-4 text-[13px] text-accent-red">{error}</p>}

          {!error && !loading && executions.length === 0 && (
            <p className="p-4 text-[13px] text-text-tertiary">No runs yet. Trigger this workflow to see history here.</p>
          )}

          {executions.map((exec, i) => (
            <ExecutionRow
              key={exec.id}
              execution={exec}
              expanded={expandedId === exec.id}
              onToggle={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
              // Small entrance stagger, capped so a long history doesn't
              // make the last row visibly wait — 25ms/row up to 200ms.
              enterDelayMs={Math.min(i * 25, 200)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExecutionRow({
  execution,
  expanded,
  onToggle,
  enterDelayMs,
}: {
  execution: Execution;
  expanded: boolean;
  onToggle: () => void;
  enterDelayMs: number;
}) {
  const [steps, setSteps] = useState<ExecutionStep[] | null>(null);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), enterDelayMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToggle() {
    onToggle();
    if (steps === null) {
      setLoadingSteps(true);
      api
        .getExecutionSteps(execution.id)
        .then(setSteps)
        .catch(() => setSteps([]))
        .finally(() => setLoadingSteps(false));
    }
  }

  const duration = formatDuration(execution.started_at, execution.finished_at);

  return (
    <div
      className={clsx(
        "border-b border-border transition-all duration-300 ease-out",
        mounted ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      )}
    >
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <div className="flex min-w-0 items-center gap-3">
          <ChevronDown
            size={14}
            className={clsx("shrink-0 text-text-tertiary transition-transform duration-200", expanded && "rotate-180")}
          />
          <div className="min-w-0">
            <p className="font-mono text-[12px] text-text-secondary">{formatTimestamp(execution.created_at)}</p>
            {execution.error && (
              <p className="mt-0.5 truncate text-[11px] text-accent-red">{execution.error}</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {duration && <span className="font-mono text-[11px] text-text-tertiary">{duration}</span>}
          <StatusPill status={execution.status} />
        </div>
      </button>

      <Collapsible open={expanded}>
        <div className="border-t border-border bg-base/40 px-4 py-3">
          {loadingSteps && <p className="text-[12px] text-text-tertiary">Loading steps…</p>}
          {!loadingSteps && steps && steps.length === 0 && (
            <p className="text-[12px] text-text-tertiary">No step data recorded for this run.</p>
          )}
          {!loadingSteps && steps && steps.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </ul>
          )}
        </div>
      </Collapsible>
    </div>
  );
}

// A step's raw input/output is exactly what answers "what did this node
// actually do" — the question that prompted building this. Nested one
// level inside the run it belongs to, collapsed by default so the common
// case (glancing at which nodes ran) still reads as a short list.
function StepRow({ step }: { step: ExecutionStep }) {
  const [open, setOpen] = useState(false);
  const hasData = (step.input && Object.keys(step.input).length > 0) || (step.output && Object.keys(step.output).length > 0);

  return (
    <li className="rounded-md border border-border bg-surface">
      <button
        onClick={() => hasData && setOpen(!open)}
        className={clsx(
          "flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-[12px]",
          hasData && "transition-colors hover:bg-surface-hover"
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {hasData ? (
            <ChevronRight size={11} className={clsx("shrink-0 text-text-tertiary transition-transform duration-150", open && "rotate-90")} />
          ) : (
            <span className="w-[11px] shrink-0" />
          )}
          <span className="truncate font-mono text-text-secondary">
            {step.node_id} <span className="text-text-tertiary">({step.node_type})</span>
          </span>
        </div>
        <StatusPill status={step.status} />
      </button>

      {step.error && <p className="px-2.5 pb-2 text-[11px] text-accent-red">{step.error}</p>}

      {hasData && (
        <Collapsible open={open}>
          <div className="space-y-2 border-t border-border p-2.5">
            {step.input && Object.keys(step.input).length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wide text-text-tertiary">
                  <Code2 size={9} /> Input
                </p>
                <pre className="overflow-x-auto rounded bg-base p-2 font-mono text-[10.5px] leading-relaxed text-text-secondary">
                  {JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            )}
            {step.output && Object.keys(step.output).length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-wide text-text-tertiary">
                  <Code2 size={9} /> Output
                </p>
                <pre className="overflow-x-auto rounded bg-base p-2 font-mono text-[10.5px] leading-relaxed text-text-secondary">
                  {JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Collapsible>
      )}
    </li>
  );
}
