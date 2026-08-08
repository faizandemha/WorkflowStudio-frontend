"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Play, Loader2 } from "lucide-react";
import { api, type Execution, type ExecutionStep, ApiError } from "@/lib/api";
import { StatusPill } from "@/components/status-pill";

// Polling (not WebSockets) is the deliberate choice here: it's the honest
// version of "live status" for what's actually built — a WebSocket layer
// is a real future upgrade (and is on the resume's architecture), but
// polling a cheap GET every couple seconds is simple, correct, and doesn't
// pretend to be something it isn't.
const POLL_INTERVAL_MS = 1500;

type Props = {
  workflowId: string;
  onSteps?: (steps: ExecutionStep[]) => void;
  onRunStart?: () => void;
};

export function ExecutionPanel({ workflowId, onSteps, onRunStart }: Props) {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    onRunStart?.();
    try {
      const exec = await api.triggerExecution(workflowId);
      setExecution(exec);
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const [updated, steps] = await Promise.all([
            api.getExecution(exec.id),
            api.getExecutionSteps(exec.id),
          ]);
          setExecution(updated);
          onSteps?.(steps);
          if (updated.status === "succeeded" || updated.status === "failed" || updated.status === "cancelled") {
            stopPolling();
          }
        } catch {
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the API to trigger this run."
      );
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {execution && <StatusPill status={execution.status} />}
      {error && <span className="text-[12px] text-accent-red">{error}</span>}
      <button
        onClick={handleTrigger}
        disabled={triggering}
        className="flex items-center gap-2 rounded-md bg-accent-amber px-4 py-2 text-[13px] font-medium text-base transition-all duration-150 hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
      >
        {triggering ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} strokeWidth={2.5} />}
        Run workflow
      </button>
    </div>
  );
}
